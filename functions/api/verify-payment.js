function toHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a, b) {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let mismatch = 0;
  for (let i = 0; i < aBytes.length; i += 1) {
    mismatch |= aBytes[i] ^ bBytes[i];
  }
  return mismatch === 0;
}

async function createRazorpaySignature(orderId, paymentId, secret) {
  const payload = `${orderId}|${paymentId}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(signed);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

  if (!env.RAZORPAY_KEY_SECRET) {
    return Response.json({ success: false, error: "RAZORPAY_KEY_SECRET is not configured." }, { status: 500 });
  }
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return Response.json({ success: false, error: "Missing required payment verification fields." }, { status: 400 });
  }

  const expected = await createRazorpaySignature(razorpay_order_id, razorpay_payment_id, env.RAZORPAY_KEY_SECRET);
  if (!timingSafeEqualHex(expected, String(razorpay_signature))) {
    return Response.json({ success: false }, { status: 400 });
  }

  return Response.json({ success: true });
}
