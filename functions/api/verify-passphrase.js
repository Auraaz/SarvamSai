export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, selected } = await request.json();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedSelected = String(selected || "").trim();

  if (!normalizedEmail || !normalizedSelected) {
    return Response.json({ success: false, error: "email and selected are required." }, { status: 400 });
  }

  const user = await env.DB.prepare("SELECT * FROM darshan_access WHERE email = ?")
    .bind(normalizedEmail)
    .first();

  if (!user || String(user.status || "") !== "active" || normalizedSelected !== String(user.passphrase || "")) {
    return Response.json({ success: false }, { status: 400 });
  }

  await env.DB.prepare(
    `
      UPDATE darshan_access
      SET status = 'used',
          last_accessed_at = datetime('now')
      WHERE email = ?
    `
  )
    .bind(normalizedEmail)
    .run();

  return Response.json({ success: true });
}
