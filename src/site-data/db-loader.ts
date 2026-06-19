import "server-only";
import { queryParams } from "@/lib/d1";
import { escapeHtml, normalizeKey, slugify } from "@/lib/text";
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
  prefix: string; // hasta el interior de <entry-content> (incluye cabecera, imagen, título…)
  suffix: string; // desde el cierre de entry-content (tags, autor, sidebar, footer)
  scripts: PageData["scripts"];
  // Valores de la plantilla que se reemplazan por los de la noticia:
  title: string;
  slug: string;
  featuredSrc: string;
  dateText: string;
  datetimeISO: string;
};

// Decodifica el marco del tema (base64 UTF-8) una sola vez.
const shell: Shell = decodeB64<Shell>(ARTICLE_SHELL_B64);

// Solo se muestran las noticias cuya fecha ya llegó. Las publicaciones con fecha
// futura quedan "programadas": aparecen solas cuando su fecha pasa, sin cron.
// (fecha NULL = siempre visible, para los posts legacy.)
const PUBLICADO = "(fecha IS NULL OR datetime(fecha) <= datetime('now'))";

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

/**
 * Ensambla una noticia con el layout COMPLETO del tema (cabecera, breadcrumb,
 * autor, compartir, barra lateral con encuesta y "últimos posts"). El contenido
 * se inyecta en el `entry-content` y se reemplazan los valores de la plantilla
 * (título, imagen, fecha, enlaces) por los de la noticia.
 */
function assembleArticulo(a: Articulo, latest: Card[]): PageData {
  const titulo = escapeHtml(a.titulo);
  let body = shell.prefix + (a.html ?? "") + shell.suffix;
  body = body.split(shell.title).join(titulo);
  body = body.split(shell.slug).join(a.slug);
  if (a.portada) body = body.split(shell.featuredSrc).join(escapeHtml(a.portada));
  body = body.split(shell.dateText).join(formatFecha(a.fecha));
  if (a.fecha) body = body.split(shell.datetimeISO).join(a.fecha);
  body = body.replace(/\s(?:srcset|data-srcset)="[^"]*"/g, ""); // evita imágenes responsive viejas
  // Tarjetas de relacionados (texto) y de la barra lateral (con miniatura)
  // -> últimas noticias, para que el post se vea como los demás.
  const related = latest.filter((c) => c.slug !== a.slug);
  body = replaceCards(body, "p-list-inline", related);
  body = replaceCards(body, "p-list-small-2", related);

  // og:title / og:image en el head, por noticia.
  let head = shell.head.split(shell.title).join(titulo);
  if (a.portada) head = head.split(shell.featuredSrc).join(escapeHtml(a.portada));

  return {
    route: `/${a.slug}/`,
    title: a.titulo,
    bodyClass: shell.bodyClass,
    head,
    body: injectMenuItem(body),
    scripts: shell.scripts,
  };
}

type Card = { titulo: string; slug: string; fecha: string | null; portada: string | null };

