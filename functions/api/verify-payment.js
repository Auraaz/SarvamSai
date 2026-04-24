function toHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a, b) {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let mismatch = 0;
  for (let i = 0; i < aBytes.length; i += 1) {
    mismatch |= aBytes[i] ^ bBytes[i];
  }
  return mismatch === 0;
}

async function createRazorpaySignature(orderId, paymentId, secret) {
  const payload = `${orderId}|${paymentId}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(signed);
}

function normalizeItems(itemsRaw) {
  if (!Array.isArray(itemsRaw)) return [];
  return itemsRaw
    .map((item) => ({
      type: item?.type === "self" ? "self" : "gift",
      name: String(item?.name || "").trim(),
      phone: String(item?.phone || "").trim(),
      addressLine1: String(item?.addressLine1 || "").trim(),
      addressLine2: String(item?.addressLine2 || "").trim(),
      city: String(item?.city || "").trim(),
      state: String(item?.state || "").trim(),
      pincode: String(item?.pincode || "").trim(),
      country: String(item?.country || "").trim()
    }))
    .filter((item) => item.name || item.addressLine1 || item.phone);
}

async function ensureOrdersTable(db) {
  await db
    .prepare(
      `
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          order_id TEXT NOT NULL,
          payment_id TEXT NOT NULL,
          total_items INTEGER DEFAULT 0,
          total_amount REAL DEFAULT 0,
          currency TEXT DEFAULT 'INR',
          status TEXT DEFAULT 'confirmed',
          items_json TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `
    )
    .run();

  await db.prepare("CREATE INDEX IF NOT EXISTS idx_orders_email_created_at ON orders(email, created_at DESC)").run();
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id)").run();
  await db
    .prepare(
      `
        CREATE TABLE IF NOT EXISTS order_items (
          id TEXT PRIMARY KEY,
          payment_id TEXT NOT NULL,
          order_id TEXT NOT NULL,
          email TEXT NOT NULL,
          item_index INTEGER NOT NULL,
          item_type TEXT,
          recipient_name TEXT,
          recipient_phone TEXT,
          address_line1 TEXT,
          address_line2 TEXT,
          city TEXT,
          state TEXT,
          pincode TEXT,
          country TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `
    )
    .run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_order_items_payment_id ON order_items(payment_id)").run();
}

async function upsertOrderRecord(db, order) {
  await ensureOrdersTable(db);
  await db
    .prepare(
      `
        INSERT INTO orders (
          id, email, order_id, payment_id, total_items, total_amount, currency, status, items_json, created_at
        )
        VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(payment_id)
        DO UPDATE SET
          email = excluded.email,
          order_id = excluded.order_id,
          total_items = excluded.total_items,
          total_amount = excluded.total_amount,
          currency = excluded.currency,
          status = excluded.status,
          items_json = excluded.items_json
      `
    )
    .bind(
      order.email,
      order.orderId,
      order.paymentId,
      order.totalItems,
      order.totalAmount,
      order.currency,
      order.status,
      JSON.stringify(order.items || [])
    )
    .run();

  await db.prepare("DELETE FROM order_items WHERE payment_id = ?").bind(order.paymentId).run();
  const items = Array.isArray(order.items) ? order.items : [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index] || {};
    await db
      .prepare(
        `
          INSERT INTO order_items (
            id, payment_id, order_id, email, item_index, item_type,
            recipient_name, recipient_phone, address_line1, address_line2,
            city, state, pincode, country, created_at
          )
          VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `
      )
      .bind(
        order.paymentId,
        order.orderId,
        order.email,
        index,
        String(item.type || ""),
        String(item.name || ""),
        String(item.phone || ""),
        String(item.addressLine1 || ""),
        String(item.addressLine2 || ""),
        String(item.city || ""),
        String(item.state || ""),
        String(item.pincode || ""),
        String(item.country || "")
      )
      .run();
  }
}

async function sendOrderConfirmationEmail(env, order) {
  const mailerUrl = String(env.MAILER_WORKER_URL || "").trim();
  const mailerToken = String(env.MAILER_WORKER_TOKEN || "").trim();
  if (!mailerUrl || !mailerToken) return;
  if (!order?.email) return;

  const recipients = Array.isArray(order.items) ? order.items : [];
  const recipientLines = recipients.length
    ? recipients
        .map((item, index) => {
          const address = [
            item.addressLine1,
            item.addressLine2,
            [item.city, item.state].filter(Boolean).join(", "),
            [item.pincode, item.country].filter(Boolean).join(", ")
          ]
            .filter(Boolean)
            .join(", ");
          return `${index + 1}. ${item.name || "-"} | ${item.phone || "-"} | ${address || "-"}`;
        })
        .join("\n")
    : "No recipient details available.";

  const text = [
    "Your SarvamSai order is confirmed.",
    "",
    `Email: ${order.email}`,
    `Order ID: ${order.orderId}`,
    `Payment ID: ${order.paymentId}`,
    `Total Pieces: ${order.totalItems}`,
    `Total Amount: ${order.totalAmount} ${order.currency || "INR"}`,
    "",
    "Shipping / Recipient Details:",
    recipientLines
  ].join("\n");

  await fetch(mailerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mailerToken}`
    },
    body: JSON.stringify({
      to: order.email,
      subject: "SarvamSai Order Confirmation",
      text
    })
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    email,
    items,
    totalItems,
    totalAmount,
    currency
  } = await request.json();

  if (!env.RAZORPAY_KEY_SECRET) {
    return Response.json({ success: false, error: "RAZORPAY_KEY_SECRET is not configured." }, { status: 500 });
  }
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return Response.json({ success: false, error: "Missing required payment verification fields." }, { status: 400 });
  }

  const expected = await createRazorpaySignature(razorpay_order_id, razorpay_payment_id, env.RAZORPAY_KEY_SECRET);
  if (!timingSafeEqualHex(expected, String(razorpay_signature))) {
    return Response.json({ success: false }, { status: 400 });
  }

  if (!env.DB) {
    return Response.json(
      { success: false, error: "Payment verified but D1 DB is not configured, so order cannot be stored." },
      { status: 500 }
    );
  }

  const orderRecord = {
    email: String(email || "").trim().toLowerCase(),
    orderId: String(razorpay_order_id || "").trim(),
    paymentId: String(razorpay_payment_id || "").trim(),
    totalItems: Math.max(0, Number(totalItems) || normalizeItems(items).length),
    totalAmount: Math.max(0, Number(totalAmount) || 0),
    currency: String(currency || "INR").trim().toUpperCase() || "INR",
    status: "confirmed",
    items: normalizeItems(items)
  };

  if (!orderRecord.email) {
    return Response.json(
      { success: false, error: "Payment verified but email is missing in verification payload." },
      { status: 400 }
    );
  }
  if (!orderRecord.items.length) {
    return Response.json(
      { success: false, error: "Payment verified but shipping details are missing. Please retry checkout." },
      { status: 400 }
    );
  }

  try {
    await upsertOrderRecord(env.DB, orderRecord);
  } catch (error) {
    return Response.json(
      { success: false, error: `Payment verified but order storage failed: ${String(error?.message || error)}` },
      { status: 500 }
    );
  }

  try {
    await sendOrderConfirmationEmail(env, orderRecord);
  } catch (_error) {
    // Non-blocking: order is already stored and confirmed.
  }

  return Response.json({ success: true });
}
