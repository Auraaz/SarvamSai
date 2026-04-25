// SarvamSai - Google Apps Script (extended with Darshan + purchase tracking)
// Deploy > Web App > Execute as: Me > Who has access: Anyone

const SHEET_NAME = "Registrations";
const SAMITHI_SHEET = "Samithis";
const ADMIN_EMAIL = "sairam@sarvamsai.in";
const ADMIN_NOTIFY_EMAIL = "vkgupta@vistarah.com";
const SENDER_EMAIL = "sairam@sarvamsai.in";
const SITE_URL = "https://sarvamsai.in";
const EMAIL_LOG_SHEET = "EmailLog";
const ORDER_LOG_SHEET = "OrderPayments";
const ORDER_LOG_HEADERS = ["Order ID", "Payment ID", "Email", "Amount", "Status", "Email Sent", "Timestamp"];

const REQUIRED_REG_HEADERS = [
  "rank",
  "name",
  "email",
  "referred_by",
  "invite_count",
  "registered_at",
  "samithi_id",
  "samithi_name",
  "samithi_city",
  "darshan_access_code",
  "darshan_passphrase",
  "darshan_status",
  "darshan_invite_sent_at",
  "darshan_accessed_at",
  "purchase_count",
  "last_purchase_at",
  "last_payment_id",
  "total_spent_inr"
];

const PASS_PHRASES = [
  "Love All Serve All",
  "Help Ever Hurt Never",
  "Hands that Serve are Holier",
  "Start the Day with Love",
  "Duty Without Love is Deplorable",
  "Be Simple and Sincere",
  "Service to Man is Service to God"
];

function doGet(e) {
  const params = e.parameter || {};
  const action = params.action;
  let result;

  try {
    if (action === "register") result = registerUser(params);
    else if (action === "getUser") result = getUser(params);
    else if (action === "leaderboard") result = getLeaderboard();
    else if (action === "getSamithis") result = getSamithis();
    else if (action === "joinSamithi") result = joinSamithi(params);
    else if (action === "addSamithi") result = addSamithi(params);
    else if (action === "samithiLeaderboard") result = getSamithiLeaderboard();
    // New Darshan + purchase actions
    else if (action === "generateDarshanInvite") result = generateDarshanInvite(params);
    else if (action === "validateDarshanAccess") result = validateDarshanAccess(params);
    else if (action === "verifyDarshanPassphrase") result = verifyDarshanPassphrase(params);
    else if (action === "recordPurchase") result = recordPurchase(params);
    else if (action === "recordOrderPayment") result = recordOrderPayment(params);
    else result = { success: false, error: "unknown_action" };
  } catch (err) {
    result = { success: false, error: String(err && err.message ? err.message : err) };
  }

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // Optional: support POST same as GET by reading JSON/body params
  let body = {};
  try {
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (ignore) {}

  const params = Object.assign({}, (e && e.parameter) || {}, body || {});
  return doGet({ parameter: params });
}

function getOrCreateOrderSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(ORDER_LOG_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(ORDER_LOG_SHEET);
    sheet.appendRow(ORDER_LOG_HEADERS);
  }

  const currentHeaders = sheet
    .getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()))
    .getValues()[0]
    .map(function (h) {
      return String(h || "").trim();
    });
  const expected = ORDER_LOG_HEADERS.join("|");
  const actual = currentHeaders.slice(0, ORDER_LOG_HEADERS.length).join("|");
  if (expected !== actual) {
    sheet.getRange(1, 1, 1, ORDER_LOG_HEADERS.length).setValues([ORDER_LOG_HEADERS]);
  }
  return sheet;
}

function buildDiscoveryOrderEmailContent_(orderId, paymentId, amountInr) {
  const safeOrderId = escapeHtml_(orderId);
  const safePaymentId = escapeHtml_(paymentId || "-");
  const safeAmount = escapeHtml_(amountInr.toFixed(2));

  const subject = "Thank you for your Discovery Box order - SarvamSai";
  const plainBody =
    "Sairam,\n\n" +
    "Thank you for your Discovery Box order.\n" +
    "Order ID: " +
    orderId +
    "\nPayment ID: " +
    (paymentId || "-") +
    "\nAmount: INR " +
    amountInr.toFixed(2) +
    "\n\n" +
    "We will keep you updated with your order status and delivery status of the Discovery Box.\n\n" +
    "With gratitude,\nSarvamSai Team\n" +
    SITE_URL;

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f6efe3;font-family:Arial,sans-serif;color:#2d2215;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6efe3;padding:24px 12px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fffaf2;border:1px solid #dfd0b0;">
        <tr><td style="padding:18px 24px;background:#1a0a06;color:#f6e7c8;text-align:center;font-size:20px;font-weight:700;">SarvamSai</td></tr>
        <tr><td style="padding:24px;">
          <h2 style="margin:0 0 12px;color:#2d2215;">Thank you for your Discovery Box order</h2>
          <p style="margin:0 0 12px;line-height:1.6;">Your order has been received successfully.</p>
          <p style="margin:0 0 8px;"><strong>Order ID:</strong> ${safeOrderId}</p>
          <p style="margin:0 0 8px;"><strong>Payment ID:</strong> ${safePaymentId}</p>
          <p style="margin:0 0 16px;"><strong>Amount:</strong> INR ${safeAmount}</p>
          <p style="margin:0;line-height:1.6;">We will keep your order status and delivery status of the Discovery Box updated and share progress with you.</p>
        </td></tr>
        <tr><td style="padding:16px 24px;background:#f0e4cd;color:#5a4630;font-size:12px;text-align:center;">
          With gratitude, SarvamSai Team<br />
          <a href="${SITE_URL}" style="color:#5a4630;text-decoration:none;">${SITE_URL}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject: subject, plainBody: plainBody, htmlBody: htmlBody };
}