/** Últimas noticias publicadas (para alimentar portada/listados). */
export async function getLatestArticulos(limit: number): Promise<Card[]> {
  return queryParams<Card>(
    `SELECT titulo, slug, fecha, portada FROM articulos WHERE ${PUBLICADO} ORDER BY datetime(fecha) DESC LIMIT ?1;`,
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

// Reemplaza las tarjetas de una clase dada (en orden de aparición) por una lista
// de noticias, conservando el maquetado. De atrás hacia delante para no invalidar
// los índices.
function replaceCards(body: string, clsMatch: string, arts: Card[]): string {
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

// Llena TODA la portada con las últimas noticias, de más nuevas a más antiguas:
//  - hero (3 slides) = las 3 más recientes
//  - 2 tarjetas destacadas = las 2 siguientes
//  - resto de secciones (grids/listas de abajo) = las siguientes, en orden
// Se salta el desplegable de notificaciones del header (tarjetas antes del hero).
function templatizeHome(body: string, latest: Card[]): string {
  if (!latest.length) return body;
  const cards = findCards(body);
  const hero = cards.filter((c) => c.cls.includes("p-overlay-1")).slice(0, 3);
  const feat = cards.filter((c) => c.cls.includes("p-overlay-2")).slice(0, 2);
  const heroStart = hero.length ? hero[0].start : 0;

  const jobs: { start: number; end: number; art: Card }[] = [];
  const done = new Set<number>();
  const assign = (c: { start: number; end: number }, art: Card | undefined) => {
    if (!art) return;
    jobs.push({ start: c.start, end: c.end, art });
    done.add(c.start);
  };

  hero.forEach((c, i) => assign(c, latest[i])); // 0,1,2
  feat.forEach((c, i) => assign(c, latest[3 + i])); // 3,4

  // Resto de tarjetas (después del hero, no usadas aún) -> siguientes noticias.
  let n = 5;
  for (const c of cards) {
    if (c.start < heroStart || done.has(c.start)) continue;
    if (!latest[n]) break;
    assign(c, latest[n]);
    n++;
  }

  // De atrás hacia delante para no invalidar los índices al sustituir.
  jobs.sort((a, b) => b.start - a.start);
  for (const j of jobs) {
    body = body.slice(0, j.start) + fillCard(body.slice(j.start, j.end), j.art) + body.slice(j.end);
  }
  return body;
}

type NewsCard = Card & { categorias: string | null };

// Una tarjeta de la cuadrícula "Todas las Noticias" (markup del tema).
function buildNewsCard(a: NewsCard): string {
  const href = `/${a.slug}/`;
  const titulo = escapeHtml(a.titulo);
  let cat = "";
  try {
    cat = (JSON.parse(a.categorias || "[]") as string[])[0] || "";
  } catch {}
  const catLink = cat
    ? `<div class="p-categories p-top"><a class="p-category" href="/categoria/${slugify(
        cat,
      )}/" rel="category">${escapeHtml(cat)}</a></div>`
    : "";
  return `<div class="p-wrap p-grid p-grid-1">
  <div class="feat-holder">
    <div class="p-featured"><a class="p-flink" href="${href}" title="${titulo}"><img class="featured-img wp-post-image" src="${escapeHtml(
      a.portada || "/icon.webp",
    )}" alt="${titulo}" loading="lazy" onerror="this.onerror=null;this.src='/icon.webp'"/></a></div>
    ${catLink}
  </div>
  <h3 class="entry-title"><a class="p-url" href="${href}" rel="bookmark">${titulo}</a></h3>
  <div class="p-meta is-meta"><span class="meta-author">Revista Motors</span> <span class="meta-date"><time class="date published" datetime="${escapeHtml(
    a.fecha || "",
  )}">${formatFecha(a.fecha)}</time></span></div>
</div>`;
}

// Sección "Todas las Noticias": cuadrícula con todos los artículos de la BD.
function buildAllNewsSection(arts: NewsCard[]): string {
  if (!arts.length) return "";
  const cards = arts.map(buildNewsCard).join("\n");
  // Misma estructura que las cuadrículas del tema: rb-columns/rb-col-3 en el
  // block-wrap y los cards dentro de block-inner (así el CSS aplica la grilla).
  return `<div class="rb-container edge-padding section-todas-noticias" style="margin-top:40px;margin-bottom:40px">
  <h2 class="heading-title" style="font-size:28px;font-weight:800;color:#0e1116;margin:0 0 22px;display:inline-block;border-bottom:4px solid #ed1c24;padding-bottom:8px">Todas las Noticias</h2>
  <div class="block-wrap block-grid block-grid-1 rb-columns rb-col-3 rb-tcol-2 rb-mcol-1 is-gap-25">
    <div class="block-inner">${cards}</div>
  </div>
</div>`;
}

/** Portada: hero con lo reciente + sección "Todas las Noticias" con todos los posts. */
export async function getHomePage(): Promise<PageData | null> {
  const page = await getPageData("");
  if (!page) return null;
  const all = await queryParams<NewsCard>(
    `SELECT titulo, slug, fecha, portada, categorias FROM articulos WHERE ${PUBLICADO} ORDER BY datetime(fecha) DESC;`,
    [],
  );
  let body = templatizeHome(page.body, all);
  // Insertar "Todas las Noticias" justo antes del footer.
  const section = buildAllNewsSection(all);
  const f = body.indexOf("<footer");
  body = f >= 0 ? body.slice(0, f) + section + body.slice(f) : body + section;
  return { ...page, body };
}

// Inserta la pestaña "Todas las Noticias" en el menú principal (todas las páginas).
function injectMenuItem(body: string): string {
  const idx = body.indexOf('class="main-menu rb-menu');
  if (idx < 0 || body.indexOf('href="/todas-las-noticias/"') >= 0) return body;
  const open = body.indexOf(">", idx) + 1;
  const li =
    '<li class="menu-item menu-item-type-custom"><a href="/todas-las-noticias/">Todas las Noticias</a></li>';
  return body.slice(0, open) + li + body.slice(open);
}

/** Página "/todas-las-noticias/": listado con TODOS los artículos de la BD. */
async function getTodasNoticias(): Promise<PageData | null> {
  // Reutiliza el layout de listado de la categoría "Noticias".
  const rows = await queryParams<{ data: string }>(
    "SELECT data FROM paginas WHERE slug = 'categoria/noticias' LIMIT 1;",
    [],
  );
  if (!rows.length) return null;
  const page = JSON.parse(rows[0].data) as PageData;
  const all = await queryParams<NewsCard>(
    `SELECT titulo, slug, fecha, portada, categorias FROM articulos WHERE ${PUBLICADO} ORDER BY datetime(fecha) DESC;`,
    [],
  );
  let body = templatizeHome(page.body, all);
  body = body.replace(
    '<h1 class="archive-title">Noticias</h1>',
    '<h1 class="archive-title">Todas las Noticias</h1>',
  );
  body = injectMenuItem(body);
  return {
    ...page,
    route: "/todas-las-noticias/",
    title: "Todas las Noticias",
    body,
  };
}

// Últimas noticias de una categoría (por el slug de la URL, p. ej. "resenas").
// Si hay pocas de esa categoría, completa con las más recientes en general.
async function latestForCategory(catSlug: string): Promise<Card[]> {
  const all = await queryParams<Card & { categorias: string | null }>(
    `SELECT titulo, slug, fecha, portada, categorias FROM articulos WHERE ${PUBLICADO} ORDER BY datetime(fecha) DESC LIMIT 40;`,
    [],
  );
  const inCat = all.filter((a) => {
    try {
      return (JSON.parse(a.categorias || "[]") as string[]).some(
        (c) => slugify(c) === catSlug,
      );
    } catch {
      return false;
    }
  });
  const list = inCat.length >= 5 ? inCat : all;
  return list.map(({ titulo, slug, fecha, portada }) => ({ titulo, slug, fecha, portada }));
}

/** Devuelve la página de un slug ("" = home), o null si no existe. */
export async function getPageData(slug: string): Promise<PageData | null> {
  // Página propia "Todas las Noticias".
  if (slug === "todas-las-noticias") return getTodasNoticias();

  // 1) Página original (HTML idéntico al snapshot).
  const pages = await queryParams<{ data: string }>(
    "SELECT data FROM paginas WHERE slug = ?1 LIMIT 1;",
    [slug],
  );
  if (pages.length) {
    try {
      const page = JSON.parse(pages[0].data) as PageData;
      let body = page.body;
      // Páginas de categoría: llenar sus tarjetas con noticias recientes.
      if (slug.startsWith("categoria/")) {
        const catSlug = slug.split("/")[1] ?? "";
        body = templatizeHome(body, await latestForCategory(catSlug));
      }
      body = injectMenuItem(body); // pestaña "Todas las Noticias" en todas las páginas
      return { ...page, body };
    } catch {
      return null;
    }
  }

  // 2) Noticia creada en el panel.
  const arts = await queryParams<Articulo>(
    `SELECT slug, titulo, fecha, portada, extracto, html FROM articulos WHERE slug = ?1 AND ${PUBLICADO} LIMIT 1;`,
    [slug],
  );
  if (arts.length) {
    const latest = await getLatestArticulos(10);
    return assembleArticulo(arts[0], latest);
  }

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
    `SELECT slug, titulo, fecha, portada, extracto, html FROM articulos WHERE ${PUBLICADO} ORDER BY datetime(fecha) DESC;`,
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
