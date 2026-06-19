import { escapeHtml } from "@/lib/text";

/**
 * Manipulación del HTML del tema (snapshot de WordPress).
 *
 * Esta es la parte más delicada del proyecto: localiza las "tarjetas" del tema
 * y sustituye su contenido por noticias de la BD, conservando el maquetado. Se
 * extrajo aquí —fuera de db-loader— para poder cubrirla con tests unitarios y
 * para endurecerla con guardas (bloques mal balanceados se ignoran en vez de
 * corromper la página).
 */

export type Card = {
  titulo: string;
  slug: string;
  fecha: string | null;
  portada: string | null;
};

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "2026-06-19T14:00:00Z" -> "19 de junio de 2026". Cadena vacía si no parsea. */
export function formatFecha(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export type CardSpan = { start: number; end: number; cls: string };

/**
 * Localiza los bloques `<div class="p-wrap …">…</div>` equilibrando `<div>` /
 * `</div>`. Solo devuelve los bloques BIEN balanceados: si el markup del tema
 * cambia y un bloque queda abierto, se omite en lugar de devolver un rango
 * inválido que rompería la página.
 */
export function findCards(html: string): CardSpan[] {
  const out: CardSpan[] = [];
  let idx = 0;
  for (;;) {
    const start = html.indexOf('<div class="p-wrap', idx);
    if (start < 0) break;
    const cls = (html.slice(start, start + 200).match(/class="(p-wrap[^"]*)"/) || [])[1] ?? "";
    let depth = 0;
    let i = start;
    let balanced = false;
    while (i < html.length) {
      const open = html.indexOf("<div", i);
      const close = html.indexOf("</div>", i);
      if (close < 0) break; // markup truncado: bloque sin cierre
      if (open >= 0 && open < close) {
        depth++;
        i = open + 4;
      } else {
        depth--;
        i = close + 6;
        if (depth === 0) {
          balanced = true;
          break;
        }
      }
    }
    // Guarda anti-bucle: si no avanzamos, abortamos para no colgar el render.
    if (i <= start) break;
    if (balanced) out.push({ start, end: i, cls });
    idx = i;
  }
  return out;
}

/**
 * Sustituye los datos del post (enlace, título, imagen, fecha) dentro de una
 * tarjeta del tema por los de una noticia. Cada reemplazo es defensivo: si el
 * patrón no aparece, deja esa parte intacta.
 */
export function fillCard(seg: string, art: Card): string {
  const href = `/${art.slug}/`;
  const titulo = escapeHtml(art.titulo);
  // El enlace puede estar en .p-flink (con imagen) o solo en .p-url (lista simple).
  const oldHref = (seg.match(/class="p-flink"[^>]*href="([^"]+)"/) ||
    seg.match(/class="p-url"[^>]*href="([^"]+)"/) || [])[1];
  if (oldHref) seg = seg.split(`"${oldHref}"`).join(`"${href}"`);
  seg = seg.replace(/(class="p-flink"[^>]*title=")[^"]*(")/, `$1${titulo}$2`);
  seg = seg.replace(/(class="p-url"[^>]*>)[^<]*(<)/, `$1${titulo}$2`);
  if (art.portada) {
    seg = seg.replace(
      /(class="[^"]*featured-img[^"]*"[^>]*\ssrc=")[^"]*(")/,
      `$1${escapeHtml(art.portada)}$2`,
    );
  }
  seg = seg.replace(/\s(?:srcset|data-srcset)="[^"]*"/g, ""); // evita imágenes responsive viejas
  seg = seg.replace(/(<time[^>]*>)[^<]*(<\/time>)/, `$1${formatFecha(art.fecha)}$2`);
  return seg;
}

/**
 * Reemplaza las tarjetas de una clase dada (en orden de aparición) por una lista
 * de noticias, conservando el maquetado. De atrás hacia delante para no
 * invalidar los índices.
 */
export function replaceCards(body: string, clsMatch: string, arts: Card[]): string {
  const jobs = findCards(body)
    .filter((c) => c.cls.includes(clsMatch))
    .map((c, i) => ({ ...c, art: arts[i] }))
    .filter((j) => j.art);
  jobs.sort((a, b) => b.start - a.start);
  for (const j of jobs) {
    body = body.slice(0, j.start) + fillCard(body.slice(j.start, j.end), j.art) + body.slice(j.end);
  }
  return body;
}
