function parseItems(itemsJson) {
  if (!itemsJson) return [];
  try {
    const parsed = JSON.parse(String(itemsJson));
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
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
  const url = new URL(request.url);
  const email = String(url.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) {
    return Response.json({ error: "email query param is required." }, { status: 400 });
  }
  if (!env.DB) {
    return Response.json({ error: "D1 database binding is not configured." }, { status: 500 });
  }

  await ensureOrdersTable(env.DB);
  const result = await env.DB
    .prepare(
      `
        SELECT email, order_id, payment_id, total_items, total_amount, currency, status, items_json, created_at
        FROM orders
        WHERE email = ?
        ORDER BY datetime(created_at) DESC
      `
    )
    .bind(email)
    .all();

  const rows = Array.isArray(result?.results) ? result.results : [];
  const itemRowsResult = await env.DB
    .prepare(
      `
        SELECT payment_id, item_index, item_type, recipient_name, recipient_phone,
               address_line1, address_line2, city, state, pincode, country
        FROM order_items
        WHERE email = ?
        ORDER BY payment_id, item_index ASC
      `
    )
    .bind(email)
    .all();
  const itemRows = Array.isArray(itemRowsResult?.results) ? itemRowsResult.results : [];
  const itemsByPaymentId = itemRows.reduce((acc, row) => {
    const paymentId = String(row.payment_id || "").trim();
    if (!paymentId) return acc;
    if (!acc[paymentId]) acc[paymentId] = [];
    acc[paymentId].push({
      type: String(row.item_type || "").trim() || "gift",
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

  const orders = rows.map((row) => ({
    email: String(row.email || "").trim().toLowerCase(),
    orderId: String(row.order_id || "").trim(),
    paymentId: String(row.payment_id || "").trim(),
    totalItems: Number(row.total_items) || 0,
    totalAmount: Number(row.total_amount) || 0,
    currency: String(row.currency || "INR").trim().toUpperCase(),
    status: String(row.status || "confirmed").trim(),
    items: itemsByPaymentId[String(row.payment_id || "").trim()] || parseItems(row.items_json),
    date: String(row.created_at || "")
  }));

  return Response.json({ orders });
}
