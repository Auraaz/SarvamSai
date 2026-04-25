function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
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

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
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

export async function onRequestGet({ request, env }) {
  const expectedToken = String(env.ADMIN_DASHBOARD_TOKEN || "").trim();
  if (!expectedToken) {
    return new Response("ADMIN_DASHBOARD_TOKEN is not configured.", { status: 500 });
  }

  const suppliedToken = readToken(request);
  if (!suppliedToken || suppliedToken !== expectedToken) {
    return unauthorized();
  }

  if (!env.DB) {
    return new Response("D1 database binding is not configured.", { status: 500 });
  }

  await ensureOrdersTable(env.DB);

  const url = new URL(request.url);
  const emailFilter = String(url.searchParams.get("email") || "")
    .trim()
    .toLowerCase();
  const limitRaw = Number(url.searchParams.get("limit") || 5000);
  const limit = Math.max(1, Math.min(20000, Number.isFinite(limitRaw) ? limitRaw : 5000));

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
  const rows = Array.isArray(result?.results) ? result.results : [];

  const header = [
    "Order ID",
    "Payment ID",
    "Email",
    "Amount",
    "Status",
    "Email Sent",
    "Number of Discovery Boxes",
    "Phone",
    "Shipping Address",
    "Timestamp"
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    const recipientDetails = parsePrimaryRecipientDetails(row.items_json);
    lines.push(
      [
        escapeCsv(row.order_id),
        escapeCsv(row.payment_id),
        escapeCsv(String(row.email || "").trim().toLowerCase()),
        escapeCsv(Number(row.total_amount) || 0),
        escapeCsv(String(row.status || "confirmed").trim()),
        "NO",
        escapeCsv(Math.max(0, Number(row.total_items) || 0)),
        escapeCsv(recipientDetails.phone),
        escapeCsv(recipientDetails.shippingAddress),
        escapeCsv(String(row.created_at || ""))
      ].join(",")
    );
  }

  const csv = "\uFEFF" + lines.join("\n");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `orders-export-${timestamp}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
