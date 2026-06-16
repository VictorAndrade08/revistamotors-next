// Regenera, desde los snapshots de public/site-data/pages:
//   - src/site-data/article-shell.ts  (marco del tema para noticias nuevas)
//   - db/paginas.sql                   (las páginas originales para D1, vía sqlite3 local)
//
// Uso:  node scripts/gen-site-db.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const PDIR = path.join(ROOT, "public", "site-data", "pages");
const routes = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src", "site-data", "routes.json"), "utf8"),
);

// --- 1) Marco del tema (de un single-post real) ---
const base = JSON.parse(fs.readFileSync(path.join(PDIR, "1.json"), "utf8"));
const b = base.body;
const artOpen = b.indexOf("<article ");
const artClose = b.indexOf("</article>") + "</article>".length;
const shell = {
  bodyClass: base.bodyClass,
  head: base.head,
  prefix: b.slice(0, artOpen), // header + nav + wrappers
  suffix: b.slice(artClose), // cierre + footer
  scripts: base.scripts,
};
const b64 = Buffer.from(JSON.stringify(shell), "utf8").toString("base64");
fs.writeFileSync(
  path.join(ROOT, "src", "site-data", "article-shell.ts"),
  "// Marco del tema (head/prefix/suffix/scripts) para ensamblar noticias nuevas.\n" +
    "// En base64 porque importar el JSON directo rompe el empaquetado de webpack.\n" +
    "// Generado por scripts/gen-site-db.mjs — no editar a mano.\n" +
    `export const ARTICLE_SHELL_B64 =\n  "${b64}";\n`,
);

// --- 2) db/paginas.sql (para sqlite3 local; en remoto usar seed-paginas.mjs) ---
const esc = (s) => "'" + String(s).replace(/'/g, "''") + "'";
let sql =
  "-- Páginas del sitio original para D1 (JSON exacto de PageData).\n" +
  "-- Generado por scripts/gen-site-db.mjs. Local: sqlite3 <db> < db/paginas.sql\n" +
  "-- Remoto (D1 rechaza sentencias grandes): node scripts/seed-paginas.mjs\n" +
  "DROP TABLE IF EXISTS paginas;\n" +
  "CREATE TABLE paginas (slug TEXT PRIMARY KEY, data TEXT NOT NULL);\n";
// D1 limita el tamaño de cada sentencia SQL. Las filas grandes (p. ej. la home)
// se trocean en INSERT + UPDATE…|| para que `wrangler d1 execute --file` no falle.
const MAX = 40000;
function chunkInsert(slug, data) {
  const s = esc(slug);
  if (data.length <= MAX) {
    return `INSERT INTO paginas (slug,data) VALUES (${s},${esc(data)});\n`;
  }
  const parts = [];
  let i = 0;
  while (i < data.length) {
    let end = Math.min(i + MAX, data.length);
    // No partir un par suplente (surrogate) UTF-16.
    if (end < data.length) {
      const c = data.charCodeAt(end - 1);
      if (c >= 0xd800 && c <= 0xdbff) end--;
    }
    parts.push(data.slice(i, end));
    i = end;
  }
  let out = `INSERT INTO paginas (slug,data) VALUES (${s},${esc(parts[0])});\n`;
  for (let k = 1; k < parts.length; k++) {
    out += `UPDATE paginas SET data = data || ${esc(parts[k])} WHERE slug = ${s};\n`;
  }
  return out;
}
for (const r of routes) {
  const slug = r.route.replace(/^\/+|\/+$/g, "");
  const data = fs.readFileSync(path.join(PDIR, r.file), "utf8");
  sql += chunkInsert(slug, data);
}
fs.writeFileSync(path.join(ROOT, "db", "paginas.sql"), sql);

// --- 3) Buscador: marco (base64) + tabla busqueda con los originales ---
const sShell = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src", "site-data", "search-shell.json"), "utf8"),
);
const sb64 = Buffer.from(JSON.stringify(sShell), "utf8").toString("base64");
fs.writeFileSync(
  path.join(ROOT, "src", "site-data", "search-shell.ts"),
  "// Marco del buscador (head/prefix/suffix/cardTemplate/scripts) en base64.\n" +
    "// Generado por scripts/gen-site-db.mjs — no editar a mano.\n" +
    `export const SEARCH_SHELL_B64 =\n  "${sb64}";\n`,
);

const sIndex = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src", "site-data", "search-index.json"), "utf8"),
);
let bsql =
  "-- Índice de búsqueda de las noticias originales (las nuevas vienen de\n" +
  "-- `articulos`). Generado por scripts/gen-site-db.mjs.\n" +
  "DROP TABLE IF EXISTS busqueda;\n" +
  "CREATE TABLE busqueda (slug TEXT PRIMARY KEY, titulo TEXT, thumb TEXT, excerpt TEXT, texto TEXT);\n";
for (const it of sIndex) {
  const slug = String(it.url || "").replace(/^\/+|\/+$/g, "");
  bsql += `INSERT OR REPLACE INTO busqueda (slug,titulo,thumb,excerpt,texto) VALUES (${esc(slug)},${esc(it.title || "")},${esc(it.thumb || "")},${esc(it.excerpt || "")},${esc(it.text || "")});\n`;
}
fs.writeFileSync(path.join(ROOT, "db", "busqueda.sql"), bsql);

console.log(
  `OK: article-shell.ts, search-shell.ts, db/paginas.sql (${routes.length}), db/busqueda.sql (${sIndex.length})`,
);
