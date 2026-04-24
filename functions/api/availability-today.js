const DAILY_CAPACITY = 100;

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

export async function onRequestGet({ env }) {
  if (!env.DB) {
    return Response.json({ error: "D1 database binding is not configured." }, { status: 500 });
  }

  await ensureOrdersTable(env.DB);

  // Use IST day boundary for SarvamSai daily capacity tracking.
  const result = await env.DB
    .prepare(
      `
        SELECT COALESCE(SUM(total_items), 0) AS booked
        FROM orders
        WHERE status = 'confirmed'
          AND date(datetime(created_at, '+5 hours', '+30 minutes')) = date(datetime('now', '+5 hours', '+30 minutes'))
      `
    )
    .first();

  const booked = Math.max(0, Number(result?.booked) || 0);
  const remaining = Math.max(0, DAILY_CAPACITY - booked);

  return Response.json({
    capacity: DAILY_CAPACITY,
    booked,
    remaining
  });
}