function sendDiscoveryOrderEmail_(email, orderId, paymentId, amountInr) {
  const content = buildDiscoveryOrderEmailContent_(orderId, paymentId, amountInr);
  const mailOpts = { from: SENDER_EMAIL, htmlBody: content.htmlBody, name: "SarvamSai" };
  if (SENDER_EMAIL !== ADMIN_EMAIL) mailOpts.replyTo = ADMIN_EMAIL;
  sendMailWithFallback_(email, content.subject, content.plainBody, mailOpts);
}

function getLatestOrderByEmail_(email) {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  if (!normalized) return null;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const allSheets = ss.getSheets();
  const preferred = ss.getSheetByName(ORDER_LOG_SHEET);
  const sheets = preferred ? [preferred].concat(allSheets.filter(function (s) { return s.getName() !== ORDER_LOG_SHEET; })) : allSheets;

  for (let s = 0; s < sheets.length; s += 1) {
    const sheet = sheets[s];
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) continue;

    const headers = sheet
      .getRange(1, 1, 1, lastCol)
      .getValues()[0]
      .map(function (h) {
        return String(h || "").trim().toLowerCase();
      });

    const idxOrder = headers.indexOf("order id");
    const idxPayment = headers.indexOf("payment id");
    const idxEmail = headers.indexOf("email");
    const idxAmount = headers.indexOf("amount");
    const idxStatus = headers.indexOf("status");
    if (idxOrder < 0 || idxEmail < 0 || idxAmount < 0) continue;

    const rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    for (let i = rows.length - 1; i >= 0; i -= 1) {
      const rowEmail = String(rows[i][idxEmail] || "")
        .trim()
        .toLowerCase();
      if (rowEmail === normalized) {
        return {
          orderId: String(rows[i][idxOrder] || "").trim(),
          paymentId: idxPayment >= 0 ? String(rows[i][idxPayment] || "").trim() : "",
          email: rowEmail,
          amountInr: safeNumber_(rows[i][idxAmount], 0),
          status: idxStatus >= 0 ? String(rows[i][idxStatus] || "").trim() : ""
        };
      }
    }
  }
  return null;
}

// -- CORE HELPERS ------------------------------------------------

function getOrCreateRegistrationsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(REQUIRED_REG_HEADERS);
  }
  ensureRegistrationSchema_(sheet);
  return sheet;
}

function ensureRegistrationSchema_(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()));
  const existing = headerRange.getValues()[0].map((h) => String(h || "").trim());
  const existingSet = new Set(existing);

  REQUIRED_REG_HEADERS.forEach(function (col) {
    if (!existingSet.has(col)) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(col);
    }
  });
}

function headersMap_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach(function (h, i) {
    map[String(h || "").trim()] = i;
  });
  return map;
}

function findUserRowIndexByEmail_(sheet, email, hm) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  for (var i = 0; i < rows.length; i++) {
    const e = String(rows[i][hm.email] || "").trim().toLowerCase();
    if (e === email) return i + 2; // sheet row number
  }
  return -1;
}

function getInternalToken_() {
  return PropertiesService.getScriptProperties().getProperty("INTERNAL_API_TOKEN") || "";
}

function requireInternalToken_(params) {
  const token = String(params.token || "").trim();
  const expected = getInternalToken_();
  if (!expected) throw new Error("server_token_not_configured");
  if (!token || token !== expected) throw new Error("unauthorized");
}

function safeNumber_(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback || 0;
}

function nowIso_() {
  return new Date().toISOString();
}

function randomPassphrase_() {
  const idx = Math.floor(Math.random() * PASS_PHRASES.length);
  return PASS_PHRASES[idx];
}

function generateAccessCode_() {
  // Good enough for sheet access code usage
  return Utilities.getUuid();
}

// -- MAIL HELPERS ------------------------------------------------

function logEmailFailure_(context, err) {
  const msg = String(err && err.message ? err.message : err);
  Logger.log("EMAIL FAIL [" + context + "] " + msg);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(EMAIL_LOG_SHEET);
    if (!sh) {
      sh = ss.insertSheet(EMAIL_LOG_SHEET);
      sh.appendRow(["timestamp_utc", "context", "error"]);
    }
    sh.appendRow([nowIso_(), context, msg]);
  } catch (ignore) {}
}

