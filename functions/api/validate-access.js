export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json().catch(() => ({}));
  const { email, code } = body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedCode = String(code || "").trim();

  if (!normalizedEmail || !normalizedCode) {
    return Response.json({ valid: false, error: "email and code are required." }, { status: 400 });
  }

  const appsScriptUrl = String(env.APPS_SCRIPT_URL || "").trim();
  if (!appsScriptUrl) {
    return Response.json({ valid: false, error: "APPS_SCRIPT_URL is not configured." }, { status: 500 });
  }

  const targetUrl = new URL(appsScriptUrl);
  targetUrl.searchParams.set("action", "validateDarshanAccess");
  targetUrl.searchParams.set("email", normalizedEmail);
  targetUrl.searchParams.set("code", normalizedCode);

  const upstream = await fetch(targetUrl.toString(), { method: "GET" });
  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return Response.json(
      { valid: false, error: payload?.error || "Apps Script validation failed." },
      { status: upstream.status }
    );
  }

  if (!payload || payload.valid !== true) {
    return Response.json({ valid: false }, { status: 403 });
  }

  return Response.json({ valid: true, passphrase: String(payload.passphrase || "") });
}
