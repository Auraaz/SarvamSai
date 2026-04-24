const STORE_URL = "https://sarvamsai.in/store/";
const PRODUCTION_API_BASE = "/api";
function getApiBase() {
  return PRODUCTION_API_BASE;
}
const API_BASE = getApiBase();
const START_DATE = new Date("2026-04-24");
let razorpayScriptPromise = null;
let razorpayKeyCache = "";
let RAZORPAY_KEY = "";
let reserveCtaObserver = null;
const DEBUG = false;
const BASE_PRICE_INR = 2999;
const INTERNATIONAL_SHIPPING_USD = 15;
const USD_TO_INR_RATE = 83;
const INTERNATIONAL_SHIPPING_INR = INTERNATIONAL_SHIPPING_USD * USD_TO_INR_RATE;
const ORDER_CONFIRMATION_STORAGE_KEY = "sai_last_confirmed_order";
let order = {
  items: []
};
let activeAccessEmail = "";
let activeAccessCode = "";
let activePassphrase = "";
const PASS_PHRASES = [
  "Love All Serve All",
  "Help Ever Hurt Never",
  "Hands that Serve are Holier",
  "Start the Day with Love",
  "Duty Without Love is Deplorable",
  "Be Simple and Sincere",
  "Service to Man is Service to God"
];

function logDebug(label, data) {
  if (DEBUG) {
    console.log(`[DEBUG] ${label}:`, data);
  }
}

function showUserError(message) {
  console.error(message);
  setCheckoutHintMessage(message);
}

function generateCode() {
  return "SAI-" + Math.random().toString(36).substring(2, 7).toUpperCase();
}

function getCurrentDay() {
  const today = new Date();
  const diff = Math.floor((today - START_DATE) / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(diff, 1), 100);
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch (error) {
    return null;
  }
}

