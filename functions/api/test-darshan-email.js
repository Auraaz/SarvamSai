import { EmailMessage } from "cloudflare:email";

function createRawEmail({ from, to, subject, text }) {
  return [
    `From: SarvamSai <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text
  ].join("\r\n");
}

export async function onRequestPost({ env }) {
  const from = "sairam@sarvamsai.in";
  const to = "sairam@sarvamsai.in";
  const subject = "SarvamSai Cloudflare test email";
  const text =
    "This is a test email sent from Cloudflare Pages Functions for Darshan queue confirmation flow.";

  const raw = createRawEmail({ from, to, subject, text });
  const message = new EmailMessage(from, to, raw);

  try {
    await env.MAILER.send(message);
    return Response.json({ success: true, sentTo: to });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: String(error?.message || error || "Email send failed")
      },
      { status: 500 }
    );
  }
}
