import "server-only";

/**
 * Acceso a la base de datos D1 "motros".
 *
 * - En producción (Cloudflare Workers): se usa el binding `DB` directamente
 *   a través de `getCloudflareContext()` (OpenNext).
 * - En desarrollo local (`next dev`): no hay binding, así que se cae al camino
 *   local — API REST de Cloudflare con el token OAuth de la sesión de Wrangler
 *   (~200ms) y, como último respaldo, el CLI de Wrangler (~1.5s).
 *
 * Los módulos de Node (child_process, fs, os) se importan de forma dinámica para
 * que NO entren en el bundle de Workers (donde child_process no existe).
 */

const DB_NAME = "motros";
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
const DBID = process.env.CLOUDFLARE_D1_DATABASE_ID ?? "";

type Row = Record<string, unknown>;
type Mode = "query" | "exec";

// Tipo mínimo del binding D1 (evita depender de @cloudflare/workers-types).
interface D1Prepared {
  all(): Promise<{ results?: Row[] }>;
  run(): Promise<unknown>;
}
interface D1Database {
  prepare(sql: string): D1Prepared;
}

export function esc(v: string | null | undefined): string {
  if (v === null || v === undefined) return "NULL";
  return "'" + String(v).replace(/'/g, "''") + "'";
}

// --- Producción: binding D1 vía OpenNext ---
// Devuelve el binding si estamos dentro del Worker; null en `next dev` (sin
// contexto de Cloudflare), para que se use el camino local.
async function getBinding(): Promise<D1Database | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const env = getCloudflareContext().env as unknown as { DB?: D1Database };
    return env.DB ?? null;
  } catch {
    return null;
  }
}

// --- Local: API REST de Cloudflare con el token OAuth de Wrangler ---
async function oauthToken(): Promise<string | null> {
  const { readFile } = await import("node:fs/promises");
  const os = await import("node:os");
  const path = await import("node:path");
  const candidates = [
    path.join(os.homedir(), "Library/Preferences/.wrangler/config/default.toml"),
    path.join(os.homedir(), ".config/.wrangler/config/default.toml"),
    path.join(os.homedir(), ".wrangler/config/default.toml"),
  ];
  for (const p of candidates) {
    try {
      const txt = await readFile(p, "utf8");
      const m = txt.match(/oauth_token\s*=\s*"([^"]+)"/);
      if (m) return m[1];
    } catch {}
  }
  return null;
}

async function rest(sql: string): Promise<Row[]> {
  const token = await oauthToken();
  if (!token || !ACCOUNT || !DBID) throw new Error("rest-unavailable");
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database/${DBID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql }),
    },
  );
  const data = (await res.json()) as {
    success: boolean;
    result?: { results?: Row[] }[];
    errors?: unknown;
  };
  if (!data.success) throw new Error(JSON.stringify(data.errors));
  return data.result?.[0]?.results ?? [];
}

// --- Local: respaldo con el CLI de Wrangler ---
async function viaCli(extra: string[]): Promise<Row[]> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const path = await import("node:path");
  const exec = promisify(execFile);
  const WRANGLER = path.join(process.cwd(), "node_modules", ".bin", "wrangler");
  const { stdout } = await exec(
    WRANGLER,
    ["d1", "execute", DB_NAME, "--remote", "--json", ...extra],
    { cwd: process.cwd(), maxBuffer: 64 * 1024 * 1024 },
  );
  const start = stdout.indexOf("[");
  const parsed = JSON.parse(stdout.slice(start));
  const first = Array.isArray(parsed) ? parsed[0] : parsed;
  return ((first as { results?: Row[] })?.results ?? []) as Row[];
}

async function viaLocal(sql: string, mode: Mode): Promise<Row[]> {
  if (mode === "query") {
    try {
      return await rest(sql);
    } catch {
      return await viaCli(["--command", sql]);
    }
  }
  // exec
  try {
    await rest(sql);
    return [];
  } catch {
    const { writeFile, unlink } = await import("node:fs/promises");
    const os = await import("node:os");
    const path = await import("node:path");
    const tmp = path.join(
      os.tmpdir(),
      `d1-${process.hrtime.bigint().toString(36)}.sql`,
    );
    await writeFile(tmp, sql, "utf8");
    try {
      await viaCli(["--file", tmp]);
    } finally {
      await unlink(tmp).catch(() => {});
    }
    return [];
  }
}

export async function query<T = Row>(sql: string): Promise<T[]> {
  const db = await getBinding();
  if (db) {
    const res = await db.prepare(sql).all();
    return (res.results ?? []) as T[];
  }
  return (await viaLocal(sql, "query")) as T[];
}

export async function execSql(sql: string): Promise<void> {
  const db = await getBinding();
  if (db) {
    // Una sola sentencia: usamos prepare().run() (no .exec(), que parte por \n y
    // rompería el HTML multilínea de los artículos).
    await db.prepare(sql).run();
    return;
  }
  await viaLocal(sql, "exec");
}
