import "server-only";
import { queryParams } from "@/lib/d1";
import { escapeHtml, normalizeKey, slugify } from "@/lib/text";
import { ARTICLE_SHELL_B64 } from "./article-shell";
import { SEARCH_SHELL_B64 } from "./search-shell";
import type { PageData, ScriptEntry } from "./loader";
import {
  POLITICA_PRIVACIDAD_DESCRIPCION,
  POLITICA_PRIVACIDAD_HTML,
  POLITICA_PRIVACIDAD_RUTA,
  POLITICA_PRIVACIDAD_TITULO,
} from "./politica-privacidad";
import {
  type Card,
  formatFecha,
  findCards,
  fillCard,
  replaceCards,
} from "./html-cards";

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

/**
 * Ensambla una noticia con el layout COMPLETO del tema (cabecera, breadcrumb,
 * autor, compartir, barra lateral con encuesta y "últimos posts"). El contenido
 * se inyecta en el `entry-content` y se reemplazan los valores de la plantilla
 * (título, imagen, fecha, enlaces) por los de la noticia.
 */
// Datos estructurados NewsArticle (Google News/Discover) para una noticia.
function newsArticleJsonLd(a: Articulo): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: a.titulo,
    ...(a.fecha ? { datePublished: a.fecha, dateModified: a.fecha } : {}),
    ...(a.portada ? { image: [a.portada] } : {}),
    ...(a.extracto ? { description: a.extracto } : {}),
    mainEntityOfPage: `https://revistamotors.com.ec/${a.slug}/`,
    author: { "@type": "Organization", name: "Revista Motors" },
    publisher: {
      "@type": "Organization",
      name: "Revista Motors Ecuador",
      logo: { "@type": "ImageObject", url: "https://revistamotors.com.ec/icon.webp" },
    },
  };
  // "<" escapado para que un título no pueda cerrar el <script>.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

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

  // og:title / og:image en el head, por noticia. Más NewsArticle (JSON-LD).
  let head = shell.head.split(shell.title).join(titulo);
  if (a.portada) head = head.split(shell.featuredSrc).join(escapeHtml(a.portada));
  head += newsArticleJsonLd(a);

  return {
    route: `/${a.slug}/`,
    title: a.titulo,
    bodyClass: shell.bodyClass,
    head,
    body: injectSiteLinks(body),
    scripts: shell.scripts,
    description: a.extracto ?? undefined,
    image: a.portada ?? undefined,
  };
}

/** Últimas noticias publicadas (para alimentar portada/listados). */
export async function getLatestArticulos(limit: number): Promise<Card[]> {
  return queryParams<Card>(
    `SELECT titulo, slug, fecha, portada FROM articulos WHERE ${PUBLICADO} ORDER BY datetime(fecha) DESC LIMIT ?1;`,
    [limit],
  );
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

// srcset para portadas del blog en R2: existe una variante de 800px por cada
// imagen (misma clave + "-800.webp", generada por scripts/gen-r2-variants.py).
// Las tarjetas miden ~400px, así el navegador no baja la imagen de 1536px.
function srcsetPortada(portada: string): string {
  const m = portada.match(/^(https:\/\/pub-[a-z0-9]+\.r2\.dev\/revistamottros\/blog\/web-.+)\.webp$/);
  if (!m) return "";
  return ` srcset="${escapeHtml(m[1])}-800.webp 800w, ${escapeHtml(portada)} 1536w" sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"`;
}

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
    )}"${a.portada ? srcsetPortada(a.portada) : ""} alt="${titulo}" loading="lazy" width="800" height="533" onerror="this.onerror=null;this.src='/icon.webp'"/></a></div>
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

// Botón "Ver todas las noticias" al pie de la sección del home.
const VER_TODAS =
  '<div style="text-align:center;margin-top:26px"><a href="/todas-las-noticias/" style="display:inline-block;background:#ed1c24;color:#fff;font-weight:800;padding:12px 28px;border-radius:10px">Ver todas las noticias →</a></div>';

