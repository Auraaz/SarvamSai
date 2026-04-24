export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json().catch(() => ({}));
  const { email, selected } = body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedSelected = String(selected || "").trim();

  if (!normalizedEmail || !normalizedSelected) {
    return Response.json({ success: false, error: "email and selected are required." }, { status: 400 });
  }

  const appsScriptUrl = String(env.APPS_SCRIPT_URL || "").trim();
  if (!appsScriptUrl) {
    return Response.json({ success: false, error: "APPS_SCRIPT_URL is not configured." }, { status: 500 });
  }

  const targetUrl = new URL(appsScriptUrl);
  targetUrl.searchParams.set("action", "verifyDarshanPassphrase");
  targetUrl.searchParams.set("email", normalizedEmail);
  targetUrl.searchParams.set("selected", normalizedSelected);

  const upstream = await fetch(targetUrl.toString(), { method: "GET" });
  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return Response.json(
      { success: false, error: payload?.error || "Apps Script verification failed." },
      { status: upstream.status }
    );
  }

  if (!payload || payload.success !== true) {
    return Response.json({ success: false }, { status: 400 });
  }

  return Response.json({ success: true });
}