function sendMailWithFallback_(to, subject, plainBody, gmailOpts) {
  try {
    GmailApp.sendEmail(to, subject, plainBody, gmailOpts);
    return "gmail";
  } catch (e) {
    logEmailFailure_("GmailApp to " + to, e);
    try {
      const fallback = { htmlBody: gmailOpts.htmlBody };
      if (gmailOpts.replyTo) fallback.replyTo = gmailOpts.replyTo;
      MailApp.sendEmail(to, subject, plainBody, fallback);
      return "mailapp";
    } catch (e2) {
      logEmailFailure_("MailApp fallback to " + to, e2);
      throw e2;
    }
  }
}

// -- REGISTER ----------------------------------------------------

function registerUser(params) {
  const name = String(params.name || "").trim();
  const email = String(params.email || "")
    .trim()
    .toLowerCase();
  const referredBy = String(params.referred_by || "")
    .trim()
    .toLowerCase();

  if (!name || !email) return { success: false, error: "missing_fields" };
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return { success: false, error: "invalid_email" };

  const sheet = getOrCreateRegistrationsSheet_();
  const hm = headersMap_(sheet);

  const existingRow = findUserRowIndexByEmail_(sheet, email, hm);
  if (existingRow >= 2) {
    const rowVals = sheet.getRange(existingRow, 1, 1, sheet.getLastColumn()).getValues()[0];
    return { success: false, error: "already_registered", user: rowToUser(rowVals, hm) };
  }

  const rank = Math.max(1, sheet.getLastRow()); // header is row 1, next row rank starts at 1
  const row = new Array(sheet.getLastColumn()).fill("");

  row[hm.rank] = rank;
  row[hm.name] = name;
  row[hm.email] = email;
  row[hm.referred_by] = referredBy;
  row[hm.invite_count] = 0;
  row[hm.registered_at] = nowIso_();
  row[hm.darshan_status] = "pending";
  row[hm.purchase_count] = 0;
  row[hm.total_spent_inr] = 0;

  sheet.appendRow(row);

  // Credit referrer
  if (referredBy && referredBy !== email) {
    const refRow = findUserRowIndexByEmail_(sheet, referredBy, hm);
    if (refRow >= 2) {
      const current = safeNumber_(sheet.getRange(refRow, hm.invite_count + 1).getValue(), 0);
      sheet.getRange(refRow, hm.invite_count + 1).setValue(current + 1);
    }
  }

  try {
    sendConfirmationEmail(name, email, rank);
  } catch (e) {
    logEmailFailure_("sendConfirmationEmail", e);
  }

  return {
    success: true,
    user: {
      rank: rank,
      name: name,
      email: email,
      invite_count: 0,
      samithi_id: "",
      samithi_name: "",
      samithi_city: ""
    }
  };
}

// -- DARSHAN ACTIONS --------------------------------------------

function generateDarshanInvite(params) {
  requireInternalToken_(params);

  const email = String(params.email || "")
    .trim()
    .toLowerCase();
  if (!email) return { success: false, error: "missing_email" };

  const sheet = getOrCreateRegistrationsSheet_();
  const hm = headersMap_(sheet);
  const rowIdx = findUserRowIndexByEmail_(sheet, email, hm);
  if (rowIdx < 2) return { success: false, error: "user_not_found" };

  const accessCode = generateAccessCode_();
  const passphrase = randomPassphrase_();
  const inviteAt = nowIso_();

  sheet.getRange(rowIdx, hm.darshan_access_code + 1).setValue(accessCode);
  sheet.getRange(rowIdx, hm.darshan_passphrase + 1).setValue(passphrase);
  sheet.getRange(rowIdx, hm.darshan_status + 1).setValue("active");
  sheet.getRange(rowIdx, hm.darshan_invite_sent_at + 1).setValue(inviteAt);

  const link = SITE_URL + "/store?email=" + encodeURIComponent(email) + "&code=" + encodeURIComponent(accessCode);
  try {
    sendDarshanInviteEmail_(email, passphrase, link);
  } catch (e) {
    logEmailFailure_("sendDarshanInviteEmail", e);
    return {
      success: false,
      error: "invite_generated_but_email_failed",
      email: email,
      access_code: accessCode,
      passphrase: passphrase
    };
  }

  return {
    success: true,
    email: email,
    access_code: accessCode,
    passphrase: passphrase,
    invite_sent_at: inviteAt
  };
}

/**
 * Daily batch job:
 * Sends Darshan invites only to registrants who were never sent one.
 * Safe to run once a day via time-driven trigger.
 */
