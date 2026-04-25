function unauthorized() {
  return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

function readToken(request) {
  const url = new URL(request.url);
  const queryToken = String(url.searchParams.get("token") || "").trim();
  if (queryToken) return queryToken;
  const authHeader = String(request.headers.get("authorization") || "").trim();
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
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
}

function parsePrimaryRecipientDetails(itemsJsonRaw) {
  try {
    const items = JSON.parse(String(itemsJsonRaw || "[]"));
    if (!Array.isArray(items) || !items.length) {
      return { phone: "", shippingAddress: "" };
    }
    const first = items[0] || {};
    const shippingAddress = [
      String(first.addressLine1 || "").trim(),
      String(first.addressLine2 || "").trim(),
      String(first.city || "").trim(),
      String(first.state || "").trim(),
      String(first.pincode || "").trim(),
      String(first.country || "").trim()
    ]
      .filter(Boolean)
      .join(", ");
    return {
      phone: String(first.phone || "").trim(),
      shippingAddress
    };
  } catch (_error) {
    return { phone: "", shippingAddress: "" };
  }
}

export async function onRequestPost({ request, env }) {
  const expectedToken = String(env.ADMIN_DASHBOARD_TOKEN || "").trim();
  if (!expectedToken) {
    return Response.json({ success: false, error: "ADMIN_DASHBOARD_TOKEN is not configured." }, { status: 500 });
  }
  const suppliedToken = readToken(request);
  if (!suppliedToken || suppliedToken !== expectedToken) return unauthorized();

  if (!env.DB) {
    return Response.json({ success: false, error: "D1 database binding is not configured." }, { status: 500 });
  }

  const googleScriptUrl = String(env.GOOGLE_SCRIPT_URL || "").trim();
  if (!googleScriptUrl) {
    return Response.json({ success: false, error: "GOOGLE_SCRIPT_URL is not configured." }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const dryRun = Boolean(body?.dryRun);
  const emailFilter = String(body?.email || "")
    .trim()
    .toLowerCase();
  const limitRaw = Number(body?.limit ?? 200);
  const limit = Math.max(1, Math.min(5000, Number.isFinite(limitRaw) ? limitRaw : 200));

  await ensureOrdersTable(env.DB);

  let query = `
    SELECT order_id, payment_id, email, total_amount, total_items, items_json, status, created_at
    FROM orders
  `;
  const binds = [];
  if (emailFilter) {
    query += " WHERE email = ? ";
    binds.push(emailFilter);
  }
  query += " ORDER BY datetime(created_at) DESC LIMIT ? ";
  binds.push(limit);

  const result = await env.DB.prepare(query).bind(...binds).all();
  const orders = Array.isArray(result?.results) ? result.results : [];

  if (dryRun) {
    return Response.json({
      success: true,
      dryRun: true,
      fetched: orders.length,
      sample: orders.slice(0, 5).map((row) => ({
        id: String(row.order_id || "").trim(),
        payment_id: String(row.payment_id || "").trim(),
        email: String(row.email || "").trim().toLowerCase(),
        amount: Math.round((Number(row.total_amount) || 0) * 100),
        status: String(row.status || "paid").trim() || "paid"
      }))
    });
  }

  let synced = 0;
  let failed = 0;
  const failures = [];

  for (const row of orders) {
    const recipientDetails = parsePrimaryRecipientDetails(row.items_json);
    const payload = {
      action: "recordOrderPayment",
      id: String(row.order_id || "").trim(),
      payment_id: String(row.payment_id || "").trim(),
      email: String(row.email || "").trim().toLowerCase(),
      amount: Math.round((Number(row.total_amount) || 0) * 100),
      status: String(row.status || "paid").trim() || "paid",
      total_items: Math.max(0, Number(row.total_items) || 0),
      phone: recipientDetails.phone,
      shipping_address: recipientDetails.shippingAddress
    };

    try {
      const upstream = await fetch(googleScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const responseJson = await upstream.json().catch(() => ({}));
      const ok = upstream.ok && responseJson?.success !== false;
      if (ok) {
        synced += 1;
      } else {
        failed += 1;
        if (failures.length < 20) {
          failures.push({
            orderId: payload.id,
            paymentId: payload.payment_id,
            email: payload.email,
            error: responseJson?.error || `Apps Script returned ${upstream.status}`
          });
        }
      }
    } catch (error) {
      failed += 1;
      if (failures.length < 20) {
        failures.push({
          orderId: payload.id,
          paymentId: payload.payment_id,
          email: payload.email,
          error: String(error?.message || error)
        });
      }
    }
  }

  return Response.json({
    success: failed === 0,
    fetched: orders.length,
    synced,
    failed,
    failures
  });
}
