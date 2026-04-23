const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const Razorpay = require("razorpay");
const nodemailer = require("nodemailer");
const cors = require("cors");

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = express();
const PORT = Number(process.env.PORT || 8787);
const DATA_DIR = path.join(__dirname, "data");
const ORDERS_PATH = path.join(DATA_DIR, "orders.json");

const RAZORPAY_KEY = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY || "";
const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || "";
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_SECRET;
const BASE_PRICE_INR = 2999;
const INTERNATIONAL_SHIPPING_USD = 15;
const USD_TO_INR_RATE = 83;
const INTERNATIONAL_SHIPPING_INR = INTERNATIONAL_SHIPPING_USD * USD_TO_INR_RATE;

if (!RAZORPAY_KEY || !RAZORPAY_SECRET) {
  console.warn("RAZORPAY_KEY or RAZORPAY_SECRET is missing. Payment endpoints will fail until configured.");
}

function getRazorpayClient() {
  if (!RAZORPAY_KEY || !RAZORPAY_SECRET) {
    throw new Error("Razorpay environment keys are not configured.");
  }
  return new Razorpay({
    key_id: RAZORPAY_KEY,
    key_secret: RAZORPAY_SECRET
  });
}

app.use((req, res, next) => {
  if (req.path === "/razorpay-webhook") {
    return next();
  }
  return bodyParser.json()(req, res, next);
});

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ORDERS_PATH)) {
    fs.writeFileSync(ORDERS_PATH, "[]", "utf8");
  }
}

function readOrders() {
  ensureStorage();
  try {
    const raw = fs.readFileSync(ORDERS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not read orders.json, resetting file.", error);
    fs.writeFileSync(ORDERS_PATH, "[]", "utf8");
    return [];
  }
}

function writeOrders(orders) {
  ensureStorage();
  fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2), "utf8");
}

function saveOrder(order) {
  const existing = readOrders();
  const index = existing.findIndex((item) => item.paymentId === order.paymentId);
  if (index >= 0) {
    existing[index] = { ...existing[index], ...order };
  } else {
    existing.unshift(order);
  }
  writeOrders(existing);
}

function createTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  if (!emailUser || !emailPass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
}

async function sendEmail(order) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("Email transporter is not configured. Skipping email confirmation.");
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: order.email,
    subject: "SarvamSai Order Confirmation",
    html: `
      <p>Your order has been confirmed.</p>
      <p><strong>Total pieces:</strong> ${order.totalItems || 0}</p>
      <p><strong>Recipients:</strong><br/>${formatRecipientsHtml(order.items)}</p>
      <p>Each piece is part of today’s distribution.</p>
      <p>This piece is part of the SarvamSai 100-day journey.</p>
      <p>Thank you.</p>
    `
  });
}

function sanitizeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeOrderItems(itemsRaw) {
  if (!Array.isArray(itemsRaw)) return [];
  return itemsRaw
    .map((item) => ({
      type: item?.type === "self" ? "self" : "gift",
      name: String(item?.name || "").trim(),
      phone: String(item?.phone || "").trim(),
      addressLine1: String(item?.addressLine1 || "").trim(),
      addressLine2: String(item?.addressLine2 || "").trim(),
      city: String(item?.city || "").trim(),
      state: String(item?.state || "").trim(),
      pincode: String(item?.pincode || "").trim(),
      country: String(item?.country || "").trim(),
      shippingStatus: String(item?.shippingStatus || "pending").trim() || "pending",
      trackingId: String(item?.trackingId || "").trim()
    }))
    .map((item) => ({
      ...item,
      address: [
        item.addressLine1,
        item.addressLine2,
        [item.city, item.state].filter(Boolean).join(", "),
        [item.pincode, item.country].filter(Boolean).join(", ")
      ]
        .filter(Boolean)
        .join(", ")
    }))
    .filter((item) => item.name || item.addressLine1 || item.phone);
}