function getStoredOrderConfirmation() {
  try {
    const raw = localStorage.getItem(ORDER_CONFIRMATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_error) {
    return null;
  }
}

function setStoredOrderConfirmation(order) {
  if (!order) return;
  const payload = {
    ...order,
    confirmedAt: order.confirmedAt || new Date().toISOString()
  };
  localStorage.setItem(ORDER_CONFIRMATION_STORAGE_KEY, JSON.stringify(payload));
}

function clearStoredOrderConfirmation() {
  localStorage.removeItem(ORDER_CONFIRMATION_STORAGE_KEY);
  renderStore();
}

function getUserEmail() {
  const user = getStoredUser();
  if (user && user.email) {
    return String(user.email).trim().toLowerCase();
  }
  return String(localStorage.getItem("sai_access_email") || "").trim().toLowerCase();
}

function getUserInitials(user) {
  if (!user) return "SS";
  const source = (user.name || user.email || "SS").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function getInviteLink(user) {
  if (!user || !user.code) return STORE_URL;
  return `https://sarvamsai.in/?ref=${encodeURIComponent(user.code)}`;
}

function formatMintDate(dayNumber) {
  const date = new Date(START_DATE);
  date.setDate(START_DATE.getDate() + (dayNumber - 1));
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function setStoreVisibility(showStore) {
  const preStore = document.getElementById("darshan-access-flow");
  const storeContent = document.getElementById("storeContent");
  if (preStore) {
    preStore.style.display = showStore ? "none" : "block";
  } else {
    const gate = document.getElementById("gate");
    if (!gate) return;
    gate.style.display = showStore ? "none" : "block";
  }
  if (storeContent) {
    storeContent.style.display = showStore ? "block" : "none";
  }
}

function renderStore() {
  const storeContent = document.getElementById("storeContent");
  if (!storeContent) return;

  if (!order || typeof order !== "object") {
    order = { items: [] };
  }
  if (!Array.isArray(order.items)) {
    order.items = [];
  }

  const user = getStoredUser() || {};
  const confirmedOrder = getStoredOrderConfirmation();
  const day = getCurrentDay();
  const remainingToday = 100;
  const totalInvites = user.invitesLeft || 3;
  const invitesUsed = user.invitesUsed || 0;
  const invitesRemaining = Math.max(totalInvites - invitesUsed, 0);
  const displayPassphrase = activePassphrase || String(localStorage.getItem("sai_access_passphrase") || "").trim();
  const inviteLink = getInviteLink(user);
  const userInitials = getUserInitials(user);
  const swaroopas = [
    { value: "Satya Swaroopa", robe: "Saffron Robe", ratio: "4 in 10", image: "/swaroopa-saffron.webp" },
    { value: "Dharma Swaroopa", robe: "Golden Robe", ratio: "3 in 10", image: "/swaroopa-golden.webp" },
    { value: "Shanti Swaroopa", robe: "White Robe", ratio: "2 in 10", image: "/swaroopa-white.webp" },
    { value: "Prema Swaroopa", robe: "Crimson Robe", ratio: "1 in 10", image: "/swaroopa-crimson.webp" }
  ];

  let previousMintCards = "";
  for (let i = day - 1; i >= Math.max(day - 6, 1); i--) {
    previousMintCards += `
      <article class="ss-prev-mint-card">
        <div>
          <h4>Day ${i}</h4>
          <p class="ss-status">Mint Distributed</p>
          <p class="ss-sub">Distributed on ${formatMintDate(i)}</p>
        </div>
      </article>
    `;
  }
  if (!previousMintCards) {
    previousMintCards = `
      <article class="ss-prev-mint-card">
        <div>
          <h4>Day 1</h4>
          <p class="ss-status">Mint Distributed</p>
          <p class="ss-sub">The journey begins today.</p>
        </div>
      </article>
    `;
  }

  const reserveButtonPrimary =
    remainingToday > 0
      ? `<button id="ssPrimaryReserveCta" type="button" class="ss-btn ss-btn-gold" onclick="buyNow()" disabled>Reserve Your Piece</button>`
      : `<button id="ssPrimaryReserveCta" type="button" class="ss-btn ss-btn-gold" disabled>Mint Distributed</button>`;
  const reserveButtonFooter =
    remainingToday > 0
      ? `<button id="ssFooterReserveCta" type="button" class="ss-btn ss-btn-gold" onclick="buyNow()" disabled>Reserve Your Piece</button>`
      : `<button id="ssFooterReserveCta" type="button" class="ss-btn ss-btn-gold" disabled>Mint Distributed</button>`;

  storeContent.innerHTML = `
    ${confirmedOrder ? `
      <section class="ss-success-card" id="ssOrderSuccessCard">
        <h2>Congratulations. Your order is confirmed.</h2>
        <p>Your piece has been reserved in the SarvamSai 100-day journey.</p>
        <div class="ss-success-meta">
          <span>Payment ID: <strong>${confirmedOrder.paymentId || "Confirmed"}</strong></span>
          <span>Total Pieces: <strong>${confirmedOrder.totalItems || confirmedOrder.quantity || 1}</strong></span>
          <span>Recipients: <strong>${Array.isArray(confirmedOrder.items) ? confirmedOrder.items.length : 0}</strong></span>
          <span>Status: <strong>${confirmedOrder.status || "confirmed"}</strong></span>
        </div>
        <button type="button" class="ss-btn ss-btn-ghost" onclick="clearOrderConfirmation()">Dismiss</button>
      </section>
    ` : ""}

    <header class="ss-store-header">
      <div class="ss-brand">
        <img src="/centenary-emblem.webp" alt="SarvamSai logo" loading="eager" />
        <div>
          <strong>SarvamSai</strong>
          <span>A Centenary Offering</span>
        </div>
      </div>
      <div class="ss-header-right">
        <span class="ss-badge">Access Granted</span>
        <span class="ss-avatar">${userInitials}</span>
        <button class="ss-menu-btn" type="button" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>

    <section class="ss-glass-card ss-product-hero-card" id="product">
      <span class="eyebrow" style="justify-content:center;">The Collectible Discovery Box</span>
      <div
        data-ss-box-canvas
        data-scene-id="easter-scene"
        data-box-id="easter-box"
        data-scene-role="button"
        data-box-role="button"
        data-scene-tab-index="0"
        data-box-tab-index="0"
        data-scene-aria="Open Aaradhana Day poster preview"
        data-box-aria="Reveal Aaradhana Day poster"
        data-scene-on-click="if(window.ssEasterOpen){window.ssEasterOpen();}"
        data-box-on-click="if(window.ssEasterOpen){window.ssEasterOpen();}"
      ></div>
    </section>

    <section class="ss-hero-grid">
      <article class="ss-glass-card ss-hero-copy ss-hero-copy-full">
        <h1>Reserve Your Piece</h1>
        <p>
          One hundred days. One hundred Discovery Boxes each day, each sealed, hand-finished, and time-stamped.
          You have entered the private invitation layer of the same offering.
        </p>

        <div class="ss-key-info">
          <div><span>Price</span><strong>₹${BASE_PRICE_INR}</strong></div>
          <div><span>Remaining Today</span><strong>${remainingToday} / 100</strong></div>
          <div><span>Distribution</span><strong>Each piece is part of today’s distribution.</strong></div>
        </div>

        <div class="ss-recipient-flow">
          <h3>Who is this for?</h3>
          <p class="ss-note">Reserve for yourself, or offer to others.</p>
          <button type="button" class="ss-btn ss-btn-ghost" onclick="addItem()">Add Item</button>
          <div id="ssItemList" class="ss-gift-list"></div>
          <div class="ss-order-total">
            <span>Total pieces: <strong id="ssTotalItems">0</strong></span>
            <span>International addresses: <strong id="ssInternationalCount">0</strong></span>
            <span>Shipping surcharge: <strong id="ssShippingSurcharge">₹0</strong></span>
            <span>Total amount: <strong id="ssTotalAmount">₹0</strong></span>
          </div>
          <p id="ssSoftLimitHint" class="ss-checkout-hint"></p>
          <p id="ssCheckoutHint" class="ss-checkout-hint" aria-live="polite">
            Please add at least one piece to continue.
          </p>
        </div>

        ${reserveButtonPrimary}
        <p class="ss-note">Secure checkout powered by Razorpay</p>
      </article>
    </section>

    <section class="ss-glass-card">
      <div class="ss-section-head">
        <h2>Previous Mints</h2>
        <p>Once distributed, that day is complete.</p>
      </div>
      <div class="ss-prev-mints-grid">
        ${previousMintCards}
      </div>
    </section>

    <section class="ss-shipping-grid">
      <article class="ss-glass-card">
        <h3>Worldwide Shipping</h3>
        <p>Delivered safely to all countries with secure handling.</p>
      </article>
      <article class="ss-glass-card">
        <h3>International ($15)</h3>
        <p>Global delivery with tracked handling and dispatch care.</p>
      </article>
      <article class="ss-glass-card">
        <h3>Secure Packaging</h3>
        <p>Premium protection for your collectible during transit.</p>
      </article>
    </section>

    <section class="ss-panels-grid">
      <article class="ss-glass-card">
        <h3>Your Access</h3>
        <div class="ss-line-row">
          <span>Passphrase</span>
          <code id="ssAccessPassphrase">${escapeHtml(displayPassphrase || "Not available")}</code>
          <button class="ss-btn ss-btn-ghost" type="button" onclick="copyStoreText('${escapeHtml(displayPassphrase)}', 'Passphrase copied')">Copy</button>
        </div>
        <div class="ss-line-row">
          <span>Invites Left</span>
          <strong>${invitesRemaining} / ${totalInvites}</strong>
        </div>
      </article>

      <article class="ss-glass-card">
        <h3>Invite & Share</h3>
        <div class="ss-line-row">
          <span>Invite Link</span>
          <code id="ssInviteLink">${inviteLink}</code>
          <button class="ss-btn ss-btn-ghost" type="button" onclick="copyStoreText('${inviteLink}', 'Invite link copied')">Copy</button>
        </div>
        <button class="ss-btn ss-btn-ghost" type="button" onclick="shareStoreInvite('${inviteLink}')">Share on WhatsApp</button>
        <p class="ss-note">Invite up to 3 devotees to join this offering.</p>
      </article>
    </section>

    <section class="ss-glass-card ss-orders-panel">
      <div class="ss-section-head">
        <h2>My Orders</h2>
        <p>Your confirmed reservations in this account.</p>
      </div>
      <div id="ssMyOrdersList" class="ss-orders-list">
        <p class="ss-note">Loading your orders...</p>
      </div>
    </section>

    <footer class="ss-store-footer">
      <strong>SarvamSai</strong>
      <p>A spiritual collectible journey in devotion and purpose.</p>
    </footer>

    <div class="ss-mobile-cta" id="ssMobileCta">
      ${reserveButtonFooter}
    </div>
  `;

  syncFooterCtaVisibility();
  initOrderFlow();
  loadMyOrders();

}

function getTotalItems() {
  return Array.isArray(order.items) ? order.items.length : 0;
}

function isInternationalCountry(countryValue) {
  const country = String(countryValue || "").trim().toLowerCase();
  if (!country) return false;
  return country !== "india";
}

function getInternationalItemsCount() {
  if (!Array.isArray(order.items)) return 0;
  return order.items.filter((item) => isInternationalCountry(item.country)).length;
}

function getTotalAmount() {
  const baseAmount = getTotalItems() * BASE_PRICE_INR;
  const internationalSurcharge = getInternationalItemsCount() * INTERNATIONAL_SHIPPING_INR;
  return baseAmount + internationalSurcharge;
}

function addItem() {
  if (!Array.isArray(order.items)) order.items = [];
  const hasSelfItem = order.items.some((item) => item.type === "self");
  order.items.push({
    type: hasSelfItem ? "gift" : "self",
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: ""
  });

  renderItems();
}

function removeItem(index) {
  if (index < 0 || index >= order.items.length) return;
  order.items.splice(index, 1);
  renderItems();
}

function updateItemField(index, field, value) {
  if (index < 0 || index >= order.items.length) return;
  if (field === "type") {
    order.items[index][field] = value === "self" ? "self" : "gift";
  } else {
    order.items[index][field] = String(value || "").trim();
  }
  updateCheckoutCtaState();
}

function renderItems() {
  const target = document.getElementById("ssItemList");
  if (!target) return;

  if (!order.items.length) {
    target.innerHTML = `<p class="ss-note">No pieces added yet.</p>`;
    updateCheckoutCtaState();
    return;
  }

  target.innerHTML = order.items
    .map(
      (item, index) => `
      <article class="ss-gift-card">
        <div class="ss-gift-head">
          <strong>Piece ${index + 1}</strong>
          <button type="button" class="ss-btn ss-btn-ghost ss-btn-mini" onclick="removeItem(${index})">Remove</button>
        </div>
        <select onchange="updateItemField(${index}, 'type', this.value)">
          <option value="self" ${item.type === "self" ? "selected" : ""}>Reserve for yourself</option>
          <option value="gift" ${item.type === "gift" ? "selected" : ""}>Offer to others</option>
        </select>
        <input type="text" placeholder="Recipient name *" value="${escapeHtml(item.name || "")}" oninput="updateItemField(${index}, 'name', this.value)" />
        <input type="tel" placeholder="Recipient phone *" value="${escapeHtml(item.phone || "")}" oninput="updateItemField(${index}, 'phone', this.value)" />
        <input type="text" placeholder="Address line 1 *" value="${escapeHtml(item.addressLine1 || "")}" oninput="updateItemField(${index}, 'addressLine1', this.value)" />
        <input type="text" placeholder="Address line 2 (optional)" value="${escapeHtml(item.addressLine2 || "")}" oninput="updateItemField(${index}, 'addressLine2', this.value)" />
        <div class="ss-gift-grid-2">
          <input type="text" placeholder="City *" value="${escapeHtml(item.city || "")}" oninput="updateItemField(${index}, 'city', this.value)" />
          <input type="text" placeholder="State / Province *" value="${escapeHtml(item.state || "")}" oninput="updateItemField(${index}, 'state', this.value)" />
        </div>
        <div class="ss-gift-grid-2">
          <input type="text" placeholder="Postal / ZIP code *" value="${escapeHtml(item.pincode || "")}" oninput="updateItemField(${index}, 'pincode', this.value)" />
          <input type="text" placeholder="Country *" value="${escapeHtml(item.country || "")}" oninput="updateItemField(${index}, 'country', this.value)" />
        </div>
      </article>
    `
    )
    .join("");

  updateCheckoutCtaState();
}

function validateOrderSelection() {
  if (!order.items.length) {
    return "Please add at least one piece before payment.";
  }
  for (let i = 0; i < order.items.length; i += 1) {
    const item = order.items[i] || {};
    if (!item.name || !item.phone || !item.addressLine1 || !item.city || !item.state || !item.pincode || !item.country) {
      return `Please complete all details for Piece ${i + 1}.`;
    }
    if (String(item.phone).replace(/\D/g, "").length < 7) {
      return `Please enter a valid phone number for Piece ${i + 1}.`;
    }
  }
  return "";
}

function updateOrderSummary() {
  const totalItemsEl = document.getElementById("ssTotalItems");
  const totalAmountEl = document.getElementById("ssTotalAmount");
  const internationalCountEl = document.getElementById("ssInternationalCount");
  const shippingSurchargeEl = document.getElementById("ssShippingSurcharge");
  if (totalItemsEl) totalItemsEl.textContent = String(getTotalItems());
  if (totalAmountEl) totalAmountEl.textContent = `₹${getTotalAmount()}`;
  if (internationalCountEl) internationalCountEl.textContent = String(getInternationalItemsCount());
  if (shippingSurchargeEl) shippingSurchargeEl.textContent = `₹${getInternationalItemsCount() * INTERNATIONAL_SHIPPING_INR}`;
}

function initOrderFlow() {
  if (!Array.isArray(order.items)) order.items = [];
  renderItems();
  updateCheckoutCtaState();
}

function formatOrderDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMyOrders(orders) {
  const target = document.getElementById("ssMyOrdersList");
  if (!target) return;

  if (!orders || !orders.length) {
    target.innerHTML = `<p class="ss-note">No confirmed orders yet in this account.</p>`;
    return;
  }

  const items = orders
    .map((order) => {
      const recipientList = Array.isArray(order.items) ? order.items : [];
      const recipientsCount = recipientList.length;
      const totalItems = Number(order.totalItems) || recipientsCount || 0;
      const recipientsMarkup = recipientList.length
        ? recipientList
            .map((item, idx) => `
              <div class="ss-order-gift-item">
                <strong>Recipient ${idx + 1}:</strong> ${escapeHtml(item.name || "-")}<br/>
                <span>${escapeHtml(
                  [
                    item.addressLine1,
                    item.addressLine2,
                    [item.city, item.state].filter(Boolean).join(", "),
                    [item.pincode, item.country].filter(Boolean).join(", ")
                  ]
                    .filter(Boolean)
                    .join(", ")
                ) || "-"}</span><br/>
                <span>Phone: ${escapeHtml(item.phone || "-")}</span><br/>
                <span>Shipping: ${escapeHtml(item.shippingStatus || "pending")}</span>
                ${item.trackingId ? `<br/><span>Tracking: ${escapeHtml(item.trackingId)}</span>` : ""}
              </div>
            `)
            .join("")
        : "<div>-</div>";
      return `
      <article class="ss-order-item">
        <div class="ss-order-row"><span>Status</span><strong>${escapeHtml(order.status || "confirmed")}</strong></div>
        <div class="ss-order-row"><span>Recipients</span><strong>${recipientsCount}</strong></div>
        <div class="ss-order-row"><span>Total Pieces</span><strong>${escapeHtml(totalItems || 0)}</strong></div>
        <div class="ss-order-row"><span>Payment ID</span><code>${escapeHtml(order.paymentId || "-")}</code></div>
        <div class="ss-order-row"><span>Order Date</span><strong>${formatOrderDate(order.date)}</strong></div>
        <details class="ss-order-details">
          <summary>Order details</summary>
          <div class="ss-order-details-content">
            <div class="ss-order-detail-line"><span>Order ID</span><code>${escapeHtml(order.orderId || "-")}</code></div>
            <div class="ss-order-detail-line"><span>Recipients</span><div class="ss-order-address">${recipientsMarkup}</div></div>
          </div>
        </details>
      </article>`;
    })
    .join("");

  target.innerHTML = items;
}

async function loadMyOrders() {
  const target = document.getElementById("ssMyOrdersList");
  const email = getUserEmail();
  if (!target || !email) return;

  try {
    const response = await fetch(`${API_BASE}/orders-by-email?email=${encodeURIComponent(email)}`);
    if (!response.ok) {
      throw new Error("Unable to fetch order history right now.");
    }
    const payload = await response.json();
    renderMyOrders(payload.orders || []);
  } catch (error) {
    target.innerHTML = `<p class="ss-note">${error.message || "Unable to load order history."}</p>`;
  }
}

function updateCheckoutCtaState() {
  const primaryCta = document.getElementById("ssPrimaryReserveCta");
  const footerCta = document.getElementById("ssFooterReserveCta");
  const hintEl = document.getElementById("ssCheckoutHint");
  const softLimitEl = document.getElementById("ssSoftLimitHint");
  if (!primaryCta || !footerCta) return;

  if (primaryCta.textContent.trim() !== "Reserve Your Piece") {
    return;
  }

  updateOrderSummary();
  const validationMessage = validateOrderSelection();
  const isValid = !validationMessage;

  primaryCta.disabled = !isValid;
  footerCta.disabled = !isValid;

  if (hintEl) {
    hintEl.textContent = isValid
      ? "Each piece is part of today’s distribution. You can now reserve your piece."
      : validationMessage;
  }
  if (softLimitEl) {
    softLimitEl.textContent = getTotalItems() > 4 ? "You’ve selected multiple pieces for today’s mint." : "";
  }
}

function syncFooterCtaVisibility() {
  const mobileCta = document.getElementById("ssMobileCta");
  const primaryCta = document.getElementById("ssPrimaryReserveCta");
  if (!mobileCta || !primaryCta) return;

  if (reserveCtaObserver) {
    reserveCtaObserver.disconnect();
    reserveCtaObserver = null;
  }

  const setFooterCtaHidden = (hidden) => {
    mobileCta.classList.toggle("ss-mobile-cta-hidden", hidden);
  };

  if ("IntersectionObserver" in window) {
    reserveCtaObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setFooterCtaHidden(Boolean(entry && entry.isIntersecting));
      },
      { threshold: 0.2 }
    );
    reserveCtaObserver.observe(primaryCta);
    return;
  }

  const rect = primaryCta.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const isVisible = rect.bottom > 0 && rect.top < viewportHeight;
  setFooterCtaHidden(isVisible);
}

function scrollSwaroopaTrack(direction) {
  const track = document.getElementById("swaroopaTrack");
  if (!track) return;
  track.scrollBy({ left: direction * 320, behavior: "smooth" });
}

function copyStoreText(value, noticeText) {
  if (!value) return;
  navigator.clipboard.writeText(value).then(function () {
    if (noticeText) showUserError(noticeText);
  });
}

function shareStoreInvite(inviteLink) {
  if (!inviteLink) return;
  const msg = encodeURIComponent(
    `Join me in the SarvamSai centenary offering. Receive your Discovery Box here: ${inviteLink}`
  );
  window.open(`https://wa.me/?text=${msg}`, "_blank", "noopener");
}

function sarvamSaiEnterDarshanAccess(event) {
  if (event && typeof event.preventDefault === "function") event.preventDefault();
  document.getElementById("darshan-access")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function checkAccess() {
  const emailEl = document.getElementById("email");
  if (!emailEl) return;

  const email = emailEl.value.trim().toLowerCase();
  const code = activeAccessCode;
  if (!email || !code) {
    showUserError("Please use your access link from the email.");
    return;
  }
  validateAccessCode(email, code);
}

function prefillEmail(email) {
  const emailInput = document.getElementById("email");
  if (emailInput) {
    emailInput.value = String(email || "").trim().toLowerCase();
  }
}

function shuffleOptions(list) {
  const copied = Array.isArray(list) ? [...list] : [];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copied[i];
    copied[i] = copied[j];
    copied[j] = temp;
  }
  return copied;
}

function generateOptions(correct) {
  const shuffled = PASS_PHRASES
    .filter((p) => p !== correct)
    .sort(() => 0.5 - Math.random())
    .slice(0, 2);
  return shuffleOptions([correct, ...shuffled]);
}

function renderOptions(options) {
  const container = document.getElementById("phrase-options");
  if (!container) return;
  container.innerHTML = options
    .map((opt) => `<button type="button" class="phrase-option ss-btn ss-btn-ghost">${escapeHtml(opt)}</button>`)
    .join("");
}

function showPassphraseScreen() {
  const gate = document.getElementById("gate");
  if (!gate) return;
  const options = generateOptions(activePassphrase);
  gate.innerHTML = `
    <h2 style="margin:0;font-family:'Cormorant Garamond', Georgia, serif;color:var(--ss-burgundy);font-size:1.7rem;">Your Darshan Awaits</h2>
    <p style="margin:0;color:var(--ss-muted);">Before you enter, recall this guiding thought</p>
    <div id="phrase-options" style="display:grid;gap:0.55rem;"></div>
    <p id="message" style="margin:0.2rem 0 0;color:var(--ss-muted);"></p>
  `;
  renderOptions(options);
}

function showGateError(message) {
  const gate = document.getElementById("gate");
  if (!gate) return;
  let errorEl = document.getElementById("gateError");
  if (!errorEl) {
    errorEl = document.createElement("p");
    errorEl.id = "gateError";
    errorEl.style.color = "#9b1c31";
    errorEl.style.margin = "0.2rem 0 0";
    gate.appendChild(errorEl);
  }
  errorEl.textContent = message;
}

async function validateAccessCode(email, code) {
  try {
    const res = await fetch(`${API_BASE}/validate-access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code })
    });

    const data = await res.json();
    if (data.valid) {
      activeAccessEmail = email;
      activeAccessCode = code;
      activePassphrase = String(data.passphrase || "");
      showPassphraseScreen();
    } else {
      showGateError("Invalid access link");
    }
  } catch (_error) {
    showGateError("Unable to validate your access link right now.");
  }
}

function showSoftError() {
  const msg = document.getElementById("message");
  if (!msg) return;
  msg.innerText = "Take a moment… recall the message again.";
}

async function verifyPassphraseSelection(email, selectedText) {
  try {
    const response = await fetch(`${API_BASE}/verify-passphrase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, selected: selectedText })
    });
    if (!response.ok) return false;
    const payload = await response.json();
    return Boolean(payload?.success);
  } catch (_error) {
    return false;
  }
}

