/**
 * Fetches captured Razorpay payments using env RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET,
 * inserts missing rows into D1 `orders` (by payment_id), optional Apps Script notify.
 * Shipping is restored from Razorpay order notes when create-order saved them.
 * Auth: ADMIN_DASHBOARD_TOKEN (query, header bearer, or JSON body.token).
 *
 * POST JSON body (optional):
 *   { "count": 100, "skip": 0, "dryRun": false, "syncToSheet": false, "token": "..." }
 *
 * GET query: ?token=...&count=100&skip=0&dryRun=1&syncToSheet=0
 */

import {
  checkoutEmailFromNotes,
  parseCheckoutItemsFromNotes
} from "./razorpay-shipping-notes.js";

function unauthorized() {
  return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

function readToken(request, body) {
  const url = new URL(request.url);
  const queryToken = String(url.searchParams.get("token") || "").trim();
  if (queryToken) return queryToken;
  const authHeader = String(request.headers.get("authorization") || "").trim();
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  if (body && typeof body.token === "string") return String(body.token).trim();
  return "";
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

function razorpayBasicAuth(env) {
  const id = String(env.RAZORPAY_KEY_ID || "").trim();
  const secret = String(env.RAZORPAY_KEY_SECRET || "").trim();
  if (!id || !secret) return "";
  return `Basic ${btoa(`${id}:${secret}`)}`;
}

function paymentEmail_(payment) {
  const email = String(payment?.email || payment?.contact || "")
    .trim()
    .toLowerCase();
  if (email.includes("@")) return email;
  const id = String(payment?.id || "").trim();
  return id ? `reconcile+${id}@sarvamsai.in` : "reconcile@sarvamsai.in";
}

function amountInrFromRazorpayPayment(payment) {
  const paise = Number(payment?.amount);
  if (!Number.isFinite(paise)) return 0;
  return Math.max(0, paise / 100);
}

async function sendOrderToGoogleScript(env, row) {
  const googleScriptUrl = String(env.GOOGLE_SCRIPT_URL || "").trim();
  if (!googleScriptUrl) return { skipped: true, reason: "no_GOOGLE_SCRIPT_URL" };
  if (!row?.email) return { skipped: true, reason: "no_email" };

  const items = Array.isArray(row?.items) ? row.items : [];
  const primary = items[0] || {};
  const shippingAddress = [
    String(primary.addressLine1 || "").trim(),
    String(primary.addressLine2 || "").trim(),
    String(primary.city || "").trim(),
    String(primary.state || "").trim(),
    String(primary.pincode || "").trim(),
    String(primary.country || "").trim()
  ]
    .filter(Boolean)
    .join(", ");

  const upstream = await fetch(googleScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "recordOrderPayment",
      id: row.orderId,
      payment_id: row.paymentId,
      email: row.email,
      amount_inr: row.totalAmount,
      status: "paid",
      total_items: row.totalItems,
      phone: String(primary.phone || "").trim(),
      shipping_address: shippingAddress,
      order_date: row.createdAt || new Date().toISOString()
    })
  });
  const responseJson = await upstream.json().catch(() => ({}));
  const ok = upstream.ok && responseJson?.success !== false;
  if (!ok) {
    throw new Error(responseJson?.error || `Apps Script returned ${upstream.status}`);
  }
  return { skipped: false };
}

async function orderExists(db, paymentId) {
  const res = await db
    .prepare("SELECT 1 as ok FROM orders WHERE payment_id = ? LIMIT 1")
    .bind(paymentId)
    .first();
  return Boolean(res?.ok);
}