function getRequestItems(body) {
  if (Array.isArray(body?.items)) {
    return body.items;
  }

  const fallback = [];
  if (body?.self) {
    const selfAddress = body?.shippingAddress || {};
    fallback.push({
      type: "self",
      name: selfAddress.fullName || "Self",
      phone: selfAddress.phone || "",
      addressLine1: selfAddress.line1 || "",
      addressLine2: selfAddress.line2 || "",
      city: selfAddress.city || "",
      state: selfAddress.state || "",
      pincode: selfAddress.pincode || "",
      country: selfAddress.country || ""
    });
  }
  if (Array.isArray(body?.gifts)) {
    body.gifts.forEach((gift) => {
      fallback.push({
        type: "gift",
        name: gift?.name || "",
        phone: gift?.phone || "",
        addressLine1: gift?.addressLine1 || gift?.address || "",
        addressLine2: gift?.addressLine2 || "",
        city: gift?.city || "",
        state: gift?.state || "",
        pincode: gift?.pincode || "",
        country: gift?.country || ""
      });
    });
  }
  return fallback;
}

function getOrderItemsFromRecord(orderRecord) {
  if (Array.isArray(orderRecord?.items)) {
    return normalizeOrderItems(orderRecord.items);
  }
  if (Array.isArray(orderRecord?.gifts)) {
    return normalizeOrderItems(
      orderRecord.gifts.map((gift) => ({
        type: "gift",
        name: gift?.name,
        addressLine1: gift?.address || gift?.addressLine1,
        addressLine2: gift?.addressLine2,
        city: gift?.city,
        state: gift?.state,
        pincode: gift?.pincode,
        country: gift?.country,
        phone: gift?.phone,
        shippingStatus: gift?.shippingStatus,
        trackingId: gift?.trackingId
      }))
    );
  }
  return [];
}

function isInternationalCountry(countryValue) {
  const country = String(countryValue || "").trim().toLowerCase();
  if (!country) return false;
  return country !== "india";
}

function computeOrderTotals(items) {
  const totalItems = Array.isArray(items) ? items.length : 0;
  const internationalCount = Array.isArray(items)
    ? items.filter((item) => isInternationalCountry(item.country)).length
    : 0;
  const baseAmount = totalItems * BASE_PRICE_INR;
  const shippingSurchargeAmount = internationalCount * INTERNATIONAL_SHIPPING_INR;

  return {
    totalItems,
    internationalCount,
    baseAmount,
    shippingSurchargeAmount,
    totalAmount: baseAmount + shippingSurchargeAmount
  };
}

function validateOrderItems(items) {
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (!item.name || !item.phone || !item.addressLine1 || !item.city || !item.state || !item.pincode || !item.country) {
      return `Piece ${i + 1} must include name, phone, address line 1, city, state, pincode, and country.`;
    }
  }
  return "";
}

function formatRecipientsHtml(itemsRaw) {
  const items = normalizeOrderItems(itemsRaw);
  if (!items.length) return "No recipients";
  return items
    .map(
      (item, index) =>
        `${index + 1}. ${sanitizeHtml(item.name)}<br/>` +
        `${sanitizeHtml(
          [
            item.addressLine1,
            item.addressLine2,
            [item.city, item.state].filter(Boolean).join(", "),
            [item.pincode, item.country].filter(Boolean).join(", ")
          ]
            .filter(Boolean)
            .join(", ")
        )}<br/>` +
        `Phone: ${sanitizeHtml(item.phone)}`
    )
    .join("<br/><br/>");
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/payment-config", (_req, res) => {
  res.json({ key: RAZORPAY_KEY });
});
app.get("/api/payment-config", (_req, res) => {
  res.json({ key: RAZORPAY_KEY });
});

