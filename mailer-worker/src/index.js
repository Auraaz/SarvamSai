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

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return Response.json({ success: false, error: "Method not allowed." }, { status: 405 });
    }

    const authHeader = String(request.headers.get("Authorization") || "");
    const expectedToken = String(env.MAILER_WORKER_TOKEN || "").trim();
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const to = String(body?.to || "").trim().toLowerCase();
    const subject = String(body?.subject || "SarvamSai Notification").trim();
    const text = String(body?.text || "").trim();
    const from = "sairam@sarvamsai.in";

    if (!to || !text) {
      return Response.json({ success: false, error: "to and text are required." }, { status: 400 });
    }

    try {
      const raw = createRawEmail({ from, to, subject, text });
      const message = new EmailMessage(from, to, raw);
      await env.MAILER.send(message);
      return Response.json({ success: true, sentTo: to });
    } catch (error) {
      return Response.json(
        {
          success: false,
          error: String(error?.message || error || "Email send failed.")
        },
        { status: 500 }
      );
    }
  }
};