async function fetchRazorpayOrder(authHeader, orderId) {
  const id = String(orderId || "").trim();
  if (!id) return null;
  const res = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(id)}`, {
    headers: { Authorization: authHeader }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return null;
  return data;
}

async function resolveOrderNotes(authHeader, payment) {
  const paymentNotes = payment?.notes;
  if (paymentNotes && typeof paymentNotes === "object" && Object.keys(paymentNotes).length) {
    return paymentNotes;
  }
  const orderId = String(payment?.order_id || "").trim();
  if (!orderId) return {};
  const order = await fetchRazorpayOrder(authHeader, orderId);
  return order?.notes && typeof order.notes === "object" ? order.notes : {};
}

async function insertOrderItems(db, orderId, paymentId, email, items) {
  await db.prepare("DELETE FROM order_items WHERE payment_id = ?").bind(paymentId).run();
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
        paymentId,
        orderId,
        email,
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

async function insertOrderFromRazorpay(db, payment, authHeader) {
  const paymentId = String(payment?.id || "").trim();
  const orderId = String(payment?.order_id || "").trim();
  if (!paymentId || !orderId) return { ok: false, error: "missing_ids" };

  const orderNotes = await resolveOrderNotes(authHeader, payment);
  const items = parseCheckoutItemsFromNotes(orderNotes);
  const email = checkoutEmailFromNotes(orderNotes, paymentEmail_(payment));
  const totalAmount = amountInrFromRazorpayPayment(payment);
  const currency = String(payment?.currency || "INR").trim().toUpperCase() || "INR";
  const totalItems = Math.max(0, items.length);
  const itemsJson = JSON.stringify(items);

  await db
    .prepare(
      `
        INSERT INTO orders (
          id, email, order_id, payment_id, total_items, total_amount, currency, status, items_json, created_at
        )
        VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, 'confirmed', ?, datetime('now'))
      `
    )
    .bind(email, orderId, paymentId, totalItems, totalAmount, currency, itemsJson)
    .run();

  if (items.length) {
    await insertOrderItems(db, orderId, paymentId, email, items);
  }

  return {
    ok: true,
    orderId,
    paymentId,
    email,
    totalAmount,
    totalItems,
    items,
    hasAddress: items.some((item) => item.addressLine1 || item.name),
    currency,
    createdAt: payment?.created_at ? new Date(Number(payment.created_at) * 1000).toISOString() : new Date().toISOString()
  };
}

async function fetchRazorpayPayments(authHeader, count, skip) {
  const url = new URL("https://api.razorpay.com/v1/payments");
  url.searchParams.set("count", String(count));
  url.searchParams.set("skip", String(skip));
  const res = await fetch(url.toString(), {
    headers: { Authorization: authHeader }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(String(data?.error?.description || data?.message || `Razorpay HTTP ${res.status}`));
  }
  return Array.isArray(data?.items) ? data.items : [];
}

export async function onRequestGet({ request, env }) {
  return handle(request, env, {});
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  return handle(request, env, body);
}

async function handle(request, env, body) {
  const expectedToken = String(env.ADMIN_DASHBOARD_TOKEN || "").trim();
  if (!expectedToken) {
    return Response.json({ success: false, error: "ADMIN_DASHBOARD_TOKEN is not configured." }, { status: 500 });
  }
  const suppliedToken = readToken(request, body);
  if (!suppliedToken || suppliedToken !== expectedToken) return unauthorized();

  const authHeader = razorpayBasicAuth(env);
  if (!authHeader) {
    return Response.json(
      { success: false, error: "RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured." },
      { status: 500 }
    );
  }

  if (!env.DB) {
    return Response.json({ success: false, error: "D1 database binding is not configured." }, { status: 500 });
  }

  const url = new URL(request.url);
  const countRaw = Number(body?.count ?? url.searchParams.get("count") ?? 100);
  const skipRaw = Number(body?.skip ?? url.searchParams.get("skip") ?? 0);
  const dryRun =
    body?.dryRun === true ||
    url.searchParams.get("dryRun") === "1" ||
    url.searchParams.get("dry_run") === "1";
  const syncToSheet = body?.syncToSheet === true || url.searchParams.get("syncToSheet") === "1";

  const count = Math.max(1, Math.min(100, Number.isFinite(countRaw) ? countRaw : 100));
  const skip = Math.max(0, Number.isFinite(skipRaw) ? skipRaw : 0);

  await ensureOrdersTable(env.DB);

  let items;
  try {
    items = await fetchRazorpayPayments(authHeader, count, skip);
  } catch (e) {
    return Response.json({ success: false, error: String(e?.message || e) }, { status: 502 });
  }

  const summary = {
    success: true,
    dryRun,
    syncToSheet,
    razorpay_count: items.length,
    examined: 0,
    skipped_not_captured: 0,
    skipped_missing_order_id: 0,
    skipped_already_in_db: 0,
    inserted: 0,
    would_insert: 0,
    sheet_attempts: 0,
    sheet_errors: [],
    inserted_rows: []
  };

  for (const payment of items) {
    summary.examined += 1;
    const status = String(payment?.status || "").toLowerCase();
    if (status !== "captured") {
      summary.skipped_not_captured += 1;
      continue;
    }

    const paymentId = String(payment?.id || "").trim();
    if (!paymentId) continue;

    if (await orderExists(env.DB, paymentId)) {
      summary.skipped_already_in_db += 1;
      continue;
    }

    const orderIdForPayment = String(payment?.order_id || "").trim();
    if (!orderIdForPayment) {
      summary.skipped_missing_order_id += 1;
      continue;
    }

    if (dryRun) {
      const orderNotes = await resolveOrderNotes(authHeader, payment);
      const items = parseCheckoutItemsFromNotes(orderNotes);
      summary.would_insert += 1;
      summary.inserted_rows.push({
        payment_id: paymentId,
        order_id: orderIdForPayment,
        email: checkoutEmailFromNotes(orderNotes, paymentEmail_(payment)),
        amount_inr: amountInrFromRazorpayPayment(payment),
        total_items: items.length,
        has_address: items.some((item) => item.addressLine1 || item.name)
      });
      continue;
    }

    try {
      const inserted = await insertOrderFromRazorpay(env.DB, payment, authHeader);
      if (!inserted.ok) {
        continue;
      }
      summary.inserted += 1;
      summary.inserted_rows.push({
        payment_id: inserted.paymentId,
        order_id: inserted.orderId,
        email: inserted.email,
        amount_inr: inserted.totalAmount,
        total_items: inserted.totalItems,
        has_address: inserted.hasAddress
      });

      if (syncToSheet && String(env.GOOGLE_SCRIPT_URL || "").trim()) {
        summary.sheet_attempts += 1;
        try {
          await sendOrderToGoogleScript(env, {
            email: inserted.email,
            orderId: inserted.orderId,
            paymentId: inserted.paymentId,
            totalAmount: inserted.totalAmount,
            totalItems: inserted.totalItems,
            items: inserted.items,
            createdAt: inserted.createdAt
          });
        } catch (err) {
          summary.sheet_errors.push({ payment_id: paymentId, error: String(err?.message || err) });
        }
      }
    } catch (err) {
      if (String(err?.message || err).includes("UNIQUE")) {
        summary.skipped_already_in_db += 1;
      } else {
        summary.sheet_errors.push({ payment_id: paymentId, error: String(err?.message || err) });
      }
    }
  }

  summary.next_skip = skip + items.length;
  summary.hint =
    "Rows use Razorpay order notes for shipping when create-order saved them. Older payments may still have has_address=false. Run POST /api/sync-orders-to-sheet to push to Google Sheet, or use syncToSheet=true.";

  return Response.json(summary);
}