function sendDailyDarshanInvitesToUnsent() {
  const sheet = getOrCreateRegistrationsSheet_();
  const hm = headersMap_(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { success: true, processed: 0, sent: 0, failed: 0, skipped: 0 };
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  let processed = 0;
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  rows.forEach(function (row, idx) {
    const rowIdx = idx + 2;
    const email = String(row[hm.email] || "").trim().toLowerCase();
    const existingCode = String(row[hm.darshan_access_code] || "").trim();
    const existingInviteAt = String(row[hm.darshan_invite_sent_at] || "").trim();
    const status = String(row[hm.darshan_status] || "")
      .trim()
      .toLowerCase();

    const alreadyInvited = Boolean(existingInviteAt || existingCode || status === "active" || status === "used");
    if (!email || alreadyInvited) {
      skipped += 1;
      return;
    }

    processed += 1;
    const accessCode = generateAccessCode_();
    const passphrase = randomPassphrase_();
    const inviteAt = nowIso_();
    const link = SITE_URL + "/store?email=" + encodeURIComponent(email) + "&code=" + encodeURIComponent(accessCode);

    try {
      sendDarshanInviteEmail_(email, passphrase, link);
      sheet.getRange(rowIdx, hm.darshan_access_code + 1).setValue(accessCode);
      sheet.getRange(rowIdx, hm.darshan_passphrase + 1).setValue(passphrase);
      sheet.getRange(rowIdx, hm.darshan_status + 1).setValue("active");
      sheet.getRange(rowIdx, hm.darshan_invite_sent_at + 1).setValue(inviteAt);
      sent += 1;
    } catch (e) {
      failed += 1;
      logEmailFailure_("daily_darshan_invite " + email, e);
    }
  });

  return { success: true, processed: processed, sent: sent, failed: failed, skipped: skipped };
}

function validateDarshanAccess(params) {
  const email = String(params.email || "")
    .trim()
    .toLowerCase();
  const code = String(params.code || "").trim();

  if (!email || !code) return { success: false, valid: false, error: "missing_fields" };

  const sheet = getOrCreateRegistrationsSheet_();
  const hm = headersMap_(sheet);
  const rowIdx = findUserRowIndexByEmail_(sheet, email, hm);
  if (rowIdx < 2) return { success: true, valid: false };

  const row = sheet.getRange(rowIdx, 1, 1, sheet.getLastColumn()).getValues()[0];
  const storedCode = String(row[hm.darshan_access_code] || "").trim();
  const status = String(row[hm.darshan_status] || "")
    .trim()
    .toLowerCase();
  const passphrase = String(row[hm.darshan_passphrase] || "").trim();

  const valid = storedCode === code && status === "active";
  if (!valid) return { success: true, valid: false };

  return { success: true, valid: true, passphrase: passphrase };
}

function verifyDarshanPassphrase(params) {
  const email = String(params.email || "")
    .trim()
    .toLowerCase();
  const selected = String(params.selected || "").trim();

  if (!email || !selected) return { success: false, error: "missing_fields" };

  const sheet = getOrCreateRegistrationsSheet_();
  const hm = headersMap_(sheet);
  const rowIdx = findUserRowIndexByEmail_(sheet, email, hm);
  if (rowIdx < 2) return { success: false, error: "user_not_found" };

  const row = sheet.getRange(rowIdx, 1, 1, sheet.getLastColumn()).getValues()[0];
  const expected = String(row[hm.darshan_passphrase] || "").trim();
  const status = String(row[hm.darshan_status] || "")
    .trim()
    .toLowerCase();

  if (status !== "active") return { success: false, error: "invite_not_active" };
  if (selected !== expected) return { success: false, error: "passphrase_mismatch" };

  sheet.getRange(rowIdx, hm.darshan_status + 1).setValue("used");
  sheet.getRange(rowIdx, hm.darshan_accessed_at + 1).setValue(nowIso_());

  return { success: true };
}

function recordPurchase(params) {
  requireInternalToken_(params);

  const email = String(params.email || "")
    .trim()
    .toLowerCase();
  const paymentId = String(params.payment_id || "").trim();
  const amount = safeNumber_(params.amount, 0); // INR expected
  if (!email) return { success: false, error: "missing_email" };

  const sheet = getOrCreateRegistrationsSheet_();
  const hm = headersMap_(sheet);
  const rowIdx = findUserRowIndexByEmail_(sheet, email, hm);
  if (rowIdx < 2) return { success: false, error: "user_not_found" };

  const purchaseCount = safeNumber_(sheet.getRange(rowIdx, hm.purchase_count + 1).getValue(), 0);
  const totalSpent = safeNumber_(sheet.getRange(rowIdx, hm.total_spent_inr + 1).getValue(), 0);

  sheet.getRange(rowIdx, hm.purchase_count + 1).setValue(purchaseCount + 1);
  sheet.getRange(rowIdx, hm.last_purchase_at + 1).setValue(nowIso_());
  sheet.getRange(rowIdx, hm.last_payment_id + 1).setValue(paymentId);
  sheet.getRange(rowIdx, hm.total_spent_inr + 1).setValue(totalSpent + amount);

  return {
    success: true,
    purchase_count: purchaseCount + 1,
    total_spent_inr: totalSpent + amount
  };
}

function recordOrderPayment(params) {
  const orderId = String(params.id || params.order_id || "").trim();
  const paymentId = String(params.payment_id || "").trim();
  const email = String(params.email || "")
    .trim()
    .toLowerCase();
  const amountPaise = safeNumber_(params.amount, 0);
  const amountInrFromParam = Number(params.amount_inr);
  const amountInr = Number.isFinite(amountInrFromParam) && amountInrFromParam >= 0
    ? amountInrFromParam
    : Math.max(0, amountPaise / 100);
  const status = String(params.status || "paid")
    .trim()
    .toLowerCase();
  const totalItems = Math.max(
    0,
    safeNumber_(params.total_items || params.totalItems || params.quantity || params.box_count, 0)
  );
  const phone = String(params.phone || "").trim();
  const shippingAddress = String(params.shipping_address || params.address || "").trim();

  if (!orderId || !email) return { success: false, error: "missing_order_or_email" };

  const data = {
    id: orderId,
    payment_id: paymentId,
    email: email,
    amount_inr: amountInr,
    status: status,
    total_items: totalItems,
    phone: phone,
    shipping_address: shippingAddress
  };
  let emailSent = "NO";

  try {
    const html = buildDarshanEmailHTML(data);
    MailApp.sendEmail({
      to: data.email,
      subject: "Thank you for your Discovery Box order - SarvamSai",
      htmlBody: html
    });
    emailSent = "YES";
  } catch (e) {
    logEmailFailure_("recordOrderPayment", e);
  }

  appendOrderTrackingRow(data, emailSent);

  const sheet = getOrCreateOrderSheet_();
  sheet.appendRow([orderId, paymentId, email, amountInr, status, emailSent, nowIso_()]);

  return { success: true, email_sent: emailSent };
}

function getOrCreateOrderTrackingSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Order Tracking");

  if (!sheet) {
    sheet = ss.insertSheet("Order Tracking");
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Order ID",
      "Payment ID",
      "Email",
      "Amount",
      "Status",
      "Email Sent",
      "Fulfilment Status",
      "Tracking ID",
      "Notes",
      "Timestamp"
    ]);
  }

  return sheet;
}

