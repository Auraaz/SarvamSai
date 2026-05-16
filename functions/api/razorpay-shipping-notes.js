const NOTE_VALUE_MAX = 256;
const NOTE_KEY_MAX = 15;

export function normalizeCheckoutItems(itemsRaw) {
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
      country: String(item?.country || "India").trim() || "India"
    }))
    .filter((item) => item.name || item.addressLine1 || item.phone);
}

function noteValue(value) {
  return String(value ?? "").trim().slice(0, NOTE_VALUE_MAX);
}

function compactItemForNotes(item) {
  return {
    t: item.type === "self" ? "s" : "g",
    n: item.name,
    p: item.phone,
    a1: item.addressLine1,
    a2: item.addressLine2,
    c: item.city,
    s: item.state,
    pin: item.pincode,
    co: item.country || "India"
  };
}

function expandCompactItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = String(raw.n || raw.name || "").trim();
  const addressLine1 = String(raw.a1 || raw.addressLine1 || "").trim();
  const phone = String(raw.p || raw.phone || "").trim();
  if (!name && !addressLine1 && !phone) return null;
  const typeToken = String(raw.t || raw.type || "g").trim().toLowerCase();
  return {
    type: typeToken === "s" || typeToken === "self" ? "self" : "gift",
    name,
    phone,
    addressLine1,
    addressLine2: String(raw.a2 || raw.addressLine2 || "").trim(),
    city: String(raw.c || raw.city || "").trim(),
    state: String(raw.s || raw.state || "").trim(),
    pincode: String(raw.pin || raw.pincode || "").trim(),
    country: String(raw.co || raw.country || "India").trim() || "India"
  };
}

function itemFromPrefixedNotes(notes, index) {
  const prefix = `item_${index}_`;
  const name = String(notes[`${prefix}name`] || "").trim();
  const addressLine1 = String(notes[`${prefix}addr1`] || notes[`${prefix}addressLine1`] || "").trim();
  const phone = String(notes[`${prefix}phone`] || "").trim();
  if (!name && !addressLine1 && !phone) return null;
  return {
    type: String(notes[`${prefix}type`] || "gift").trim() === "self" ? "self" : "gift",
    name,
    phone,
    addressLine1,
    addressLine2: String(notes[`${prefix}addr2`] || notes[`${prefix}addressLine2`] || "").trim(),
    city: String(notes[`${prefix}city`] || "").trim(),
    state: String(notes[`${prefix}state`] || "").trim(),
    pincode: String(notes[`${prefix}pin`] || notes[`${prefix}pincode`] || "").trim(),
    country: String(notes[`${prefix}country`] || "India").trim() || "India"
  };
}

/** Build Razorpay order notes (max 15 keys, 256 chars per value). */
export function buildRazorpayOrderNotes(email, itemsRaw) {
  const items = normalizeCheckoutItems(itemsRaw);
  const notes = {
    checkout_email: noteValue(String(email || "").trim().toLowerCase()),
    total_items: noteValue(items.length)
  };

  if (items.length === 1) {
    const item = items[0];
    Object.assign(notes, {
      item_0_type: noteValue(item.type),
      item_0_name: noteValue(item.name),
      item_0_phone: noteValue(item.phone),
      item_0_addr1: noteValue(item.addressLine1),
      item_0_addr2: noteValue(item.addressLine2),
      item_0_city: noteValue(item.city),
      item_0_state: noteValue(item.state),
      item_0_pin: noteValue(item.pincode),
      item_0_country: noteValue(item.country)
    });
  } else if (items.length > 1) {
    let payload = JSON.stringify(items.map(compactItemForNotes));
    if (payload.length > NOTE_VALUE_MAX) {
      payload = JSON.stringify(
        items.map((item) => {
          const compact = compactItemForNotes(item);
          return {
            ...compact,
            a1: compact.a1.slice(0, 48),
            a2: compact.a2.slice(0, 32)
          };
        })
      );
    }
    notes.items_json = noteValue(payload);
  }

  const entries = Object.entries(notes).slice(0, NOTE_KEY_MAX);
  return Object.fromEntries(entries);
}

/** Parse checkout items saved on the Razorpay order. */
export function parseCheckoutItemsFromNotes(notesRaw) {
  const notes =
    notesRaw && typeof notesRaw === "object" && !Array.isArray(notesRaw) ? notesRaw : {};
  const items = [];

  const jsonRaw = String(notes.items_json || "").trim();
  if (jsonRaw) {
    try {
      const parsed = JSON.parse(jsonRaw);
      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          const item = expandCompactItem(entry);
          if (item) items.push(item);
        }
      }
    } catch (_error) {
      // fall through to prefixed keys
    }
  }

  if (!items.length) {
    for (let index = 0; index < 4; index += 1) {
      const item = itemFromPrefixedNotes(notes, index);
      if (item) items.push(item);
    }
  }

  return items;
}

export function checkoutEmailFromNotes(notesRaw, fallbackEmail = "") {
  const notes =
    notesRaw && typeof notesRaw === "object" && !Array.isArray(notesRaw) ? notesRaw : {};
  const fromNotes = String(notes.checkout_email || notes.email || "")
    .trim()
    .toLowerCase();
  if (fromNotes.includes("@")) return fromNotes;
  return String(fallbackEmail || "")
    .trim()
    .toLowerCase();
}
