#!/usr/bin/env node

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");

function getEnv(name, fallback = "") {
  return String(process.env[name] || fallback).trim();
}

function parseCsvLine(line) {
  const out = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current.trim());
  return out;
}

function parseCsv(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const row = {};
    headers.forEach((key, idx) => {
      row[key] = String(values[idx] || "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function normalizeRow(input) {
  const row = input || {};
  const email = String(row.email || row["e-mail"] || row.mail || "")
    .trim()
    .toLowerCase();
  const accessCode = String(row.access_code || row.accesscode || row.code || row.access || "").trim();
  const passphrase = String(row.passphrase || row.personal_message || row.message || "").trim();
  const status = String(row.status || "active").trim().toLowerCase() || "active";
  if (!email || !accessCode) return null;
  return { email, accessCode, passphrase, status };
}

async function fetchRowsFromAppScript() {
  const appsScriptUrl = getEnv("APPS_SCRIPT_URL");
  if (!appsScriptUrl) {
    throw new Error("APPS_SCRIPT_URL is required for Apps Script sync.");
  }
  const internalToken = getEnv("INTERNAL_API_TOKEN");
  const url = new URL(appsScriptUrl);
  url.searchParams.set("action", "exportDarshanAccess");
  if (internalToken) url.searchParams.set("token", internalToken);

  const response = await fetch(url.toString(), { method: "GET" });
  if (!response.ok) {
    throw new Error(`Apps Script export failed with ${response.status}.`);
  }
  const payload = await response.json().catch(() => null);
  if (!payload) throw new Error("Apps Script response is not valid JSON.");

  const rows = Array.isArray(payload) ? payload : Array.isArray(payload.rows) ? payload.rows : [];
  if (!rows.length) {
    throw new Error("No rows returned. Ensure Apps Script supports action=exportDarshanAccess and returns rows[].");
  }
  return rows;
}

async function fetchRowsFromCsv() {
  const csvUrl = getEnv("GOOGLE_SHEET_CSV_URL");
  if (!csvUrl) {
    throw new Error("GOOGLE_SHEET_CSV_URL is required for CSV sync.");
  }
  const response = await fetch(csvUrl, { method: "GET" });
  if (!response.ok) {
    throw new Error(`CSV fetch failed with ${response.status}.`);
  }
  const csv = await response.text();
  const rows = parseCsv(csv);
  if (!rows.length) throw new Error("CSV source returned no rows.");
  return rows;
}

async function d1Query(sql, params) {
  const accountId = getEnv("CLOUDFLARE_ACCOUNT_ID");
  const databaseId = getEnv("CLOUDFLARE_D1_DATABASE_ID");
  const apiToken = getEnv("CLOUDFLARE_API_TOKEN");
  if (!accountId || !databaseId || !apiToken) {
    throw new Error("Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_API_TOKEN.");
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`
    },
    body: JSON.stringify({ sql, params })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(`D1 query failed: ${JSON.stringify(payload.errors || payload)}`);
  }
  return payload;
}

async function main() {
  const source = getEnv("SYNC_SOURCE", "apps-script");
  const rawRows = source === "csv" ? await fetchRowsFromCsv() : await fetchRowsFromAppScript();
  const normalized = rawRows.map(normalizeRow).filter(Boolean);

  if (!normalized.length) {
    throw new Error("No valid rows found with email + access code.");
  }

  console.log(`Fetched ${rawRows.length} rows, valid rows: ${normalized.length}`);
  if (dryRun) {
    console.log("Dry run enabled. No database writes performed.");
    return;
  }

  const batchSize = 100;
  for (let i = 0; i < normalized.length; i += batchSize) {
    const batch = normalized.slice(i, i + batchSize);
    const valuesSql = batch
      .map(
        () =>
          "(lower(hex(randomblob(16))), ?, ?, ?, ?, datetime('now'), datetime('now'))"
      )
      .join(", ");

    const sql = `
      INSERT INTO darshan_access (id, email, access_code, passphrase, status, created_at, last_accessed_at)
      VALUES ${valuesSql}
      ON CONFLICT(email)
      DO UPDATE SET
        access_code = excluded.access_code,
        passphrase = excluded.passphrase,
        status = excluded.status,
        last_accessed_at = datetime('now')
    `;

    const params = [];
    batch.forEach((row) => {
      params.push(row.email, row.accessCode, row.passphrase, row.status);
    });
    await d1Query(sql, params);
    console.log(`Upserted ${Math.min(i + batchSize, normalized.length)} / ${normalized.length}`);
  }
  console.log("Darshan cache sync complete.");
}

main().catch((error) => {
  console.error("Sync failed:", error.message || error);
  process.exit(1);
});
