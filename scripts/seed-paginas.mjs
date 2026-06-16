// Sube las páginas originales a la D1 REMOTA usando bind params (la API de D1
// rechaza sentencias SQL grandes, así que no sirve `wrangler d1 execute --file`).
//
// Requiere en .env.local: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID,
// CLOUDFLARE_API_TOKEN (con permiso D1 Edit).
//
// Uso:  node scripts/seed-paginas.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");

// Carga simple de .env.local (sin dependencias).
for (const line of fs
  .readFileSync(path.join(ROOT, ".env.local"), "utf8")
  .split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}

const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const DBID = process.env.CLOUDFLARE_D1_DATABASE_ID;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
if (!ACCOUNT || !DBID || !TOKEN) {
  console.error(
    "Faltan CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_D1_DATABASE_ID / CLOUDFLARE_API_TOKEN en .env.local",
  );
  process.exit(1);
}

const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database/${DBID}/query`;
async function d1(sql, params = []) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(JSON.stringify(data.errors));
  return data;
}

const PDIR = path.join(ROOT, "public", "site-data", "pages");
const routes = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src", "site-data", "routes.json"), "utf8"),
);

console.log("Creando tabla paginas…");
await d1("DROP TABLE IF EXISTS paginas;");
await d1("CREATE TABLE paginas (slug TEXT PRIMARY KEY, data TEXT NOT NULL);");

let i = 0;
for (const r of routes) {
  const slug = r.route.replace(/^\/+|\/+$/g, "");
  const data = fs.readFileSync(path.join(PDIR, r.file), "utf8");
  await d1("INSERT INTO paginas (slug, data) VALUES (?1, ?2);", [slug, data]);
  i++;
  if (i % 10 === 0 || i === routes.length) console.log(`  ${i}/${routes.length}`);
}
console.log("Listo: páginas subidas a D1 remoto.");
