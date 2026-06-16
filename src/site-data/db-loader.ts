import "server-only";
import { queryParams } from "@/lib/d1";
import { escapeHtml, normalizeKey } from "@/lib/text";
import { ARTICLE_SHELL_B64 } from "./article-shell";
import { SEARCH_SHELL_B64 } from "./search-shell";
import type { PageData, ScriptEntry } from "./loader";

function decodeB64<T>(b64: string): T {
  return JSON.parse(
    new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))),
  ) as T;
}

type Shell = {
  bodyClass: string;
  head: string;
  prefix: string;
  suffix: string;
  scripts: PageData["scripts"];
};

// Decodifica el marco del tema (base64 UTF-8) una sola vez.
const shell: Shell = decodeB64<Shell>(ARTICLE_SHELL_B64);

/**
 * Carga de páginas desde D1 (runtime edge, sin disco).
 *
 * - Páginas del sitio original: fila exacta en `paginas` (JSON de PageData) →
 *   se renderiza con el mismo componente, por lo que el HTML es IDÉNTICO.
 * - Noticias creadas en el panel: fila en `articulos` → se ensamblan con el
 *   marco del tema (`article-shell.json`) para que se vean como un post normal.
 *
 * Resultado: publicar una noticia = solo escribir en la BD; aparece al instante
 * en su URL, sin rebuild ni archivos.
 */

type Articulo = {
  slug: string;
  titulo: string;
  fecha: string | null;
  portada: string | null;
  extracto: string | null;
  html: string | null;
};

