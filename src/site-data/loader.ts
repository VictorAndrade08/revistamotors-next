import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
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
// Las instantáneas viven en public/ y solo se leen durante `next build`
// (las páginas del catch-all son SSG puras: dynamicParams = false).
const DIR = path.join(process.cwd(), "public", "site-data", "pages");

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

export async function getPage(
  slug: string[] | undefined,
): Promise<PageData | null> {
  const file = fileByKey.get(key(slug));
  if (!file) return null;
  const raw = await fs.readFile(path.join(DIR, file), "utf-8");
  return JSON.parse(raw) as PageData;
}