function unlockStore() {
  localStorage.setItem("sai_access", "granted");
  if (activeAccessEmail) {
    localStorage.setItem("sai_access_email", activeAccessEmail);
  }
  if (activePassphrase) {
    localStorage.setItem("sai_access_passphrase", activePassphrase);
  }
  if (activeAccessCode) {
    localStorage.setItem("sai_access_code", activeAccessCode);
  }
  window.location.href = "/store/home";
}

async function onPhraseOptionSelect(selectedText) {
  if (!activeAccessEmail) {
    showSoftError();
    return;
  }
  const isValid = await verifyPassphraseSelection(activeAccessEmail, selectedText);
  if (isValid) {
    unlockStore();
  } else {
    showSoftError();
  }
}

function ensureRazorpayCheckoutLoaded() {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
    document.head.appendChild(script);
  });

  return razorpayScriptPromise;
}

function isLikelyUnsupportedCheckoutContext() {
  const ua = String(navigator.userAgent || "").toLowerCase();
  const inAppOrWebView =
    /\bwv\b/.test(ua) ||
    ua.includes("fbav") ||
    ua.includes("instagram") ||
    ua.includes("line/") ||
    ua.includes("micromessenger") ||
    ua.includes("linkedinapp") ||
    ua.includes("snapchat");
  const inIframe = (() => {
    try {
      return window.top !== window.self;
    } catch (_e) {
      return true;
    }
  })();
  const insecureContext = window.location.protocol !== "https:";
  return inAppOrWebView || inIframe || insecureContext;
}

