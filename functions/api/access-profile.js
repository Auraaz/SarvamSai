function normalizeProfile(raw, fallbackEmail) {
  const source = raw || {};
  const email = String(source.email || source.userEmail || fallbackEmail || "").trim().toLowerCase();
  const name = String(source.name || source.fullName || source.userName || "").trim();
  const code = String(source.access_code || source.accessCode || source.code || "").trim();
  const passphrase = String(source.passphrase || source.personalMessage || "").trim();
  const invitesLeft = Number(source.invitesLeft ?? source.invites_left ?? source.maxInvites ?? 3);
  const invitesUsed = Number(source.invitesUsed ?? source.invites_used ?? source.inviteCount ?? 0);
  const status = String(source.status || "active").trim().toLowerCase();

  return {
    email,
    name,
    code,
    passphrase,
    invitesLeft: Number.isFinite(invitesLeft) ? invitesLeft : 3,
    invitesUsed: Number.isFinite(invitesUsed) ? invitesUsed : 0,
    status
  };
}

export async function onRequestGet({ request, env }) {
  const requestUrl = new URL(request.url);
  const email = String(requestUrl.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) {
    return Response.json({ success: false, error: "email query param is required." }, { status: 400 });
  }

  const appsScriptUrl = String(env.APPS_SCRIPT_URL || "").trim();
  if (!appsScriptUrl) {
    return Response.json({ success: false, error: "APPS_SCRIPT_URL is not configured." }, { status: 500 });
  }

  const internalToken = String(env.INTERNAL_API_TOKEN || "").trim();
  const targetUrl = new URL(appsScriptUrl);
  targetUrl.searchParams.set("action", "getDarshanAccessProfile");
  targetUrl.searchParams.set("email", email);
  if (internalToken) targetUrl.searchParams.set("token", internalToken);

  const upstream = await fetch(targetUrl.toString(), { method: "GET" });
  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return Response.json(
      { success: false, error: payload?.error || "Apps Script profile fetch failed." },
      { status: upstream.status }
    );
  }

  const rawProfile = payload?.profile || payload?.user || payload?.data || payload;
  const profile = normalizeProfile(rawProfile, email);
  if (!profile.email) {
    return Response.json({ success: false, error: "Profile not found." }, { status: 404 });
  }

  return Response.json({ success: true, profile });
}