async function createOrderHandler(req, res) {
  const { email, totalItems, totalAmount } = req.body || {};
  const normalizedItems = normalizeOrderItems(getRequestItems(req.body));
  const providedItems = Number(totalItems) || 0;
  const providedAmount = Number(totalAmount) || 0;
  const totals = computeOrderTotals(normalizedItems);
  const computedAmountPaise = totals.totalAmount * 100;
  const itemsValidationError = validateOrderItems(normalizedItems);
  const repeatedEmailCount = readOrders().filter(
    (orderRecord) => String(orderRecord.email || "").trim().toLowerCase() === String(email || "").trim().toLowerCase()
  ).length;
  const isRepeatBuyer = repeatedEmailCount > 0;
  const softLimitFlag = normalizedItems.length > 4;

  if (!email) {
    return res.status(400).json({ error: "email is required." });
  }
  if (normalizedItems.length === 0) {
    return res.status(400).json({ error: "At least one item is required." });
  }
  if (itemsValidationError) {
    return res.status(400).json({ error: itemsValidationError });
  }
  if (providedItems !== totals.totalItems || providedAmount !== totals.totalAmount) {
    return res.status(400).json({ error: "Order totals do not match selected recipients." });
  }
  if (computedAmountPaise < 100) {
    return res.status(400).json({ error: "Minimum amount is 100 paise." });
  }

  if (softLimitFlag) {
    console.warn(`High item count order detected for ${email}: ${normalizedItems.length} items`);
  }
  if (isRepeatBuyer) {
    console.warn(`Repeat buyer detected for ${email}`);
  }

  try {
    const order = await getRazorpayClient().orders.create({
      amount: computedAmountPaise,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
      notes: {
        email: String(email),
        itemsCount: String(normalizedItems.length),
        internationalCount: String(totals.internationalCount),
        highQuantityOrder: softLimitFlag ? "true" : "false",
        repeatBuyer: isRepeatBuyer ? "true" : "false"
      }
    });
    return res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error("create-order failed:", error);
    const statusCode = Number(error?.statusCode) || Number(error?.error?.statusCode) || 500;
    if (statusCode === 401) {
      return res.status(401).json({ error: "Razorpay authentication failed. Check credentials." });
    }
    return res.status(500).json({ error: "Unable to create order." });
  }
}

app.post("/create-order", createOrderHandler);
app.post("/api/create-order", createOrderHandler);

async function verifyPaymentHandler(req, res) {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    email,
    totalItems,
    totalAmount
  } = req.body || {};
  const normalizedItems = normalizeOrderItems(getRequestItems(req.body));
  const itemsValidationError = validateOrderItems(normalizedItems);
  const totals = computeOrderTotals(normalizedItems);
  const providedItems = Number(totalItems) || 0;
  const providedAmount = Number(totalAmount) || 0;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, error: "Missing Razorpay signature fields." });
  }
  if (normalizedItems.length === 0) {
    return res.status(400).json({ success: false, error: "At least one item is required." });
  }
  if (itemsValidationError) {
    return res.status(400).json({ success: false, error: itemsValidationError });
  }
  if (providedItems !== totals.totalItems || providedAmount !== totals.totalAmount) {
    return res.status(400).json({ success: false, error: "Order totals do not match selected recipients." });
  }
  if (!RAZORPAY_SECRET) {
    return res.status(500).json({ success: false, error: "RAZORPAY_SECRET is not configured." });
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, error: "Invalid signature." });
  }

  const softLimitFlag = normalizedItems.length > 4;
  const repeatedEmailCount = readOrders().filter(
    (orderRecord) => String(orderRecord.email || "").trim().toLowerCase() === String(email || "").trim().toLowerCase()
  ).length;
  const isRepeatBuyer = repeatedEmailCount > 0;

  const orderRecord = {
    email: email || "unknown",
    items: normalizedItems,
    totalItems: totals.totalItems,
    totalAmount: totals.totalAmount,
    baseAmount: totals.baseAmount,
    internationalCount: totals.internationalCount,
    shippingSurchargeAmount: totals.shippingSurchargeAmount,
    highQuantityOrder: totals.totalItems >= 3,
    softLimitFlag,
    repeatBuyer: isRepeatBuyer,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    date: new Date().toISOString(),
    status: "confirmed"
  };

  try {
    saveOrder(orderRecord);
    await sendEmail(orderRecord);
    return res.json({ success: true, order: orderRecord });
  } catch (error) {
    console.error("verify-payment failed:", error);
    return res.status(500).json({ success: false, error: "Payment verified but post-processing failed." });
  }
}

