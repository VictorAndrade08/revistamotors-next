import "server-only";
import routesData from "./routes.json";

export type ScriptEntry = { src?: string; code?: string };

export type PageData = {
  route: string;
  title: string;
  bodyClass: string;
  head: string;
  body: string;
  scripts: ScriptEntry[];
};

type RouteEntry = { route: string; file: string; title: string };

const routes = routesData as RouteEntry[];

/** "/category/motores/" -> ["category","motores"] ; "/" -> [] */
export function routeToSlug(route: string): string[] {
  return route.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
}

function key(slug: string[] | undefined): string {
  return (slug ?? []).join("/");
}

const fileByKey = new Map(
  routes.map((r) => [routeToSlug(r.route).join("/"), r.file] as const),
);

export function allRoutes(): RouteEntry[] {
  return routes;
}

// Los JSON de las páginas viven en public/site-data/pages y se sirven como
// assets estáticos. Así NO inflan el bundle del Worker (límite de 3 MiB) y se
// pueden leer en runtime: vía el binding ASSETS en producción, vía fs en local.
type AssetsEnv = { ASSETS?: { fetch(req: Request | URL): Promise<Response> } };

async function fromAssets(file: string): Promise<PageData | null> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const env = getCloudflareContext().env as unknown as AssetsEnv;
  if (!env.ASSETS) throw new Error("assets-unavailable");
  const res = await env.ASSETS.fetch(
    new URL(`https://assets.local/site-data/pages/${file}`),
  );
  if (!res.ok) return null;
  return (await res.json()) as PageData;
}

async function fromFs(file: string): Promise<PageData | null> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const p = path.join(process.cwd(), "public", "site-data", "pages", file);
  try {
    const raw = await fs.readFile(p, "utf-8");
    return JSON.parse(raw) as PageData;
  } catch {
    return null;
  }
}

export async function getPage(
  slug: string[] | undefined,
): Promise<PageData | null> {
  const file = fileByKey.get(key(slug));
  if (!file) return null;
  try {
    return await fromAssets(file);
  } catch {
    // En `next dev` / build no hay contexto de Cloudflare: leer del disco.
    return await fromFs(file);
  }
}
