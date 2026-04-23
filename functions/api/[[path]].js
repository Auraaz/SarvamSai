/**
 * Proxies /api/* to the Node Express API. Set API_ORIGIN in Cloudflare Pages
 * (Settings → Environment variables), e.g. https://your-api.example.com
 */
export async function onRequest({ request, env }) {
  const raw = (env.API_ORIGIN || "").trim();
  const origin = raw.replace(/\/$/, "");
  if (!origin) {
    return new Response(
      JSON.stringify({
        error:
          "API proxy is not configured. Set the API_ORIGIN environment variable in Cloudflare Pages to your hosted API base URL (no path)."
      }),
      { status: 503, headers: { "content-type": "application/json" } }
    );
  }
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, origin);
  return fetch(
    new Request(target.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "manual"
    })
  );
}