app.post("/verify-payment", verifyPaymentHandler);
app.post("/api/verify-payment", verifyPaymentHandler);

app.post(
  "/razorpay-webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const signature = req.headers["x-razorpay-signature"];
    if (!signature) {
      return res.status(400).json({ success: false, error: "Missing webhook signature." });
    }
    if (!RAZORPAY_WEBHOOK_SECRET) {
      return res.status(500).json({ success: false, error: "Webhook secret is not configured." });
    }

    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, error: "Webhook signature mismatch." });
    }

    let eventPayload = null;
    try {
      eventPayload = JSON.parse(req.body.toString("utf8"));
    } catch (error) {
      return res.status(400).json({ success: false, error: "Invalid webhook payload." });
    }

    const event = eventPayload.event || "unknown";
    const paymentEntity = eventPayload?.payload?.payment?.entity || {};
    const notes = paymentEntity.notes || {};
    const itemsCount = Math.max(0, Number(notes.itemsCount) || 0);
    const internationalCount = Math.max(0, Number(notes.internationalCount) || 0);
    const softLimitFlag = String(notes.highQuantityOrder || "").toLowerCase() === "true";
    const repeatBuyer = String(notes.repeatBuyer || "").toLowerCase() === "true";

    const record = {
      email: notes.email || "unknown",
      items: Array.from({ length: itemsCount }).map(() => ({
        type: "gift",
        name: "",
        address: "",
        phone: "",
        shippingStatus: "pending",
        trackingId: ""
      })),
      totalItems: itemsCount,
      totalAmount: (itemsCount * BASE_PRICE_INR) + (internationalCount * INTERNATIONAL_SHIPPING_INR),
      baseAmount: itemsCount * BASE_PRICE_INR,
      internationalCount,
      shippingSurchargeAmount: internationalCount * INTERNATIONAL_SHIPPING_INR,
      highQuantityOrder: itemsCount >= 3,
      softLimitFlag,
      repeatBuyer,
      paymentId: paymentEntity.id || "unknown",
      orderId: paymentEntity.order_id || "unknown",
      date: new Date().toISOString(),
      status: event.includes("captured") ? "confirmed" : `webhook:${event}`
    };

    saveOrder(record);
    return res.json({ success: true });
  }
);