function appendOrderTrackingRow(data, emailSent) {
  const sheet = getOrCreateOrderTrackingSheet();

  sheet.appendRow([
    data.id,
    data.payment_id || "",
    data.email,
    data.amount_inr,
    data.status || "paid",
    emailSent || "NO",
    "PENDING",
    "",
    "",
    new Date().toISOString()
  ]);
}

// -- GET USER / LEADERBOARD -------------------------------------

function getUser(params) {
  const email = String(params.email || "")
    .trim()
    .toLowerCase();
  if (!email) return { success: false, error: "missing_email" };

  const sheet = getOrCreateRegistrationsSheet_();
  const hm = headersMap_(sheet);
  const rowIdx = findUserRowIndexByEmail_(sheet, email, hm);
  if (rowIdx < 2) return { success: false, error: "not_found" };

  const row = sheet.getRange(rowIdx, 1, 1, sheet.getLastColumn()).getValues()[0];
  return { success: true, user: rowToUser(row, hm) };
}

function getLeaderboard() {
  const sheet = getOrCreateRegistrationsSheet_();
  if (sheet.getLastRow() < 2) return { success: true, leaderboard: [] };

  const hm = headersMap_(sheet);
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();

  const seen = new Set();
  const leaders = rows
    .map(function (r) {
      return rowToUser(r, hm);
    })
    .filter(function (u) {
      const e = String(u.email || "")
        .trim()
        .toLowerCase();
      if (!e || seen.has(e)) return false;
      seen.add(e);
      return safeNumber_(u.invite_count, 0) > 0;
    })
    .sort(function (a, b) {
      return safeNumber_(b.invite_count, 0) - safeNumber_(a.invite_count, 0);
    })
    .slice(0, 10)
    .map(function (u) {
      return { name: u.name, email: maskEmail(u.email), invite_count: safeNumber_(u.invite_count, 0) };
    });

  return { success: true, leaderboard: leaders };
}

// -- SAMITHI (unchanged behavior) -------------------------------

function getSamithis() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SAMITHI_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return { success: true, samithis: [] };

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  const samithis = rows.map(function (r) {
    return {
      id: r[headers.indexOf("id")] || "",
      name: r[headers.indexOf("name")] || "",
      city: r[headers.indexOf("city")] || "",
      member_count: r[headers.indexOf("member_count")] || 0
    };
  });
  return { success: true, samithis: samithis };
}

function joinSamithi(params) {
  const samithiId = String(params.samithi_id || "").trim();
  const email = String(params.email || "")
    .trim()
    .toLowerCase();
  if (!samithiId || !email) return { success: false, error: "missing_fields" };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const regSheet = getOrCreateRegistrationsSheet_();
  const samSheet = ss.getSheetByName(SAMITHI_SHEET);
  if (!samSheet) return { success: false, error: "no_samithi_sheet" };

  const samData = samSheet.getDataRange().getValues();
  const samHeaders = samData[0];
  const samRows = samData.slice(1);
  const samIdx = samRows.findIndex(function (r) {
    return String(r[samHeaders.indexOf("id")]) === samithiId;
  });
  if (samIdx < 0) return { success: false, error: "samithi_not_found" };

  const samName = samRows[samIdx][samHeaders.indexOf("name")];
  const samCity = samRows[samIdx][samHeaders.indexOf("city")];

  const hm = headersMap_(regSheet);
  const userRow = findUserRowIndexByEmail_(regSheet, email, hm);
  if (userRow < 2) return { success: false, error: "user_not_found" };

  regSheet.getRange(userRow, hm.samithi_id + 1).setValue(samithiId);
  regSheet.getRange(userRow, hm.samithi_name + 1).setValue(samName);
  regSheet.getRange(userRow, hm.samithi_city + 1).setValue(samCity);

  const countCol = samHeaders.indexOf("member_count") + 1;
  const current = safeNumber_(samRows[samIdx][samHeaders.indexOf("member_count")], 0);
  samSheet.getRange(samIdx + 2, countCol).setValue(current + 1);

  return { success: true };
}

