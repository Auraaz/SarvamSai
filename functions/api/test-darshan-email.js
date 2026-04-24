export async function onRequestPost({ env }) {
  const mailerUrl = String(env.MAILER_WORKER_URL || "").trim();
  const mailerToken = String(env.MAILER_WORKER_TOKEN || "").trim();
  const targetEmail = String(env.TEST_EMAIL_TO || "sairam@sarvamsai.in").trim();

  if (!mailerUrl || !mailerToken) {
    return Response.json(
      {
        success: false,
        error: "MAILER_WORKER_URL or MAILER_WORKER_TOKEN is not configured."
      },
      { status: 500 }
    );
  }

  const response = await fetch(mailerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mailerToken}`
    },
    body: JSON.stringify({
      to: targetEmail,
      subject: "SarvamSai Cloudflare test email",
      text: "This is a test email sent from Cloudflare Worker mailer for Darshan queue flow."
    })
  });

  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => ({}));
    return Response.json(payload, { status: response.status });
  }

  const text = await response.text();
  return Response.json(
    {
      success: response.ok,
      error: text || "Mailer worker returned a non-JSON response."
    },
    { status: response.status }
  );
}