function formatFecha(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

/** Ensambla una noticia de `articulos` dentro del marco del tema. */
function assembleArticulo(a: Articulo): PageData {
  const titulo = escapeHtml(a.titulo);
  const featured = a.portada
    ? `<figure class="single-featured-image first-img-wrap"><img class="attachment-large size-large wp-post-image" src="${escapeHtml(
        a.portada,
      )}" alt="${titulo}" decoding="async" fetchpriority="high"/></figure>`
    : "";
  const inner = `<article class="post type-post status-publish format-standard has-post-thumbnail" itemscope="" itemtype="https://schema.org/Article">
  <header class="single-header">
    <h1 class="entry-title" itemprop="headline">${titulo}</h1>
    <div class="entry-meta is-meta"><span class="meta-date"><time class="entry-date published" datetime="${escapeHtml(
      a.fecha ?? "",
    )}">${formatFecha(a.fecha)}</time></span></div>
  </header>
  ${featured}
  <div class="e-ct-outer"><div class="entry-content rbct clearfix" itemprop="articleBody">${
    a.html ?? ""
  }</div></div>
</article>`;
  return {
    route: `/${a.slug}/`,
    title: a.titulo,
    bodyClass: shell.bodyClass,
    head: shell.head,
    body: shell.prefix + inner + shell.suffix,
    scripts: shell.scripts,
  };
}

type Card = { titulo: string; slug: string; fecha: string | null; portada: string | null };

/** Últimas noticias publicadas (para alimentar portada/listados). */
export async function getLatestArticulos(limit: number): Promise<Card[]> {
  return queryParams<Card>(
    "SELECT titulo, slug, fecha, portada FROM articulos ORDER BY fecha DESC LIMIT ?1;",
    [limit],
  );
}

// Localiza los bloques de tarjeta del tema (<div class="p-wrap …">…</div>)
// equilibrando <div>/</div>, para reemplazar su contenido sin romper el HTML.
function findCards(html: string): { start: number; end: number; cls: string }[] {
  const out: { start: number; end: number; cls: string }[] = [];
  let idx = 0;
  for (;;) {
    const start = html.indexOf('<div class="p-wrap', idx);
    if (start < 0) break;
    const cls = (html.slice(start, start + 200).match(/class="(p-wrap[^"]*)"/) || [])[1] ?? "";
    let depth = 0;
    let i = start;
    while (i < html.length) {
      const open = html.indexOf("<div", i);
      const close = html.indexOf("</div>", i);
      if (close < 0) break;
      if (open >= 0 && open < close) {
        depth++;
        i = open + 4;
      } else {
        depth--;
        i = close + 6;
        if (depth === 0) break;
      }
    }
    out.push({ start, end: i, cls });
    idx = i;
  }
  return out;
}

// Sustituye los datos del post (enlace, título, imagen, fecha) dentro de una
// tarjeta del tema por los de una noticia de la BD, conservando el maquetado.
function fillCard(seg: string, art: Card): string {
  const href = `/${art.slug}/`;
  const titulo = escapeHtml(art.titulo);
  const oldHref = (seg.match(/class="p-flink"[^>]*href="([^"]+)"/) || [])[1];
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

// Inyecta las últimas noticias en el hero (3 slides) y las 2 tarjetas
// destacadas de la portada. El resto del maquetado se conserva intacto.
function templatizeHome(body: string, latest: Card[]): string {
  if (!latest.length) return body;
  const cards = findCards(body);
  const hero = cards.filter((c) => c.cls.includes("p-overlay-1")).slice(0, 3);
  const feat = cards.filter((c) => c.cls.includes("p-overlay-2")).slice(0, 2);
  const jobs: { start: number; end: number; art: Card }[] = [];
  hero.forEach((c, i) => latest[i] && jobs.push({ ...c, art: latest[i] }));
  feat.forEach((c, i) => latest[3 + i] && jobs.push({ ...c, art: latest[3 + i] }));
  // De atrás hacia delante para no invalidar los índices al sustituir.
  jobs.sort((a, b) => b.start - a.start);
  for (const j of jobs) {
    body = body.slice(0, j.start) + fillCard(body.slice(j.start, j.end), j.art) + body.slice(j.end);
  }
  return body;
}

/** Portada: snapshot del tema + últimas noticias de la BD inyectadas en el hero. */
export async function getHomePage(): Promise<PageData | null> {
  const page = await getPageData("");
  if (!page) return null;
  const latest = await getLatestArticulos(5);
  return { ...page, body: templatizeHome(page.body, latest) };
}

/** Devuelve la página de un slug ("" = home), o null si no existe. */
export async function getPageData(slug: string): Promise<PageData | null> {
  // 1) Página original (HTML idéntico al snapshot).
  const pages = await queryParams<{ data: string }>(
    "SELECT data FROM paginas WHERE slug = ?1 LIMIT 1;",
    [slug],
  );
  if (pages.length) {
    try {
      return JSON.parse(pages[0].data) as PageData;
    } catch {
      return null;
    }
  }

  // 2) Noticia creada en el panel.
  const arts = await queryParams<Articulo>(
    "SELECT slug, titulo, fecha, portada, extracto, html FROM articulos WHERE slug = ?1 LIMIT 1;",
    [slug],
  );
  if (arts.length) return assembleArticulo(arts[0]);

  return null;
}

// ---- Buscador (también desde la BD) ----

export type SearchShell = {
  bodyClass: string;
  head: string;
  prefix: string;
  suffix: string;
  cardTemplate: string;
  scripts: ScriptEntry[];
};

export type SearchItem = {
  title: string;
  url: string;
  thumb: string;
  excerpt: string;
  find: string; // clave normalizada para el filtro de cliente
};

const stripHtml = (html: string): string => html.replace(/<[^>]*>/g, " ");

/**
 * Datos del buscador desde la BD: las noticias del panel (`articulos`, en vivo,
 * incluye las recién publicadas) + las originales (`busqueda`). Las del panel
 * tienen prioridad; el resultado va de más nuevas a más antiguas.
 */
export async function getSearchData(): Promise<{
  shell: SearchShell;
  items: SearchItem[];
}> {
  const arts = await queryParams<Articulo>(
    "SELECT slug, titulo, fecha, portada, extracto, html FROM articulos ORDER BY fecha DESC;",
    [],
  );
  const orig = await queryParams<{
    slug: string;
    titulo: string;
    thumb: string | null;
    excerpt: string | null;
    texto: string | null;
  }>("SELECT slug, titulo, thumb, excerpt, texto FROM busqueda;", []);

  const seen = new Set<string>();
  const items: SearchItem[] = [];
  for (const a of arts) {
    seen.add(a.slug);
    items.push({
      title: a.titulo,
      url: `/${a.slug}/`,
      thumb: a.portada || "/icon.webp",
      excerpt: a.extracto ?? "",
      find: normalizeKey(`${a.titulo} ${a.extracto ?? ""} ${stripHtml(a.html ?? "")}`),
    });
  }
  for (const o of orig) {
    if (seen.has(o.slug)) continue;
    items.push({
      title: o.titulo,
      url: `/${o.slug}/`,
      thumb: o.thumb || "/icon.webp",
      excerpt: o.excerpt ?? "",
      find: normalizeKey(`${o.titulo} ${o.texto ?? ""}`),
    });
  }

  return { shell: decodeB64<SearchShell>(SEARCH_SHELL_B64), items };
}