function setCheckoutHintMessage(message) {
  const hintEl = document.getElementById("ssCheckoutHint");
  if (hintEl) hintEl.textContent = message;
}

async function fetchRazorpayKey() {
  if (razorpayKeyCache) return razorpayKeyCache;
  const response = await fetch(`${API_BASE}/payment-config`);
  if (!response.ok) {
    let detail = "";
    try {
      const err = await response.json();
      if (err && err.error) detail = " " + String(err.error);
    } catch (_e) {
      /* non-JSON body */
    }
    if (response.status === 404) {
      throw new Error(
        `Unable to load Razorpay config. (404: no API at ${API_BASE} — deploy the Node service and DNS, or set API_BASE in config/launch-global.js.)`
      );
    }
    throw new Error("Unable to load Razorpay config." + (detail || ` (${response.status})`));
  }
  const payload = await response.json();
  if (!payload || !payload.key) throw new Error("Razorpay key is missing.");
  razorpayKeyCache = payload.key;
  return razorpayKeyCache;
}

async function preloadRazorpayCheckout() {
  try {
    const [key] = await Promise.all([
      fetchRazorpayKey(),
      ensureRazorpayCheckoutLoaded()
    ]);
    RAZORPAY_KEY = key;
    logDebug("Razorpay preload complete", { loaded: Boolean(window.Razorpay), hasKey: Boolean(RAZORPAY_KEY) });
  } catch (error) {
    logDebug("Razorpay preload failed", error);
  }
}

function handlePaymentSuccess(paymentResponse, items, totalItems, totalAmount) {
  setStoredOrderConfirmation({
    paymentId: paymentResponse.razorpay_payment_id,
    items,
    totalItems,
    totalAmount,
    status: "confirmed"
  });
  renderStore();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function startRazorpay(orderDetails, context) {
  const { items, totalItems, totalAmount, email } = context;
  if (!orderDetails || !orderDetails.order_id) {
    showUserError("Unable to initiate payment.");
    return;
  }
  if (!window.Razorpay) {
    showUserError("Payment system failed to load. Please refresh and retry.");
    return;
  }

  const options = {
    key: orderDetails.key || RAZORPAY_KEY,
    amount: Number(orderDetails.amount),
    currency: orderDetails.currency || "INR",
    name: "SarvamSai",
    description: "Daily Mint",
    order_id: orderDetails.order_id,
    handler: async function (response) {
      try {
        const verifyRes = await fetch(`${API_BASE}/verify-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: orderDetails.order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          })
        });
        const data = await verifyRes.json();
        if (!data.success) {
          throw new Error("Verification failed");
        }
        handlePaymentSuccess(response, items, totalItems, totalAmount);
      } catch (_err) {
        showUserError("Payment verification failed.");
      }
    },
    modal: {
      ondismiss: function () {
        logDebug("Payment modal closed", {});
      }
    },
    prefill: {
      email: email,
      contact: items[0]?.phone || ""
    },
    theme: {
      color: "#D4AF37"
    }
  };

  const rzp = new Razorpay(options);
  rzp.on("payment.failed", function (response) {
    const reason =
      response?.error?.description ||
      response?.error?.reason ||
      "Payment failed. Please try again.";
    const lowered = String(reason).toLowerCase();
    if (lowered.includes("browser is not supported") || lowered.includes("not supported")) {
      showUserError(
        "This environment is blocking Razorpay modal. Open this exact page URL in a normal Chrome/Edge/Safari tab and retry."
      );
      return;
    }
    showUserError(reason);
  });
  rzp.open();
}

async function buyNow() {
  const validationError = validateOrderSelection();
  if (validationError) {
    const hintEl = document.getElementById("ssCheckoutHint");
    if (hintEl) {
      hintEl.textContent = validationError;
    }
    return;
  }

  const items = order.items.map((item) => ({
    type: item.type === "self" ? "self" : "gift",
    name: item.name,
    phone: item.phone,
    addressLine1: item.addressLine1,
    addressLine2: item.addressLine2,
    city: item.city,
    state: item.state,
    pincode: item.pincode,
    country: item.country
  }));
  const totalItems = getTotalItems();
  const totalAmount = getTotalAmount();

  const email = getUserEmail();
  if (!email) {
    showUserError("Please complete access with a valid email first.");
    return;
  }

  try {
    logDebug("Starting payment", {});
    if (isLikelyUnsupportedCheckoutContext()) {
      showUserError(
        "This browser context may block Razorpay checkout. Open this page directly in Chrome/Edge/Safari (not inside an in-app browser or embedded preview) and retry."
      );
      return;
    }
    if (!RAZORPAY_KEY) {
      showUserError("Payment system is still loading. Please try again in a moment.");
      return;
    }

    const orderResponse = await fetch(`${API_BASE}/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        items,
        totalItems,
        totalAmount
      })
    });
    logDebug("Order response status", orderResponse.status);

    if (!orderResponse.ok) {
      let message = "Could not create Razorpay order.";
      try {
        const errorPayload = await orderResponse.json();
        message = errorPayload?.error || message;
      } catch (_error) {
        // ignore JSON parse error and fallback to generic message
      }
      logDebug("Common failure detected", "fetch fails -> route issue or backend error");
      throw new Error(message);
    }

    const order = await orderResponse.json();
    logDebug("Order created", order);
    if (!order.order_id) {
      showUserError("Unable to initiate payment.");
      return;
    }
    if (!order.amount) {
      showUserError("Invalid order response from server.");
      return;
    }
    await startRazorpay(
      {
        ...order,
        key: RAZORPAY_KEY
      },
      { items, totalItems, totalAmount, email }
    );
  } catch (error) {
    logDebug("Payment error", error);
    showUserError(error.message || "Payment initialization failed.");
  }
}


