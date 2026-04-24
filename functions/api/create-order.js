export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();

  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return Response.json({ error: "Razorpay env vars are not configured." }, { status: 500 });
  }

  const amount = Number(body?.amount);
  const hasExplicitAmount = Number.isFinite(amount) && amount > 0;
  const totalAmount = Number(body?.totalAmount);
  const computedAmount = hasExplicitAmount ? Math.round(amount) : Math.round(totalAmount * 100);

  if (!Number.isFinite(computedAmount) || computedAmount < 100) {
    return Response.json({ error: "Minimum amount is 100 paise." }, { status: 400 });
  }

  const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: computedAmount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    })
  });

  const result = await response.json();
  if (!response.ok) {
    return Response.json({ error: result?.error?.description || "Could not create Razorpay order." }, { status: response.status });
  }

  return Response.json({
    order_id: result.id,
    amount: result.amount,
    currency: result.currency,
    key: env.RAZORPAY_KEY_ID
  });
}