app.get("/orders-by-email", (req, res) => {
  const email = String(req.query.email || "").trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: "email query param is required." });
  }

  const orders = readOrders()
    .filter((order) => String(order.email || "").trim().toLowerCase() === email)
    .map((order) => {
      const orderItems = getOrderItemsFromRecord(order);
      const resolvedTotalItems = Number(order.totalItems) || Number(order.quantity) || orderItems.length || 1;
      return {
        email: order.email || "",
        items: orderItems,
        totalItems: resolvedTotalItems,
        totalAmount: Number(order.totalAmount) || resolvedTotalItems * BASE_PRICE_INR,
        baseAmount: Number(order.baseAmount) || resolvedTotalItems * BASE_PRICE_INR,
        internationalCount: Number(order.internationalCount) || 0,
        shippingSurchargeAmount: Number(order.shippingSurchargeAmount) || 0,
        highQuantityOrder: Boolean(order.highQuantityOrder) || resolvedTotalItems >= 3,
        softLimitFlag: Boolean(order.softLimitFlag),
        repeatBuyer: Boolean(order.repeatBuyer),
        paymentId: order.paymentId || "",
        orderId: order.orderId || "",
        date: order.date || "",
        status: order.status || ""
      };
    });

  return res.json({ orders });
});
app.get("/api/orders-by-email", (req, res) => {
  const email = String(req.query.email || "").trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: "email query param is required." });
  }

  const orders = readOrders()
    .filter((order) => String(order.email || "").trim().toLowerCase() === email)
    .map((order) => {
      const orderItems = getOrderItemsFromRecord(order);
      const resolvedTotalItems = Number(order.totalItems) || Number(order.quantity) || orderItems.length || 1;
      return {
        email: order.email || "",
        items: orderItems,
        totalItems: resolvedTotalItems,
        totalAmount: Number(order.totalAmount) || resolvedTotalItems * BASE_PRICE_INR,
        baseAmount: Number(order.baseAmount) || resolvedTotalItems * BASE_PRICE_INR,
        internationalCount: Number(order.internationalCount) || 0,
        shippingSurchargeAmount: Number(order.shippingSurchargeAmount) || 0,
        highQuantityOrder: Boolean(order.highQuantityOrder) || resolvedTotalItems >= 3,
        softLimitFlag: Boolean(order.softLimitFlag),
        repeatBuyer: Boolean(order.repeatBuyer),
        paymentId: order.paymentId || "",
        orderId: order.orderId || "",
        date: order.date || "",
        status: order.status || ""
      };
    });

  return res.json({ orders });
});

app.get("/orders", (_req, res) => {
  const orders = readOrders();
  const rows = orders
    .map(
      (order) => {
        const items = getOrderItemsFromRecord(order);
        const recipientsDetails = items.length
          ? items
              .map(
                (item, index) =>
                  `<li>
                    <strong>${index + 1}. ${sanitizeHtml(item.name)}</strong><br/>
                    ${sanitizeHtml(
                      [
                        item.addressLine1,
                        item.addressLine2,
                        [item.city, item.state].filter(Boolean).join(", "),
                        [item.pincode, item.country].filter(Boolean).join(", ")
                      ]
                        .filter(Boolean)
                        .join(", ")
                    )}<br/>
                    Phone: ${sanitizeHtml(item.phone)}<br/>
                    Shipping: ${sanitizeHtml(item.shippingStatus || "pending")}
                    ${item.trackingId ? `<br/>Tracking: ${sanitizeHtml(item.trackingId)}` : ""}
                  </li>`
              )
              .join("")
          : "<li>No recipients</li>";
        const totalItems = Number(order.totalItems) || Number(order.quantity) || items.length;
        const highQuantityOrder = Boolean(order.highQuantityOrder) || totalItems >= 3;
        return `
      <tr ${highQuantityOrder ? 'style="background:#fff3e0;"' : ""}>
        <td>${sanitizeHtml(order.email || "")}</td>
        <td>${items.length}</td>
        <td>${totalItems}</td>
        <td>${highQuantityOrder ? "Yes" : "No"}</td>
        <td>${sanitizeHtml(order.date || "")}</td>
        <td>${sanitizeHtml(order.status || "")}</td>
        <td>
          <details>
            <summary>View</summary>
            <ul>${recipientsDetails}</ul>
          </details>
        </td>
      </tr>`;
      }
    )
    .join("");

  res.type("html").send(`<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>SarvamSai Orders</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 24px; background: #fffdf8; color: #2c1a10; }
        table { width: 100%; border-collapse: collapse; background: #fff; }
        th, td { border: 1px solid #e2d5bf; padding: 10px; text-align: left; }
        th { background: #f2e7d3; }
      </style>
    </head>
    <body>
      <h1>SarvamSai Orders</h1>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Recipients</th>
            <th>Total Pieces</th>
            <th>High Quantity Order</th>
            <th>Date</th>
            <th>Status</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>${rows || "<tr><td colspan='7'>No orders yet.</td></tr>"}</tbody>
      </table>
    </body>
  </html>`);
});

ensureStorage();
app.listen(PORT, () => {
  console.log(`SarvamSai API running on http://localhost:${PORT}`);
});
