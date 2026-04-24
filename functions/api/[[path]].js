/**
 * Fallback for undefined /api/* routes.
 */
export async function onRequest() {
  return Response.json(
    {
      error: "API route not found."
    },
    { status: 404 }
  );
}
