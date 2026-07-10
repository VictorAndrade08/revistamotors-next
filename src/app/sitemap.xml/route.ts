import { query } from "@/lib/d1";
import { escapeHtml } from "@/lib/text";

// Sitemap dinámico desde D1: páginas originales + noticias publicadas.
// Se regenera en cada petición (el CDN lo cachea 1 hora), así que una noticia
// nueva entra al sitemap sin rebuild, igual que en el resto del sitio.
export const runtime = "edge";
export const dynamic = "force-dynamic";

const BASE = "https://revistamotors.com.ec";

export async function GET() {
  const arts = await query<{ slug: string; fecha: string | null }>(
    "SELECT slug, fecha FROM articulos WHERE (fecha IS NULL OR datetime(fecha) <= datetime('now')) ORDER BY datetime(fecha) DESC;",
  );
  const pages = await query<{ slug: string }>("SELECT slug FROM paginas;");

  const urls: string[] = [];
  const add = (path: string, lastmod?: string | null) => {
    urls.push(
      `<url><loc>${BASE}${escapeHtml(path)}</loc>` +
        (lastmod ? `<lastmod>${escapeHtml(lastmod)}</lastmod>` : "") +
        "</url>",
    );
  };

  add("/");
  add("/todas-las-noticias/");
  for (const a of arts) add(`/${a.slug}/`, a.fecha);
  for (const p of pages) {
    if (p.slug) add(`/${p.slug}/`);
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join("\n") +
    "\n</urlset>\n";

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
