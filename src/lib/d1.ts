import "server-only";
import { getRequestContext } from "@cloudflare/next-on-pages";

/**
 * Acceso a la base de datos D1 "motros" (compatible con el runtime edge de Pages).
 *
 * - En producción (Cloudflare Pages): binding `DB` vía getRequestContext().
 * - En desarrollo (`next dev` con setupDevPlatform): mismo binding, servido por
 *   una copia local de D1 (semilla en db/seed.sql).
 * - Respaldo opcional: API REST de Cloudflare con CLOUDFLARE_API_TOKEN en .env.local
 *   (solo fetch, sin módulos de Node — apto para edge).
 */

const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
const DBID = process.env.CLOUDFLARE_D1_DATABASE_ID ?? "";
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN ?? "";

type Row = Record<string, unknown>;

// Tipo mínimo del binding D1 (evita depender de @cloudflare/workers-types).
interface D1Prepared {
  bind(...params: unknown[]): D1Prepared;
  all(): Promise<{ results?: Row[] }>;
  run(): Promise<unknown>;
}
interface D1Database {
  prepare(sql: string): D1Prepared;
}

function getDb(): D1Database | null {
  try {
    const env = getRequestContext().env as unknown as { DB?: D1Database };
    return env.DB ?? null;
  } catch {
    return null;
  }
}

// Respaldo: API REST de Cloudflare (requiere CLOUDFLARE_API_TOKEN).
async function rest(sql: string, params: unknown[] = []): Promise<Row[]> {
  if (!API_TOKEN || !ACCOUNT || !DBID) {
    throw new Error(
      "Base de datos no disponible: falta el binding DB o CLOUDFLARE_API_TOKEN",
    );
  }
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database/${DBID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
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

export async function query<T = Row>(sql: string): Promise<T[]> {
  const db = getDb();
  if (db) {
    const res = await db.prepare(sql).all();
    return (res.results ?? []) as T[];
  }
  return (await rest(sql)) as T[];
}

// Todas las escrituras usan parámetros (?1, ?2…): el valor viaja como dato,
// no concatenado al SQL. Evita inyección y el límite de tamaño de sentencia
// de D1 (importante para HTML de artículos e imágenes en base64).
export async function queryParams<T = Row>(
  sql: string,
  params: unknown[],
): Promise<T[]> {
  const db = getDb();
  if (db) {
    const res = await db.prepare(sql).bind(...params).all();
    return (res.results ?? []) as T[];
  }
  return (await rest(sql, params)) as T[];
}

export async function runParams(
  sql: string,
  params: unknown[],
): Promise<void> {
  const db = getDb();
  if (db) {
    await db.prepare(sql).bind(...params).run();
    return;
  }
  await rest(sql, params);
}
