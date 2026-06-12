import "server-only";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, unlink, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

/**
 * Acceso a la base de datos D1 "motros".
 * Vía rápida: API REST de Cloudflare por HTTP usando el token OAuth de la sesión
 * local de Wrangler (~200ms). Respaldo: el CLI de Wrangler (~1.5s) si algo falla.
 */
const exec = promisify(execFile);
const WRANGLER = path.join(process.cwd(), "node_modules", ".bin", "wrangler");
const DB = "motros";
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
const DBID = process.env.CLOUDFLARE_D1_DATABASE_ID ?? "";

export function esc(v: string | null | undefined): string {
  if (v === null || v === undefined) return "NULL";
  return "'" + String(v).replace(/'/g, "''") + "'";
}

async function oauthToken(): Promise<string | null> {
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

// --- Vía rápida: API REST ---
async function rest(sql: string): Promise<Record<string, unknown>[]> {
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
    result?: { results?: Record<string, unknown>[] }[];
    errors?: unknown;
  };
  if (!data.success) throw new Error(JSON.stringify(data.errors));
  return data.result?.[0]?.results ?? [];
}

// --- Respaldo: CLI de Wrangler ---
async function viaCli(extra: string[]): Promise<Record<string, unknown>[]> {
  const { stdout } = await exec(
    WRANGLER,
    ["d1", "execute", DB, "--remote", "--json", ...extra],
    { cwd: process.cwd(), maxBuffer: 64 * 1024 * 1024 },
  );
  const start = stdout.indexOf("[");
  const parsed = JSON.parse(stdout.slice(start));
  const first = Array.isArray(parsed) ? parsed[0] : parsed;
  return ((first as { results?: Record<string, unknown>[] })?.results ??
    []) as Record<string, unknown>[];
}

export async function query<T = Record<string, unknown>>(
  sql: string,
): Promise<T[]> {
  try {
    return (await rest(sql)) as T[];
  } catch {
    return (await viaCli(["--command", sql])) as T[];
  }
}

export async function execSql(sql: string): Promise<void> {
  try {
    await rest(sql);
    return;
  } catch {
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
  }
}
