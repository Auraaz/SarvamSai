export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  if (!email) {
    return Response.json({ success: false, error: "email is required." }, { status: 400 });
  }

  const appsScriptUrl = String(env.APPS_SCRIPT_URL || "").trim();
  const internalToken = String(env.INTERNAL_API_TOKEN || "").trim();
  if (!appsScriptUrl || !internalToken) {
    return Response.json(
      { success: false, error: "APPS_SCRIPT_URL or INTERNAL_API_TOKEN is not configured." },
      { status: 500 }
    );
  }

  const targetUrl = new URL(appsScriptUrl);
  targetUrl.searchParams.set("action", "generateDarshanInvite");
  targetUrl.searchParams.set("email", email);
  targetUrl.searchParams.set("token", internalToken);

  const upstream = await fetch(targetUrl.toString(), { method: "GET" });
  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return Response.json(
      {
        success: false,
        error: payload?.error || "Apps Script invite generation failed."
      },
      { status: upstream.status }
    );
  }

  if (!payload || payload.success !== true) {
    return Response.json(
      { success: false, error: payload?.error || "Failed to generate darshan invite." },
      { status: 400 }
    );
  }

  return Response.json(payload);
}
