export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, code } = await request.json();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedCode = String(code || "").trim();

  if (!normalizedEmail || !normalizedCode) {
    return Response.json({ valid: false, error: "email and code are required." }, { status: 400 });
  }

  const user = await env.DB.prepare("SELECT * FROM darshan_access WHERE email = ?")
    .bind(normalizedEmail)
    .first();

  if (!user || String(user.access_code || "") !== normalizedCode || String(user.status || "") !== "active") {
    return Response.json({ valid: false }, { status: 403 });
  }

  return Response.json({
    valid: true,
    passphrase: user.passphrase
  });
}
