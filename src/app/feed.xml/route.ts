import { queryParams } from "@/lib/d1";
import { escapeHtml } from "@/lib/text";

// Feed RSS con las últimas noticias publicadas (para agregadores y lectores).
export const runtime = "edge";
export const dynamic = "force-dynamic";

const BASE = "https://revistamotors.com.ec";

export async function GET() {
  const arts = await queryParams<{
    slug: string;
    titulo: string;
    fecha: string | null;
    portada: string | null;
    extracto: string | null;
  }>(
    `SELECT slug, titulo, fecha, portada, extracto FROM articulos
     WHERE (fecha IS NULL OR datetime(fecha) <= datetime('now'))
     ORDER BY datetime(fecha) DESC LIMIT ?1;`,
    [30],
  );

  const items = arts
    .map((a) => {
      const link = `${BASE}/${a.slug}/`;
      const pubDate = a.fecha ? new Date(a.fecha).toUTCString() : "";
      return (
        "<item>" +
        `<title>${escapeHtml(a.titulo)}</title>` +
        `<link>${escapeHtml(link)}</link>` +
        `<guid>${escapeHtml(link)}</guid>` +
        (pubDate ? `<pubDate>${pubDate}</pubDate>` : "") +
        `<description>${escapeHtml(a.extracto ?? "")}</description>` +
        (a.portada
          ? `<enclosure url="${escapeHtml(a.portada)}" type="image/webp" length="0"/>`
          : "") +
        "</item>"
      );
    })
    .join("\n");

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0"><channel>' +
    "<title>Revista Motors Ecuador</title>" +
    `<link>${BASE}/</link>` +
    "<description>Noticias, reseñas y tecnología del mundo automotriz en Ecuador y Latinoamérica.</description>" +
    "<language>es</language>\n" +
    items +
    "\n</channel></rss>\n";

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=1800",
    },
  });
}