function addSamithi(params) {
  const name = String(params.name || "").trim();
  const city = String(params.city || "").trim();
  const phone = String(params.phone || "").trim();
  const email = String(params.email || "")
    .trim()
    .toLowerCase();
  if (!name || !city) return { success: false, error: "missing_fields" };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SAMITHI_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(SAMITHI_SHEET);
    sheet.appendRow(["id", "name", "city", "phone", "member_count", "created_at", "created_by"]);
  }

  const id = "S" + Date.now();
  sheet.appendRow([id, name, city, phone, 1, nowIso_(), email]);

  const regSheet = getOrCreateRegistrationsSheet_();
  const hm = headersMap_(regSheet);
  const userRow = findUserRowIndexByEmail_(regSheet, email, hm);
  if (userRow >= 2) {
    regSheet.getRange(userRow, hm.samithi_id + 1).setValue(id);
    regSheet.getRange(userRow, hm.samithi_name + 1).setValue(name);
    regSheet.getRange(userRow, hm.samithi_city + 1).setValue(city);
  }

  return { success: true, samithi_id: id };
}

function getSamithiLeaderboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SAMITHI_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return { success: true, samithis: [] };

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  const samithis = rows
    .map(function (r) {
      return {
        name: r[headers.indexOf("name")] || "",
        city: r[headers.indexOf("city")] || "",
        member_count: safeNumber_(r[headers.indexOf("member_count")], 0)
      };
    })
    .filter(function (s) {
      return s.member_count > 0;
    })
    .sort(function (a, b) {
      return b.member_count - a.member_count;
    })
    .slice(0, 10);

  return { success: true, samithis: samithis };
}

// -- USER/EMAIL VIEW HELPERS ------------------------------------

function rowToUser(row, hm) {
  return {
    rank: row[hm.rank] || 0,
    name: row[hm.name] || "",
    email: row[hm.email] || "",
    invite_count: safeNumber_(row[hm.invite_count], 0),
    samithi_id: row[hm.samithi_id] || "",
    samithi_name: row[hm.samithi_name] || "",
    samithi_city: row[hm.samithi_city] || "",
    darshan_status: row[hm.darshan_status] || "",
    darshan_invite_sent_at: row[hm.darshan_invite_sent_at] || "",
    darshan_accessed_at: row[hm.darshan_accessed_at] || "",
    purchase_count: safeNumber_(row[hm.purchase_count], 0),
    total_spent_inr: safeNumber_(row[hm.total_spent_inr], 0)
  };
}

function maskEmail(email) {
  const parts = String(email || "").split("@");
  if (parts.length < 2) return email;
  const name = parts[0];
  const domain = parts[1];
  const masked = name.length > 2 ? name[0] + "***" + name[name.length - 1] : name[0] + "***";
  return masked + "@" + domain;
}

function sendConfirmationEmail(name, email, rank) {
  const subject = "Sairam - Your place in the Darshan Queue is confirmed";
  const inviteLink = SITE_URL + "/?ref=" + encodeURIComponent(email);

  const plainBody =
    "Sairam " +
    name +
    ",\n\n" +
    "Your place in the SarvamSai Darshan Queue is confirmed.\n" +
    "Your queue number: #" +
    rank +
    "\n\n" +
    "Invite link: " +
    inviteLink +
    "\n\n" +
    "With devotion,\nSarvamSai Team\n" +
    SITE_URL;

  const htmlBody =
    "<p>Sairam " +
    name +
    ",</p>" +
    "<p>Your place in the SarvamSai Darshan Queue is confirmed.</p>" +
    "<p><strong>Your queue number: #" +
    rank +
    "</strong></p>" +
    '<p>Invite link: <a href="' +
    inviteLink +
    '">' +
    inviteLink +
    "</a></p>";

  const mailOpts = { from: SENDER_EMAIL, htmlBody: htmlBody, name: "SarvamSai" };
  if (SENDER_EMAIL !== ADMIN_EMAIL) mailOpts.replyTo = ADMIN_EMAIL;
  sendMailWithFallback_(email, subject, plainBody, mailOpts);

  try {
    GmailApp.sendEmail(
      ADMIN_NOTIFY_EMAIL,
      "New registration #" + rank + " - " + name,
      "Name: " + name + "\nEmail: " + email + "\nRank: #" + rank + "\nTime: " + nowIso_(),
      { from: SENDER_EMAIL, name: "SarvamSai Queue" }
    );
  } catch (e) {
    logEmailFailure_("admin notify", e);
  }
}