function mountHomeExperience() {
  // Darshan / private-mint invite lives on /store only, not the marketing homepage.
}

function getDarshanStoreLandingHtml() {
  return `
  <section id="darshan-layer" class="darshan-on-store" aria-label="Darshan invitation">
    <div class="darshan-layer-inner">
      <p class="darshan-invite-tag">YOU'RE INVITED</p>

      <h2>Do you have a <span>darshan</span> appointment?</h2>

      <p class="darshan-subtext">
        This journey is by invitation and intention.
        If you have received access, you may enter the private mint.
      </p>

      <figure class="darshan-visual-wrap" aria-hidden="true">
        <div class="darshan-visual-glow"></div>
        <img src="/sarvamsai-hero-transparent.webp" alt="Standing blessing pose of Bhagawan Sri Sathya Sai Baba" />
      </figure>

      <article class="darshan-entry-card" role="button" tabindex="0" aria-label="Continue to darshan access" onclick="sarvamSaiEnterDarshanAccess(event)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();sarvamSaiEnterDarshanAccess(event);}">
        <div class="darshan-entry-icon">🛕</div>
        <div class="darshan-entry-copy">
          <strong>Enter Darshan</strong>
          <span>Access the private mint</span>
        </div>
        <div class="darshan-entry-arrow">→</div>
      </article>

      <div class="darshan-support-cards">
        <article class="darshan-support-card">
          <h3>Invite Only</h3>
          <p>This journey is private and by invitation only.</p>
        </article>
        <article class="darshan-support-card">
          <h3>Sacred Journey</h3>
          <p>Walk this 100 day path with devotion and purpose.</p>
        </article>
        <article class="darshan-support-card">
          <h3>Receive with Grace</h3>
          <p>Each day, 100 pieces are released and distributed.</p>
        </article>
      </div>

      <p class="darshan-footer-line">LOVE ALL • SERVE ALL • HELP EVER • HURT NEVER</p>
    </div>
  </section>
  `;
}

function ensureDarshanLayerStyles() {
  if (document.getElementById("darshan-layer-style")) return;
  const style = document.createElement("style");
  style.id = "darshan-layer-style";
  style.textContent = `
    #darshan-layer {
      width: 100%;
      padding: 24px 16px;
      background: linear-gradient(180deg, #0b0b0f 0%, #12121a 100%);
      color: #f5f5f5;
    }
    .darshan-on-store#darshan-layer {
      margin: 0 0 1.1rem 0;
      border-radius: 14px;
      overflow: hidden;
      box-sizing: border-box;
    }
    .darshan-layer-inner {
      max-width: 560px;
      margin: 0 auto;
      text-align: left;
      background: transparent;
    }
    .darshan-invite-tag {
      margin: 0 0 12px;
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #D4AF37;
      font-family: "Cinzel", serif;
    }
    .darshan-layer-inner h2 {
      margin: 0;
      color: #f5f5f5;
      font-family: "Cormorant Garamond", serif;
      font-size: clamp(28px, 7.5vw, 32px);
      line-height: 1.2;
      letter-spacing: 0.01em;
    }
    .darshan-layer-inner h2 span {
      color: #D4AF37;
      font-style: italic;
    }
    .darshan-subtext {
      margin: 12px 0 0;
      color: rgba(245, 245, 245, 0.8);
      font-size: 15px;
      line-height: 1.6;
      font-family: "EB Garamond", serif;
    }
    .darshan-visual-wrap {
      position: relative;
      width: 100%;
      margin: 16px 0 0;
      border-radius: 16px;
      overflow: hidden;
      background: radial-gradient(circle at 50% 35%, rgba(212,175,55,0.22), rgba(212,175,55,0.05) 52%, rgba(11,11,15,0.45) 100%);
      border: 1px solid rgba(212,175,55,0.24);
      box-shadow: inset 0 0 56px rgba(0, 0, 0, 0.45);
      min-height: 300px;
      display: grid;
      place-items: center;
    }
    .darshan-visual-glow {
      position: absolute;
      width: 72%;
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(212,175,55,0.35), rgba(212,175,55,0.03) 70%);
      filter: blur(8px);
    }
    .darshan-visual-wrap img {
      position: relative;
      z-index: 1;
      width: min(100%, 340px);
      height: auto;
      object-fit: contain;
      display: block;
    }
    .darshan-entry-card {
      margin-top: 20px;
      padding: 16px;
      border-radius: 16px;
      border: 1px solid rgba(212,175,55,0.3);
      background: rgba(255,255,255,0.03);
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    }
    .darshan-entry-card:hover,
    .darshan-entry-card:focus-visible {
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgba(0,0,0,0.28);
      border-color: rgba(212,175,55,0.55);
      outline: none;
    }
    .darshan-entry-icon {
      color: #D4AF37;
      font-size: 20px;
      line-height: 1;
    }
    .darshan-entry-copy strong {
      display: block;
      font-family: "Cinzel", serif;
      font-size: 15px;
      color: #f5f5f5;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .darshan-entry-copy span {
      display: block;
      color: rgba(245,245,245,0.78);
      font-size: 14px;
      margin-top: 2px;
    }
    .darshan-entry-arrow {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      color: #0b0b0f;
      background: #D4AF37;
      font-weight: 700;
      font-size: 18px;
    }
    .darshan-support-cards {
      margin-top: 20px;
      display: grid;
      gap: 12px;
    }
    .darshan-support-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(184,146,42,0.35);
      border-radius: 12px;
      padding: 14px;
    }
    .darshan-support-card h3 {
      margin: 0;
      color: #D4AF37;
      font-family: "Cinzel", serif;
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .darshan-support-card p {
      margin: 6px 0 0;
      color: rgba(245,245,245,0.8);
      font-family: "EB Garamond", serif;
      font-size: 15px;
      line-height: 1.55;
    }
    .darshan-footer-line {
      margin: 20px 0 0;
      text-align: center;
      color: rgba(212,175,55,0.9);
      font-family: "Cinzel", serif;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    @media (min-width: 900px) {
      .darshan-layer-inner {
        max-width: 980px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        column-gap: 24px;
        row-gap: 0;
        align-items: start;
      }
      .darshan-invite-tag,
      .darshan-layer-inner h2,
      .darshan-subtext,
      .darshan-entry-card,
      .darshan-support-cards,
      .darshan-footer-line {
        grid-column: 1;
      }
      .darshan-visual-wrap {
        grid-column: 2;
        grid-row: 1 / span 6;
        margin-top: 0;
        min-height: 420px;
      }
      .darshan-footer-line {
        text-align: left;
        margin-top: 16px;
      }
    }
  `;
  document.head.appendChild(style);
}

