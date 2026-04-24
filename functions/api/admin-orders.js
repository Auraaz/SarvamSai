function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
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

async function ensureTables(db) {
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
}

export async function onRequestGet({ request, env }) {
  const expectedToken = String(env.ADMIN_DASHBOARD_TOKEN || "").trim();
  if (!expectedToken) {
    return Response.json({ error: "ADMIN_DASHBOARD_TOKEN is not configured." }, { status: 500 });
  }
  const suppliedToken = readToken(request);
  if (!suppliedToken || suppliedToken !== expectedToken) {
    return unauthorized();
  }
  if (!env.DB) {
    return Response.json({ error: "D1 database binding is not configured." }, { status: 500 });
  }

  const url = new URL(request.url);
  const limitRaw = Number(url.searchParams.get("limit") || 100);
  const limit = Math.max(1, Math.min(500, Number.isFinite(limitRaw) ? limitRaw : 100));
  const offsetRaw = Number(url.searchParams.get("offset") || 0);
  const offset = Math.max(0, Number.isFinite(offsetRaw) ? offsetRaw : 0);

  await ensureTables(env.DB);

  const ordersResult = await env.DB
    .prepare(
      `
        SELECT email, order_id, payment_id, total_items, total_amount, currency, status, created_at
        FROM orders
        ORDER BY datetime(created_at) DESC
        LIMIT ? OFFSET ?
      `
    )
    .bind(limit, offset)
    .all();
  const rows = Array.isArray(ordersResult?.results) ? ordersResult.results : [];

  const itemsResult = await env.DB
    .prepare(
      `
        SELECT payment_id, item_index, item_type, recipient_name, recipient_phone,
               address_line1, address_line2, city, state, pincode, country
        FROM order_items
        ORDER BY datetime(created_at) DESC, item_index ASC
      `
    )
    .all();
  const itemRows = Array.isArray(itemsResult?.results) ? itemsResult.results : [];
  const itemsByPayment = itemRows.reduce((acc, row) => {
    const paymentId = String(row.payment_id || "").trim();
    if (!paymentId) return acc;
    if (!acc[paymentId]) acc[paymentId] = [];
    acc[paymentId].push({
      type: String(row.item_type || "").trim(),
      name: String(row.recipient_name || "").trim(),
      phone: String(row.recipient_phone || "").trim(),
      addressLine1: String(row.address_line1 || "").trim(),
      addressLine2: String(row.address_line2 || "").trim(),
      city: String(row.city || "").trim(),
      state: String(row.state || "").trim(),
      pincode: String(row.pincode || "").trim(),
      country: String(row.country || "").trim()
    });
    return acc;
  }, {});

  const orders = rows.map((row) => {
    const paymentId = String(row.payment_id || "").trim();
    return {
      email: String(row.email || "").trim().toLowerCase(),
      orderId: String(row.order_id || "").trim(),
      paymentId,
      totalItems: Number(row.total_items) || 0,
      totalAmount: Number(row.total_amount) || 0,
      currency: String(row.currency || "INR").trim().toUpperCase(),
      status: String(row.status || "").trim(),
      createdAt: String(row.created_at || "").trim(),
      items: itemsByPayment[paymentId] || []
    };
  });

  return Response.json({ orders, limit, offset });
}