function buildDarshanEmailHTML(data) {
  const safeOrderId = escapeHtml_(data.id || "-");
  const safePaymentId = escapeHtml_(data.payment_id || "-");
  const safeAmount = escapeHtml_(Math.max(0, safeNumber_(data.amount_inr, 0)).toFixed(2));
  const safeTotalItems = escapeHtml_(String(Math.max(0, safeNumber_(data.total_items, 0)) || 1));
  const safePhone = escapeHtml_(data.phone || "-");
  const safeAddress = escapeHtml_(data.shipping_address || "-");

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0;padding:0;background:#f3ede2;font-family:Georgia,serif;color:#2d2215;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#faf6ef;border:1px solid #d9cdb3;">
          <tr><td style="height:4px;background:linear-gradient(90deg,#c8a84b,#e8cc7a,#c8a84b);"></td></tr>

          <tr>
            <td style="background:#1a0a06;text-align:center;padding:0;">
              <img src="https://sarvamsai.in/sarvamsai-hero-transparent.png" alt="SarvamSai" width="280" style="display:block;margin:0 auto;max-width:280px;width:100%;" />
            </td>
          </tr>
          <tr>
            <td style="background:#6b1e2a;color:#f3e8c0;text-align:center;padding:14px 24px;border-bottom:1px solid rgba(200,168,75,0.35);">
              <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#d7b869;">Order Confirmation</div>
              <div style="font-size:18px;font-weight:600;margin-top:6px;color:#fff4d2;">Thank you for your Discovery Box order</div>
            </td>
          </tr>

          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 14px;font-size:16px;line-height:1.8;">Sairam,</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.9;">Your order has been received successfully.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e4d6bf;background:#f7f0e4;">
                <tr><td style="padding:12px 14px;border-bottom:1px solid #e4d6bf;"><strong>Order ID:</strong> ${safeOrderId}</td></tr>
                <tr><td style="padding:12px 14px;border-bottom:1px solid #e4d6bf;"><strong>Payment ID:</strong> ${safePaymentId}</td></tr>
                <tr><td style="padding:12px 14px;border-bottom:1px solid #e4d6bf;"><strong>Amount:</strong> INR ${safeAmount}</td></tr>
                <tr><td style="padding:12px 14px;border-bottom:1px solid #e4d6bf;"><strong>Number of Discovery Boxes:</strong> ${safeTotalItems}</td></tr>
                <tr><td style="padding:12px 14px;border-bottom:1px solid #e4d6bf;"><strong>Phone:</strong> ${safePhone}</td></tr>
                <tr><td style="padding:12px 14px;"><strong>Shipping Address:</strong> ${safeAddress}</td></tr>
              </table>

              <p style="margin:0;font-size:14px;line-height:1.8;color:#5c4a30;">
                We will keep you updated with fulfilment and delivery status.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#1a0a06;text-align:center;padding:0;">
              <img src="https://sarvamsai.in/lotus_feet_footer.png" alt="Lotus Feet" width="180" style="display:block;margin:0 auto;max-width:180px;width:100%;" />
              <p style="margin:0;padding:4px 0 16px;color:rgba(200,168,75,0.75);font-size:12px;letter-spacing:1px;">
                Sarvam Sai Mayam - Everything is Sai.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#3a2210;text-align:center;padding:16px 20px;">
              <p style="margin:0;color:#d7b869;font-size:11px;letter-spacing:2px;text-transform:uppercase;">With gratitude</p>
              <p style="margin:6px 0 0;color:#f3e8c0;font-size:13px;">The SarvamSai Team</p>
              <p style="margin:4px 0 0;"><a href="https://sarvamsai.in" style="color:#c8a84b;text-decoration:none;font-size:12px;">sarvamsai.in</a></p>
            </td>
          </tr>
          <tr><td style="height:4px;background:linear-gradient(90deg,#c8a84b,#e8cc7a,#c8a84b);"></td></tr>
        </table>
      </td>
    </tr>
  </table>
  `;
}

function escapeHtml_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sendDarshanInviteEmail_(email, passphrase, accessLink) {
  const subject = "Your Darshan Awaits ✨";
  const safeEmail = escapeHtml_(email);
  const safePassphrase = escapeHtml_(passphrase);
  const safeLink = escapeHtml_(accessLink);

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f3ede2;font-family:Georgia,serif;color:#2d2215;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3ede2;padding:24px 12px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#faf6ef;border:1px solid #d9cdb3;">
        <tr><td style="height:4px;background:linear-gradient(90deg,#c8a84b,#e8cc7a,#c8a84b);"></td></tr>

        <!-- Header / Hero -->
        <tr>
          <td style="background:#1a0a06;text-align:center;padding:0;">
            <img src="https://sarvamsai.in/sarvamsai-hero-transparent.png"
                 alt="SarvamSai"
                 width="280"
                 style="display:block;margin:0 auto;max-width:280px;width:100%;" />
          </td>
        </tr>
        <tr>
          <td style="background:#6b1e2a;color:#f3e8c0;text-align:center;padding:14px 24px;border-bottom:1px solid rgba(200,168,75,0.35);">
            <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#d7b869;">Darshan Invitation</div>
            <div style="font-size:18px;font-weight:600;margin-top:6px;color:#fff4d2;">Your Darshan Awaits</div>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:30px 28px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.8;">Sairam,</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.9;">
              Your private Darshan access is now ready in the SarvamSai offering.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
              <tr>
                <td style="background:#f2eadb;border:1px solid #d8cab0;border-left:4px solid #c8a84b;padding:16px;">
                  <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8d6b28;margin-bottom:8px;">Passphrase</div>
                  <div style="font-size:20px;color:#5a1520;font-weight:700;">${safePassphrase}</div>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#5c4a30;">
              Use this same passphrase after opening your access link:
            </p>
            <p style="margin:0 0 22px;word-break:break-all;font-size:13px;line-height:1.7;">
              <a href="${safeLink}" style="color:#5a1520;text-decoration:none;">${safeLink}</a>
            </p>

            <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px;">
              <tr>
                <td style="background:#5a1520;border:1px solid #4a111a;border-radius:3px;">
                  <a href="${safeLink}" style="display:inline-block;padding:12px 22px;color:#fff7e3;text-decoration:none;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
                    Enter Darshan
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:18px 0 0;font-size:12px;line-height:1.7;color:#7d6a4a;text-align:center;">
              This invite is linked to: <strong>${safeEmail}</strong>
            </p>
          </td>
        </tr>

        <!-- Footer visual -->
        <tr>
          <td style="background:#1a0a06;text-align:center;padding:0;">
            <img src="https://sarvamsai.in/lotus_feet_footer.png"
                 alt="Lotus Feet"
                 width="180"
                 style="display:block;margin:0 auto;max-width:180px;width:100%;" />
            <p style="margin:0;padding:4px 0 16px;color:rgba(200,168,75,0.75);font-size:12px;letter-spacing:1px;">
              Sarvam Sai Mayam - Everything is Sai.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#3a2210;text-align:center;padding:16px 20px;">
            <p style="margin:0;color:#d7b869;font-size:11px;letter-spacing:2px;text-transform:uppercase;">With devotion</p>
            <p style="margin:6px 0 0;color:#f3e8c0;font-size:13px;">The SarvamSai Team</p>
            <p style="margin:4px 0 0;"><a href="https://sarvamsai.in" style="color:#c8a84b;text-decoration:none;font-size:12px;">sarvamsai.in</a></p>
          </td>
        </tr>

        <tr><td style="height:4px;background:linear-gradient(90deg,#c8a84b,#e8cc7a,#c8a84b);"></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const plainBody =
    `Sairam,\n\n` +
    `Your Darshan invitation is ready.\n\n` +
    `Passphrase: ${passphrase}\n` +
    `Access link: ${accessLink}\n\n` +
    `With devotion,\nSarvamSai Team\n${SITE_URL}`;

  const mailOpts = {
    from: SENDER_EMAIL,
    htmlBody: htmlBody,
    name: "SarvamSai"
  };
  if (SENDER_EMAIL !== ADMIN_EMAIL) mailOpts.replyTo = ADMIN_EMAIL;

  sendMailWithFallback_(email, subject, plainBody, mailOpts);
}

// -- AUTH/TEST UTILITIES ----------------------------------------

function authorizeGmail() {
  GmailApp.sendEmail(
    Session.getActiveUser().getEmail(),
    "SarvamSai - Gmail permission OK",
    "This confirms Apps Script may send mail as you."
  );
}

function testRegistrationEmail() {
  sendConfirmationEmail("Test User", Session.getActiveUser().getEmail(), 999);
}

function testDarshanInviteSelf() {
  const email = Session.getActiveUser().getEmail().toLowerCase();
  const link = SITE_URL + "/store?email=" + encodeURIComponent(email) + "&code=" + encodeURIComponent(generateAccessCode_());
  sendDarshanInviteEmail_(email, randomPassphrase_(), link);
}

function helperSendStyledOrderEmail() {
  // Hardcode the target email here before running this helper.
  const hardcodedEmail = "vinnakota.gupta@gmail.com";
  // Optional fallback values if OrderPayments does not have this email yet.
  const fallbackOrderId = "";
  const fallbackPaymentId = "";
  const fallbackAmountInr = 0;
  const normalizedEmail = String(hardcodedEmail || "")
    .trim()
    .toLowerCase();
  if (!normalizedEmail || normalizedEmail.indexOf("@") < 1) {
    throw new Error("Please set a valid hardcodedEmail in helperSendStyledOrderEmail().");
  }

  const latestOrder = getLatestOrderByEmail_(normalizedEmail);
  if (latestOrder && latestOrder.orderId) {
    const amountInr = Math.max(0, safeNumber_(latestOrder.amountInr, 0));
    sendDiscoveryOrderEmail_(normalizedEmail, latestOrder.orderId, latestOrder.paymentId, amountInr);

    Logger.log(
      "Styled order email sent from sheet data to %s for order %s (payment %s).",
      normalizedEmail,
      latestOrder.orderId,
      latestOrder.paymentId || "-"
    );
    return;
  }

  if (!fallbackOrderId || safeNumber_(fallbackAmountInr, 0) <= 0) {
    throw new Error(
      "No order found in OrderPayments for " +
        normalizedEmail +
        ". Set fallbackOrderId and fallbackAmountInr in helperSendStyledOrderEmail() to send manually."
    );
  }

  sendDiscoveryOrderEmail_(
    normalizedEmail,
    String(fallbackOrderId).trim(),
    String(fallbackPaymentId || "").trim(),
    Math.max(0, safeNumber_(fallbackAmountInr, 0))
  );

  Logger.log(
    "Styled order email sent using fallback data to %s for order %s (payment %s).",
    normalizedEmail,
    String(fallbackOrderId).trim(),
    String(fallbackPaymentId || "").trim() || "-"
  );
}
