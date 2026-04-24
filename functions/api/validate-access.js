export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json().catch(() => ({}));
  const { email, code } = body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedCode = String(code || "").trim();

  if (!normalizedEmail || !normalizedCode) {
    return Response.json({ valid: false, error: "email and code are required." }, { status: 400 });
  }

  async function readFromCache() {
    if (!env.DB) return null;
    try {
      const row = await env.DB.prepare(
        `
          SELECT email, access_code, passphrase, status
          FROM darshan_access
          WHERE email = ? AND access_code = ?
          LIMIT 1
        `
      )
        .bind(normalizedEmail, normalizedCode)
        .first();
      if (!row) return null;
      return {
        email: String(row.email || normalizedEmail).trim().toLowerCase(),
        access_code: String(row.access_code || normalizedCode).trim(),
        passphrase: String(row.passphrase || "").trim(),
        status: String(row.status || "active").trim().toLowerCase()
      };
    } catch (_error) {
      return null;
    }
  }

  async function upsertCache(passphraseFromUpstream) {
    if (!env.DB) return;
    const passphrase = String(passphraseFromUpstream || "").trim();
    try {
      await env.DB.prepare(
        `
          INSERT INTO darshan_access (id, email, access_code, passphrase, status, created_at, last_accessed_at)
          VALUES (lower(hex(randomblob(16))), ?, ?, ?, 'active', datetime('now'), datetime('now'))
          ON CONFLICT(email)
          DO UPDATE SET
            access_code = excluded.access_code,
            passphrase = excluded.passphrase,
            status = 'active',
            last_accessed_at = datetime('now')
        `
      )
        .bind(normalizedEmail, normalizedCode, passphrase)
        .run();
    } catch (_error) {
      // Non-blocking cache write.
    }
  }

  const cached = await readFromCache();
  if (cached && cached.status !== "revoked" && cached.status !== "blocked") {
    if (env.DB) {
      env.DB.prepare("UPDATE darshan_access SET last_accessed_at = datetime('now') WHERE email = ?")
        .bind(normalizedEmail)
        .run()
        .catch(() => {});
    }
    return Response.json({ valid: true, passphrase: cached.passphrase });
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

  await upsertCache(payload.passphrase);
  return Response.json({ valid: true, passphrase: String(payload.passphrase || "") });
}
