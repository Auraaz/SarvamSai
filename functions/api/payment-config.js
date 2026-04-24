export async function onRequestGet({ env }) {
  if (!env.RAZORPAY_KEY_ID) {
    return Response.json({ error: "RAZORPAY_KEY_ID is not configured." }, { status: 503 });
  }

  return Response.json({ key: env.RAZORPAY_KEY_ID });
}