function showConfirmation(user) {
  const confirmation = document.getElementById("queueConfirmation");
  const accessCode = document.getElementById("accessCode");
  const inviteLink = document.getElementById("inviteLink");
  if (!confirmation || !accessCode || !inviteLink) return;

  const inviteUrl = `${window.location.origin}/store?email=${encodeURIComponent(user.email || "")}`;
  accessCode.textContent = user.code;
  inviteLink.href = inviteUrl;
  inviteLink.textContent = inviteUrl;
  confirmation.style.display = "block";
}

function mountStoreExperience() {
  const params = new URLSearchParams(window.location.search);
  const prefilledEmail = params.get("email");
  const prefilledCode = params.get("code");

  const darshanLanding = getDarshanStoreLandingHtml();

  document.body.innerHTML = `
    <main class="ss-launch-wrap">
      <div id="darshan-access-flow">
        ${darshanLanding}
        <section class="ss-card ss-gate-card" id="darshan-access">
          <h1>Your Darshan Awaits</h1>
          <p>Before you enter, recall this guiding thought.</p>
        </section>

        <section class="ss-card ss-gate-form" id="gate">
          <input id="email" type="email" placeholder="Enter your email" />
          <button type="button" class="ss-btn ss-btn-gold" onclick="checkAccess()">Validate Access Link</button>
        </section>
      </div>

      <div id="storeContent" style="display:none;"></div>
    </main>
  `;

  if (darshanLanding) {
    ensureDarshanLayerStyles();
  }

  const style = document.createElement("style");
  style.textContent = `
    :root {
      --ss-ivory: #faf6ef;
      --ss-cream: #f3ece0;
      --ss-gold: #b8922a;
      --ss-burgundy: #5a1520;
      --ss-ink: #1a120a;
      --ss-text: #1a120a;
      --ss-muted: #6b5a3e;
      --ss-border: rgba(184, 146, 42, 0.26);
      --ss-glass: rgba(250, 246, 239, 0.88);
    }
    html, body {
      margin: 0;
      min-height: 100%;
      overflow-x: hidden;
    }
    body {
      background: linear-gradient(180deg, var(--ss-ivory) 0%, var(--ss-cream) 100%);
      color: var(--ss-ink);
      font-family: "EB Garamond", Georgia, serif;
      line-height: 1.6;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    .ss-launch-wrap {
      max-width: 1040px;
      margin: 0 auto;
      padding: 2.4rem 1rem 6rem;
      width: 100%;
    }
    .ss-card {
      border: 1px solid var(--ss-border);
      background: rgba(250, 246, 239, 0.88);
      backdrop-filter: blur(8px);
      border-radius: 14px;
      padding: 1.25rem;
      margin-bottom: 1.1rem;
      box-shadow: 0 10px 30px rgba(90, 21, 32, 0.08);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      max-width: 100%;
    }
    .ss-card:hover, .ss-glass-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 30px rgba(90, 21, 32, 0.14);
    }
    .ss-gate-card h1 {
      margin: 0 0 0.35rem;
      font-family: "Cormorant Garamond", Georgia, serif;
      color: var(--ss-burgundy);
      font-size: clamp(1.8rem, 4vw, 2.2rem);
      letter-spacing: 0.02em;
    }
    .ss-gate-card p {
      margin: 0;
      color: var(--ss-muted);
    }
    .ss-gate-form {
      display: grid;
      gap: 0.75rem;
      max-width: 520px;
    }
    .ss-gate-form input {
      padding: 0.65rem 0.7rem;
      border: 1px solid var(--ss-border);
      border-radius: 10px;
      font-size: 1rem;
      background: var(--ss-ivory);
      color: var(--ss-ink);
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .ss-gate-form input:focus {
      outline: none;
      border-color: var(--ss-gold);
      box-shadow: 0 0 0 3px rgba(184, 146, 42, 0.16);
    }
    .ss-btn {
      border: none;
      border-radius: 10px;
      padding: 0.8rem 1.1rem;
      cursor: pointer;
      font-weight: 600;
      width: fit-content;
      transition: transform 0.3s ease, box-shadow 0.3s ease, filter 0.3s ease;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      max-width: 100%;
      white-space: normal;
    }
    .ss-btn:hover {
      transform: translateY(-2px);
      filter: brightness(1.05);
    }
    .ss-btn-gold {
      background: linear-gradient(135deg, #a98322, var(--ss-gold));
      color: #faf6ef;
      box-shadow: 0 8px 18px rgba(184, 146, 42, 0.3);
    }
    .ss-btn-ghost {
      background: rgba(243, 236, 224, 0.8);
      color: var(--ss-burgundy);
      border: 1px solid var(--ss-border);
    }
    .ss-success-card {
      border: 1px solid rgba(46, 123, 69, 0.28);
      background: linear-gradient(180deg, rgba(238, 250, 242, 0.98), rgba(227, 245, 233, 0.96));
      border-radius: 14px;
      padding: 1rem;
      margin-bottom: 1rem;
      box-shadow: 0 8px 24px rgba(46, 123, 69, 0.12);
    }
    .ss-success-card h2 {
      margin: 0;
      color: #1f5f34;
      font-family: "Cormorant Garamond", Georgia, serif;
      font-size: clamp(1.4rem, 4vw, 2rem);
    }
    .ss-success-card p {
      margin: 0.3rem 0 0.8rem;
      color: #2f5f3f;
      font-size: 0.98rem;
    }
    .ss-success-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.7rem;
      margin-bottom: 0.6rem;
      color: #2c4f37;
      font-size: 0.88rem;
    }
    .ss-success-meta strong {
      color: #1f5f34;
    }
    .ss-store-header {
      position: sticky;
      top: 0.75rem;
      z-index: 20;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.2rem;
      padding: 0.8rem 1rem;
      border: 1px solid var(--ss-border);
      border-radius: 12px;
      background: rgba(250, 246, 239, 0.9);
      backdrop-filter: blur(8px);
    }
    .ss-brand {
      display: flex;
      align-items: center;
      gap: 0.7rem;
    }
    .ss-brand img {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      box-shadow: 0 0 14px rgba(184, 146, 42, 0.25);
    }
    .ss-brand strong {
      display: block;
      font-family: "Cormorant Garamond", Georgia, serif;
      font-size: 1.2rem;
      color: var(--ss-gold);
      line-height: 1;
    }
    .ss-brand span {
      font-size: 0.8rem;
      color: var(--ss-muted);
    }
    .ss-header-right {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .ss-badge {
      border: 1px solid var(--ss-border);
      padding: 0.3rem 0.55rem;
      border-radius: 999px;
      font-size: 0.75rem;
      color: var(--ss-burgundy);
      background: rgba(184, 146, 42, 0.14);
    }
    .ss-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.72rem;
      font-weight: 700;
      border: 1px solid var(--ss-border);
      background: rgba(243, 236, 224, 0.85);
      color: var(--ss-burgundy);
    }
    .ss-menu-btn {
      width: 34px;
      height: 34px;
      border: 1px solid var(--ss-border);
      border-radius: 8px;
      background: transparent;
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      cursor: pointer;
    }
    .ss-menu-btn span {
      width: 15px;
      height: 2px;
      background: var(--ss-burgundy);
      border-radius: 2px;
    }
    .ss-hero-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
      align-items: stretch;
    }
    .ss-glass-card {
      border: 1px solid var(--ss-border);
      background: var(--ss-glass);
      backdrop-filter: blur(14px);
      border-radius: 14px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      box-shadow: 0 8px 26px rgba(90, 21, 32, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .ss-hero-copy h1 {
      margin: 0;
      font-family: "Cormorant Garamond", Georgia, serif;
      font-size: clamp(2rem, 5vw, 3rem);
      line-height: 1.05;
      color: var(--ss-burgundy);
    }
    .ss-hero-copy p {
      color: var(--ss-muted);
      margin: 0.75rem 0 1rem;
      font-size: 1.03rem;
    }
    .ss-key-info {
      display: grid;
      gap: 0.65rem;
      margin: 1rem 0 1.1rem;
    }
    .ss-key-info div {
      display: flex;
      justify-content: space-between;
      border: 1px solid rgba(184, 146, 42, 0.24);
      border-radius: 10px;
      padding: 0.55rem 0.7rem;
      background: rgba(250, 246, 239, 0.76);
    }
    .ss-key-info span {
      color: var(--ss-muted);
      font-size: 0.9rem;
    }
    .ss-key-info strong {
      color: var(--ss-burgundy);
      font-size: 0.95rem;
    }
    .ss-note {
      color: var(--ss-muted);
      margin: 0.55rem 0 0;
      font-size: 0.85rem;
    }
    .ss-recipient-flow {
      margin: 0.4rem 0 1rem;
      padding: 0.8rem;
      border: 1px solid rgba(184, 146, 42, 0.24);
      border-radius: 10px;
      background: rgba(250, 246, 239, 0.72);
      display: grid;
      gap: 0.55rem;
    }
    .ss-recipient-flow h3 {
      margin: 0 0 0.2rem;
      font-family: "Cormorant Garamond", Georgia, serif;
      font-size: 1.25rem;
      color: var(--ss-burgundy);
    }
    .ss-self-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      color: var(--ss-muted);
      font-size: 0.95rem;
    }
    .ss-self-toggle input {
      width: 16px;
      height: 16px;
    }
    .ss-gift-list {
      display: grid;
      gap: 0.55rem;
    }
    .ss-gift-card {
      border: 1px solid rgba(184, 146, 42, 0.2);
      border-radius: 10px;
      padding: 0.6rem;
      background: rgba(250, 246, 239, 0.8);
      display: grid;
      gap: 0.45rem;
    }
    .ss-gift-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.45rem;
    }
    .ss-gift-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .ss-gift-head strong {
      color: var(--ss-burgundy);
      font-size: 0.9rem;
    }
    .ss-gift-card input,
    .ss-gift-card textarea,
    .ss-gift-card select {
      border: 1px solid var(--ss-border);
      border-radius: 8px;
      padding: 0.58rem 0.62rem;
      background: var(--ss-ivory);
      color: var(--ss-ink);
      font-size: 0.95rem;
    }
    .ss-btn-mini {
      padding: 0.35rem 0.6rem;
      font-size: 0.78rem;
    }
    .ss-order-total {
      display: flex;
      flex-wrap: wrap;
      gap: 0.8rem;
      font-size: 0.92rem;
      color: var(--ss-muted);
    }
    .ss-order-total strong {
      color: var(--ss-burgundy);
    }
    .ss-checkout-hint {
      margin: 0.2rem 0 0;
      font-size: 0.86rem;
      color: var(--ss-muted);
      line-height: 1.45;
    }
    .ss-product-hero-card {
      padding: 1rem;
      overflow: hidden;
    }
    .ss-hero-copy-full {
      max-width: 760px;
      margin: 0 auto;
    }
    .ss-hero-visual {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      overflow: hidden;
      perspective: 900px;
      background: linear-gradient(180deg, rgba(250,246,239,0.7) 0%, rgba(243,236,224,0.8) 100%);
    }
    .ss-hero-visual .scene {
      width: 120px;
      height: 360px;
      perspective: 700px;
      margin: 0.6rem auto 0.4rem;
    }
    .ss-hero-visual .box {
      width: 120px;
      height: 360px;
      position: relative;
      transform-style: preserve-3d;
      animation: spinBox 16s linear infinite;
      filter: drop-shadow(0 16px 24px rgba(45, 18, 8, 0.25));
    }
    .ss-hero-visual .face {
      position: absolute;
      backface-visibility: hidden;
      overflow: hidden;
      border: 1px solid rgba(184,146,42,0.2);
    }
    .ss-hero-visual .face-front,
    .ss-hero-visual .face-back,
    .ss-hero-visual .face-left,
    .ss-hero-visual .face-right {
      width: 120px;
      height: 360px;
      top: 0;
      left: 0;
      background-image: url('https://raw.githubusercontent.com/Auraaz/sticqr-labels-client/refs/heads/main/client/sarvam_sai_box.webp');
      background-size: 400% 100%;
      background-repeat: no-repeat;
    }
    .ss-hero-visual .face-front { transform: translateZ(60px); background-position: 0% 0%; }
    .ss-hero-visual .face-right { transform: rotateY(90deg) translateZ(60px); background-position: 33.333% 0%; }
    .ss-hero-visual .face-back { transform: rotateY(180deg) translateZ(60px); background-position: 66.666% 0%; }
    .ss-hero-visual .face-left { transform: rotateY(-90deg) translateZ(60px); background-position: 100% 0%; }
    .ss-hero-visual .face-top,
    .ss-hero-visual .face-bottom {
      width: 120px;
      height: 120px;
      top: 0;
      left: 0;
      background-image: url('https://raw.githubusercontent.com/Auraaz/sticqr-labels-client/refs/heads/main/client/satyasai_100.webp');
      background-size: 100% 100%;
      background-repeat: no-repeat;
    }
    .ss-hero-visual .face-top { top: 120px; transform: rotateX(90deg) translateZ(180px); }
    .ss-hero-visual .face-bottom { top: 480px; transform: rotateX(-90deg) translateZ(180px); }
    .ss-narrative {
      grid-column: 1 / -1;
    }
    .ss-narrative h3 {
      margin: 0 0 0.8rem;
      font-family: "Cormorant Garamond", Georgia, serif;
      font-size: 1.5rem;
      color: var(--ss-burgundy);
    }
    .ss-narrative p {
      margin: 0.5rem 0 0;
      color: var(--ss-muted);
      font-size: 1.02rem;
    }
    .ss-section-head {
      margin-bottom: 0.8rem;
    }
    .ss-section-head h2 {
      margin: 0;
      font-family: "Cormorant Garamond", Georgia, serif;
      font-size: 2rem;
      color: var(--ss-burgundy);
    }
    .ss-section-head p {
      margin: 0.3rem 0 0;
      color: var(--ss-muted);
    }
    .ss-swaroopa-track {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(180px, 220px);
      gap: 0.75rem;
      overflow-x: auto;
      padding-bottom: 0.4rem;
      scroll-snap-type: x mandatory;
    }
    .ss-swaroopa-card {
      scroll-snap-align: center;
      border: 1px solid rgba(184, 146, 42, 0.28);
      border-radius: 14px;
      background: rgba(250, 246, 239, 0.8);
      padding: 0.55rem;
      text-align: center;
      transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .ss-swaroopa-card img {
      width: 100%;
      border-radius: 10px;
      aspect-ratio: 1 / 1;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .ss-swaroopa-card:hover img {
      transform: scale(1.03);
    }
    .ss-swaroopa-card p {
      margin: 0.35rem 0 0.15rem;
      color: var(--ss-muted);
      font-size: 0.83rem;
    }
    .ss-swaroopa-value {
      font-family: "Cinzel", serif;
      font-size: 0.7rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ss-burgundy);
      margin-top: 0.45rem;
    }
    .ss-swaroopa-robe {
      font-family: "EB Garamond", serif;
      font-size: 0.92rem;
      color: var(--ss-ink);
    }
    .ss-swaroopa-ratio {
      font-family: "Cinzel", serif;
      font-size: 0.58rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--ss-gold);
    }
    .ss-prev-mints-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.7rem;
    }
    .ss-prev-mint-card {
      border: 1px solid rgba(184, 146, 42, 0.2);
      border-radius: 12px;
      background: rgba(250, 246, 239, 0.72);
      padding: 0.8rem;
      opacity: 0.78;
    }
    .ss-prev-mint-card h4 {
      margin: 0;
      font-family: "Cormorant Garamond", Georgia, serif;
      color: var(--ss-text);
      font-size: 1.15rem;
    }
    .ss-status {
      margin: 0.2rem 0;
      color: var(--ss-burgundy);
      font-weight: 600;
      font-size: 0.92rem;
    }
    .ss-sub {
      margin: 0;
      color: var(--ss-muted);
      font-size: 0.8rem;
    }
    .ss-shipping-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.8rem;
      margin: 1rem 0;
    }
    .ss-shipping-grid h3,
    .ss-panels-grid h3 {
      margin: 0 0 0.4rem;
      color: var(--ss-burgundy);
      font-family: "Cormorant Garamond", Georgia, serif;
      font-size: 1.5rem;
    }
    .ss-shipping-grid p,
    .ss-panels-grid p {
      margin: 0;
      color: var(--ss-muted);
    }
    .ss-panels-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.8rem;
    }
    .ss-line-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.55rem;
      margin-bottom: 0.75rem;
      width: 100%;
      min-width: 0;
    }
    .ss-line-row span {
      color: var(--ss-muted);
      min-width: 96px;
      font-size: 0.9rem;
    }
    .ss-line-row code {
      display: inline-block;
      flex: 1 1 220px;
      max-width: 100%;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--ss-burgundy);
      background: rgba(243, 236, 224, 0.85);
      border: 1px solid rgba(184, 146, 42, 0.2);
      border-radius: 8px;
      padding: 0.35rem 0.5rem;
    }
    .ss-orders-panel {
      margin-top: 1rem;
    }
    .ss-orders-list {
      display: grid;
      gap: 0.7rem;
    }
    .ss-order-item {
      border: 1px solid rgba(184, 146, 42, 0.2);
      border-radius: 12px;
      background: rgba(250, 246, 239, 0.72);
      padding: 0.75rem;
      display: grid;
      gap: 0.35rem;
    }
    .ss-order-row {
      display: flex;
      justify-content: space-between;
      gap: 0.7rem;
      align-items: center;
    }
    .ss-order-row span {
      color: var(--ss-muted);
      font-size: 0.86rem;
    }
    .ss-order-row strong {
      color: var(--ss-burgundy);
      font-size: 0.9rem;
      text-align: right;
    }
    .ss-order-row code {
      display: inline-block;
      max-width: 62%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      border: 1px solid rgba(184, 146, 42, 0.2);
      border-radius: 8px;
      padding: 0.2rem 0.4rem;
      background: rgba(243, 236, 224, 0.85);
      color: var(--ss-burgundy);
      font-size: 0.78rem;
    }
    .ss-order-details {
      margin-top: 0.15rem;
      border-top: 1px dashed rgba(184, 146, 42, 0.28);
      padding-top: 0.45rem;
    }
    .ss-order-details summary {
      cursor: pointer;
      color: var(--ss-burgundy);
      font-size: 0.84rem;
      font-weight: 600;
      list-style: none;
    }
    .ss-order-details summary::-webkit-details-marker {
      display: none;
    }
    .ss-order-details summary::before {
      content: "▸ ";
      color: var(--ss-gold);
    }
    .ss-order-details[open] summary::before {
      content: "▾ ";
    }
    .ss-order-details-content {
      margin-top: 0.45rem;
      display: grid;
      gap: 0.4rem;
    }
    .ss-order-detail-line {
      display: grid;
      gap: 0.2rem;
    }
    .ss-order-detail-line span {
      color: var(--ss-muted);
      font-size: 0.8rem;
    }
    .ss-order-address {
      color: var(--ss-burgundy);
      font-size: 0.85rem;
      line-height: 1.45;
    }
    .ss-panels-grid,
    .ss-shipping-grid,
    .ss-prev-mints-grid {
      max-width: 100%;
    }
    .ss-panels-grid .ss-glass-card,
    .ss-shipping-grid .ss-glass-card,
    .ss-prev-mints-grid .ss-prev-mint-card {
      min-width: 0;
      overflow: hidden;
    }
    .ss-store-footer {
      text-align: center;
      margin: 1.4rem 0 0.5rem;
      color: var(--ss-muted);
    }
    .ss-store-footer strong {
      display: block;
      color: var(--ss-burgundy);
      font-family: "Cormorant Garamond", Georgia, serif;
      font-size: 1.7rem;
    }
    .ss-store-footer p {
      margin: 0.2rem 0 0;
    }
    .ss-mobile-cta {
      display: none;
    }
      .ss-mobile-cta-hidden {
        display: none !important;
      }
    .ss-btn[disabled] {
      opacity: 0.6;
      cursor: not-allowed;
    }
    @media (max-width: 980px) {
      .ss-hero-grid {
        grid-template-columns: 1fr;
      }
      .ss-prev-mints-grid,
      .ss-shipping-grid,
      .ss-panels-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 760px) {
      .ss-launch-wrap {
        padding: 1rem 0.8rem 5.2rem;
      }
      .ss-card, .ss-glass-card {
        padding: 1rem;
      }
      .ss-line-row code {
        flex-basis: 100%;
      }
      .ss-line-row .ss-btn {
        width: auto;
      }
      .ss-store-header {
        top: 0.4rem;
      }
      .ss-badge {
        display: none;
      }
      .ss-prev-mints-grid,
      .ss-shipping-grid,
      .ss-panels-grid {
        grid-template-columns: 1fr;
      }
      .ss-mobile-cta {
        display: block;
        position: fixed;
        left: 0.8rem;
        right: 0.8rem;
        bottom: 0.8rem;
        z-index: 35;
      }
      .ss-mobile-cta .ss-btn {
        width: 100%;
      }
      .ss-hero-visual {
        min-height: auto;
      }
      .ss-hero-visual .scene {
        transform: scale(0.85);
        transform-origin: center top;
      }
      .ss-order-total {
        flex-direction: column;
        gap: 0.3rem;
      }
      .ss-gift-grid-2 {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(style);

  if (prefilledEmail) {
    prefillEmail(prefilledEmail);
  }
  if (prefilledEmail && prefilledCode) {
    // Always enforce invite verification + passphrase for link-based entry.
    // Do not allow a previous local session to auto-bypass the Darshan gate.
    localStorage.removeItem("sai_access");
    activeAccessCode = prefilledCode;
    validateAccessCode(String(prefilledEmail).trim().toLowerCase(), prefilledCode);
  }

  const granted = localStorage.getItem("sai_access") === "granted";
  const grantedEmail = String(localStorage.getItem("sai_access_email") || "").trim().toLowerCase();
  if (granted && !(prefilledEmail && prefilledCode)) {
    activeAccessEmail = grantedEmail || activeAccessEmail;
    activePassphrase = String(localStorage.getItem("sai_access_passphrase") || "").trim();
    activeAccessCode = String(localStorage.getItem("sai_access_code") || "").trim() || activeAccessCode;
    setStoreVisibility(true);
    renderStore();
  }

  preloadRazorpayCheckout();
}

window.checkAccess = checkAccess;
window.renderStore = renderStore;
window.buyNow = buyNow;
window.scrollSwaroopaTrack = scrollSwaroopaTrack;
window.copyStoreText = copyStoreText;
window.shareStoreInvite = shareStoreInvite;
window.clearOrderConfirmation = clearStoredOrderConfirmation;
window.addItem = addItem;
window.removeItem = removeItem;
window.updateItemField = updateItemField;
window.sarvamSaiEnterDarshanAccess = sarvamSaiEnterDarshanAccess;
document.addEventListener("click", (e) => {
  if (!e.target || !e.target.classList || !e.target.classList.contains("phrase-option")) return;
  const selected = String(e.target.innerText || "").trim();
  onPhraseOptionSelect(selected);
});

if (window.location.pathname.startsWith("/store")) {
  mountStoreExperience();
} else {
  mountHomeExperience();
}

window.__SARVAMSAI_LAUNCH_BOOTED = true;
