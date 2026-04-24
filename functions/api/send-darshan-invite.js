const PASS_PHRASES = [
  "Love All Serve All",
  "Help Ever Hurt Never",
  "Hands that Serve are Holier",
  "Start the Day with Love",
  "Duty Without Love is Deplorable",
  "Be Simple and Sincere",
  "Service to Man is Service to God"
];

function pickPassphrase() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return PASS_PHRASES[buf[0] % PASS_PHRASES.length];
}

function inviteHtml(email, passphrase, accessCode) {
  const link = `https://sarvamsai.in/store?email=${encodeURIComponent(email)}&code=${encodeURIComponent(accessCode)}`;
  return `
    <p>Your Darshan invitation is ready.</p>
    <p><strong>Passphrase:</strong> ${passphrase}</p>
    <p><strong>Access link:</strong> <a href="${link}">${link}</a></p>
  `;
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  if (!email) {
    return Response.json({ success: false, error: "email is required." }, { status: 400 });
  }

  const accessCode = crypto.randomUUID();
  const passphrase = pickPassphrase();

  await env.DB.prepare(
    `
      INSERT INTO darshan_access (
        id, email, access_code, passphrase, status, invite_count, max_invites, created_at, last_accessed_at
      )
      VALUES (?, ?, ?, ?, 'active', 1, 3, datetime('now'), NULL)
      ON CONFLICT(email) DO UPDATE SET
        access_code = excluded.access_code,
        passphrase = excluded.passphrase,
        status = 'active',
        invite_count = COALESCE(darshan_access.invite_count, 0) + 1
    `
  )
    .bind(crypto.randomUUID(), email, accessCode, passphrase)
    .run();

  const mailerUrl = String(env.MAILER_WORKER_URL || "").trim();
  const mailerToken = String(env.MAILER_WORKER_TOKEN || "").trim();
  if (!mailerUrl || !mailerToken) {
    return Response.json(
      { success: false, error: "MAILER_WORKER_URL or MAILER_WORKER_TOKEN is not configured." },
      { status: 500 }
    );
  }

  const mailResponse = await fetch(mailerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mailerToken}`
    },
    body: JSON.stringify({
      to: email,
      subject: "Your Darshan Awaits",
      text: `Your Darshan invitation is ready.\nPassphrase: ${passphrase}\nAccess link: https://sarvamsai.in/store?email=${encodeURIComponent(email)}&code=${encodeURIComponent(accessCode)}`,
      html: inviteHtml(email, passphrase, accessCode)
    })
  });

  const mailPayload = await mailResponse.json().catch(() => ({}));
  if (!mailResponse.ok) {
    return Response.json(
      {
        success: false,
        error: mailPayload?.error || "Invite email failed to send."
      },
      { status: mailResponse.status }
    );
  }

  return Response.json({
    success: true,
    email,
    passphrase,
    accessCode
  });
}