/** Portada: hero con lo reciente + sección con las últimas noticias. */
export async function getHomePage(): Promise<PageData | null> {
  const page = await getPageData("");
  if (!page) return null;
  // 60 alcanza para el hero + tarjetas del tema + la cuadrícula de abajo;
  // el listado completo vive en /todas-las-noticias/ (paginado).
  const all = await queryParams<NewsCard>(
    `SELECT titulo, slug, fecha, portada, categorias FROM articulos WHERE ${PUBLICADO} ORDER BY datetime(fecha) DESC LIMIT 60;`,
    [],
  );
  let body = templatizeHome(page.body, all);
  // Insertar la sección (últimas 12 + enlace al listado) justo antes del footer.
  let section = buildAllNewsSection(all.slice(0, 12));
  const lastClose = section.lastIndexOf("</div>");
  if (lastClose >= 0) {
    section = section.slice(0, lastClose) + VER_TODAS + section.slice(lastClose);
  }
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

// Enlace a la política de privacidad en el pie de todas las páginas: una
// columna "Legal" (en la primera columna vacía del footer, con el markup de
// los widgets del tema) y, además, junto al © de abajo.
const FOOTER_LEGAL_COL =
  '<div class="footer-col"><div class="widget w-sidebar rb-section clearfix widget_nav_menu" id="legal-1">' +
  '<div class="block-h widget-heading heading-layout-10"><div class="heading-inner"><h4 class="heading-title"><span>Legal</span></h4></div></div>' +
  `<div class="menu-legal-container"><ul class="menu"><li class="menu-item"><a href="${POLITICA_PRIVACIDAD_RUTA}">Política de privacidad</a></li></ul></div>` +
  "</div></div>";

function injectFooterLink(body: string): string {
  if (body.indexOf(`href="${POLITICA_PRIVACIDAD_RUTA}"`) >= 0) return body;
  const foot = body.indexOf("<footer");
  if (foot < 0) return body;
  const EMPTY_COL = '<div class="footer-col"></div>';
  const col = body.indexOf(EMPTY_COL, foot);
  if (col >= 0) {
    body = body.slice(0, col) + FOOTER_LEGAL_COL + body.slice(col + EMPTY_COL.length);
  }
  const idx = body.indexOf('<div class="copyright">', foot);
  if (idx < 0) return body;
  const close = body.indexOf("</p>", idx);
  if (close < 0) return body;
  const link = ` · <a href="${POLITICA_PRIVACIDAD_RUTA}">Política de privacidad</a>`;
  return body.slice(0, close) + link + body.slice(close);
}

// Enlaces propios del sitio que no existen en los snapshots del tema.
function injectSiteLinks(body: string): string {
  return injectFooterLink(injectMenuItem(body));
}

/**
 * /politica-de-privacidad/: texto de src/site-data/politica-privacidad.ts
 * montado en el marco de página simple del tema (la fila "sample-page" de
 * `paginas`: cabecera, título y entry-content sin barra lateral).
 */
async function getPoliticaPrivacidad(): Promise<PageData | null> {
  const rows = await queryParams<{ data: string }>(
    "SELECT data FROM paginas WHERE slug = 'sample-page' LIMIT 1;",
    [],
  );
  if (!rows.length) return null;
  const page = JSON.parse(rows[0].data) as PageData;
  const titulo = escapeHtml(POLITICA_PRIVACIDAD_TITULO);
  // "sample-page" aparece también sin barras (redirecciones del login del
  // tema, config JS), así que se sustituye el slug a secas.
  const slug = POLITICA_PRIVACIDAD_RUTA.replace(/\//g, "");
  let body = page.body.split("Sample Page").join(titulo);
  body = body.split("sample-page").join(slug);
  const OPEN = '<div class="entry-content rbct">';
  const start = body.indexOf(OPEN);
  const end = body.indexOf('<div class="clearfix"></div>', start);
  if (start < 0 || end < 0) return null;
  body =
    body.slice(0, start + OPEN.length) + POLITICA_PRIVACIDAD_HTML + body.slice(end);
  return {
    ...page,
    route: POLITICA_PRIVACIDAD_RUTA,
    title: `${POLITICA_PRIVACIDAD_TITULO} - Revista Motors Ecuador`,
    description: POLITICA_PRIVACIDAD_DESCRIPCION,
    body: injectSiteLinks(body),
    // La config inline del tema también lleva el permalink de la página.
    scripts: page.scripts.map((sc) =>
      sc.code ? { ...sc, code: sc.code.split("sample-page").join(slug) } : sc,
    ),
  };
}

const NOTICIAS_POR_PAGINA = 24;

// Barra de paginación « Anterior · página X de Y · Siguiente »
function buildPaginacion(pagina: number, total: number): string {
  const paginas = Math.max(1, Math.ceil(total / NOTICIAS_POR_PAGINA));
  if (paginas <= 1) return "";
  const url = (n: number) =>
    n <= 1 ? "/todas-las-noticias/" : `/todas-las-noticias/${n}/`;
  const btn = (href: string, label: string) =>
    `<a href="${href}" style="display:inline-block;background:#0e1116;color:#fff;font-weight:700;padding:10px 22px;border-radius:8px;margin:0 6px">${label}</a>`;
  return (
    '<div class="rm-paginacion" style="text-align:center;margin:30px 0 10px">' +
    (pagina > 1 ? btn(url(pagina - 1), "← Anterior") : "") +
    `<span style="color:#6b7280;font-weight:600;margin:0 10px">Página ${pagina} de ${paginas}</span>` +
    (pagina < paginas ? btn(url(pagina + 1), "Siguiente →") : "") +
    "</div>"
  );
}

/** Página "/todas-las-noticias/[n]": listado paginado de los artículos de la BD. */
async function getTodasNoticias(pagina: number): Promise<PageData | null> {
  // Reutiliza el layout de listado de la categoría "Noticias".
  const rows = await queryParams<{ data: string }>(
    "SELECT data FROM paginas WHERE slug = 'categoria/noticias' LIMIT 1;",
    [],
  );
  if (!rows.length) return null;
  const page = JSON.parse(rows[0].data) as PageData;
  const [{ n: total }] = await queryParams<{ n: number }>(
    `SELECT COUNT(*) AS n FROM articulos WHERE ${PUBLICADO};`,
    [],
  );
  const lote = await queryParams<NewsCard>(
    `SELECT titulo, slug, fecha, portada, categorias FROM articulos WHERE ${PUBLICADO}
     ORDER BY datetime(fecha) DESC LIMIT ?1 OFFSET ?2;`,
    [NOTICIAS_POR_PAGINA, (pagina - 1) * NOTICIAS_POR_PAGINA],
  );
  if (!lote.length && pagina > 1) return null; // página fuera de rango -> 404
  let body = templatizeHome(page.body, lote);
  body = body.replace(
    '<h1 class="archive-title">Noticias</h1>',
    '<h1 class="archive-title">Todas las Noticias</h1>',
  );
  // Paginación antes del footer.
  const nav = buildPaginacion(pagina, total);
  const f = body.indexOf("<footer");
  body = f >= 0 ? body.slice(0, f) + nav + body.slice(f) : body + nav;
  body = injectSiteLinks(body);
  return {
    ...page,
    route: pagina <= 1 ? "/todas-las-noticias/" : `/todas-las-noticias/${pagina}/`,
    title: pagina <= 1 ? "Todas las Noticias" : `Todas las Noticias — página ${pagina}`,
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
  // Página propia "Todas las Noticias" (paginada: /todas-las-noticias/2/ …).
  if (slug === "todas-las-noticias") return getTodasNoticias(1);
  const mPag = slug.match(/^todas-las-noticias\/(\d+)$/);
  if (mPag) return getTodasNoticias(Math.max(1, parseInt(mPag[1], 10)));
  if (`/${slug}/` === POLITICA_PRIVACIDAD_RUTA) return getPoliticaPrivacidad();

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
      body = injectSiteLinks(body); // "Todas las Noticias" en el menú y la política en el pie
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
