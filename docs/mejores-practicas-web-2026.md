# Top 50 — Mejores prácticas para Revista Motors (de mayor a menor impacto)

> Investigación hecha el 2026-07-09 con Apify (Reddit Scraper) sobre hilos de
> r/webdev, r/nextjs y r/SEO del último año (~150 publicaciones analizadas),
> más una auditoría en vivo de revistamotors.com.ec. Fuentes al final.
>
> **Leyenda de estado del sitio:** ✅ ya cumplido · ⚠️ parcial · ❌ pendiente · — no aplica
>
> **Actualización 2026-07-10 — implementado y desplegado:** sitemap.xml dinámico (#2),
> JSON-LD NewsArticle (#3), canonical (#4), meta/og description por artículo (#18, #19),
> variantes 800px en R2 + srcset en tarjetas (#1, #11), preconnect temprano a R2/fuentes (#13),
> paginación de "Todas las Noticias" y home limitado a 12 + botón (#27, HTML 518→428 KB, #6 parcial),
> feed RSS (#21), página 404 útil (#22), prefetch al hover (#32) y robots.txt con Sitemap.
> Pendientes que requieren el dashboard de Cloudflare: regla de caché para HTML (#5).
> Descartados por riesgo/beneficio: self-host de fuentes (#8 — ya tienen display=swap y
> preconnect) y extraer el CSS del tema de los snapshots (#6 completo).

## Auditoría express del sitio (2026-07-09)

| Métrica | Valor | Nota |
|---|---|---|
| HTML de portada | **518 KB** | Muy pesado: el `<head>` del tema va inline en cada página |
| Imágenes | 98 (`72` lazy, `58` con width/height, `5` fetchpriority) | CLS mejorable |
| Imagen hero | 265 KB WebP | Puede bajar a ~100 KB al tamaño real de render |
| Stylesheets | 14 | Herencia del tema WordPress |
| Google Fonts (CDN) | 6 referencias | Retrasa el primer render |
| `sitemap.xml` | **404** | Crítico para un sitio de noticias |
| JSON-LD (NewsArticle) | **No existe** | Clave para Google Discover/News |
| `rel=canonical` | **No existe** | |
| Edge cache | `cf-cache-status: DYNAMIC` | El `s-maxage=30` no está cacheando en Cloudflare |
| meta description por artículo | Solo global | `generateMetadata` solo define `title` |

---

## 🥇 Crítico (1–10) — lo que más mueve la aguja

| # | Práctica | Estado |
|---|---|---|
| 1 | **Optimizar la imagen LCP (hero)**: servirla al tamaño real de render, `fetchpriority="high"`, nunca lazy. Un caso real en r/nextjs pasó de LCP 4.2s → 0.8s solo con imagen+fuentes+scripts. | ⚠️ fetchpriority ya está; falta reducir peso (265 KB → ~100 KB) |
| 2 | **Publicar `sitemap.xml`** (dinámico desde D1) y enviarlo a Google Search Console. Sin él, Google descubre las noticias tarde. | ❌ |
| 3 | **JSON-LD `NewsArticle`** en cada noticia (titular, fecha ISO, imagen, autor). Es el requisito nº1 para aparecer en Google Discover y News. | ❌ |
| 4 | **`rel=canonical` en cada página** — evita contenido duplicado (con/sin query params). | ❌ |
| 5 | **Cache real en el edge**: el HTML responde `DYNAMIC`; hacer que el `s-maxage=30` se respete (Cache API del Worker o regla de caché de Cloudflare). TTFB objetivo < 100 ms. | ⚠️ |
| 6 | **Adelgazar el HTML (518 KB)**: extraer el CSS común del tema (hoy inline en cada página) a un archivo estático cacheable. | ❌ |
| 7 | **Diferir scripts de terceros hasta la primera interacción** (scroll/click). Es el truco con el que devs reportan TBT≈0 manteniendo analytics. | ⚠️ |
| 8 | **Self-host de fuentes** (`next/font`, `display: swap`) en lugar de Google Fonts CDN: ahorra DNS + render-block (~1.2 s en el caso de estudio). | ❌ |
| 9 | **`width`/`height` en todas las `<img>`** para eliminar saltos de layout (CLS). Hoy: 58 de 98. | ⚠️ |
| 10 | **Autoridad temática**: publicar de forma constante en el mismo nicho. En r/SEO: "Crawled, not indexed" casi siempre es falta de autoridad, no un error técnico. | ✅ (publicación diaria programada) |

## 🥈 Alto impacto (11–20)

| # | Práctica | Estado |
|---|---|---|
| 11 | Servir imágenes **AVIF/WebP con varios tamaños** (`srcset` propio por breakpoint; hoy se elimina el legacy y queda un solo tamaño). | ⚠️ |
| 12 | **Lazy loading solo bajo el pliegue**, eager arriba. | ✅ (`eagerizeAboveFold`) |
| 13 | **`preconnect`/`preload`** a orígenes críticos (R2 `pub-*.r2.dev`, CDN de assets). Hoy solo hay 1. | ⚠️ |
| 14 | **Consolidar/minificar CSS**: 14 stylesheets del tema → combinar los que siempre van juntos. | ❌ |
| 15 | **Retirar progresivamente jQuery/scripts del tema** que ya no se usan (cada uno se re-ejecuta en cada navegación). | ⚠️ |
| 16 | **Enlazado interno por relevancia**: relacionados por categoría/tag, no solo "últimas". Mejora tiempo en sitio y SEO. | ⚠️ |
| 17 | **URLs legibles y estables** (slugs limpios, sin fechas). El estudio de Ahrefs (1.4M prompts) muestra que título+URL deciden si ChatGPT/Google citan tu página. | ✅ |
| 18 | **`meta description` única por artículo** (usar el extracto en `generateMetadata`). | ❌ |
| 19 | **Open Graph completo por noticia**: og:description y twitter:card además de title/image. | ⚠️ |
| 20 | **Medir con datos reales**: Google Search Console + analytics ligero (caso Umami en r/webdev: GA sobreestima/complica; uno liviano no bloquea). | ❌ |

## 🥉 Impacto medio (21–30)

| # | Práctica | Estado |
|---|---|---|
| 21 | **Feed RSS** (`/feed.xml`) para agregadores y Google News. | ❌ |
| 22 | **Página 404 útil** con buscador y últimas noticias (recupera visitas perdidas). | ❌ |
| 23 | **Accesibilidad básica**: `alt` descriptivo, jerarquía h1→h2, contraste. | ⚠️ |
| 24 | HTTPS + HSTS. | ✅ (Cloudflare) |
| 25 | Compresión Brotli/Gzip. | ✅ (Cloudflare) |
| 26 | **Sin cadenas de redirects**; trailing slash consistente. | ✅ |
| 27 | **Paginar "Todas las Noticias"**: hoy renderiza TODOS los posts en un solo HTML; con cientos de noticias la página crecerá sin límite. | ⚠️ (bomba de tiempo) |
| 28 | **Estrategia de caché al publicar**: s-maxage corto (ya 30s) o purga por URL al guardar en el panel. | ✅ |
| 29 | **Monitorear Core Web Vitals con datos de campo** (informe CrUX / PageSpeed Insights mensual). | ❌ |
| 30 | **Fechas visibles y `datetime` ISO** en cada noticia. | ✅ |

## Impacto bajo pero valioso (31–40)

| # | Práctica | Estado |
|---|---|---|
| 31 | Placeholder para anuncios: `AdsManager` cambia el `src` en cliente y produce un parpadeo; reservar el espacio. | ⚠️ |
| 32 | Prefetch de enlaces al pasar el mouse (navegación percibida instantánea). | ❌ |
| 33 | Notificaciones push / newsletter: tráfico propio que no depende de Google (en r/SEO: los AI Overviews están robando CTR incluso a quien rankea #1). | ❌ |
| 34 | Botones de compartir nativos. | ✅ (tema) |
| 35 | Buscador interno con sinónimos. | ✅ |
| 36 | Sección de comentarios o encuestas (engagement = señal indirecta). | ⚠️ (encuesta simulada) |
| 37 | Presencia auténtica en redes/agregadores (menciones reales, no compradas). | ⚠️ |
| 38 | Tests automatizados de las partes frágiles. | ✅ (vitest en html-cards) |
| 39 | Service worker / soporte offline básico. | ❌ (opcional) |
| 40 | Dark mode. | ❌ (opcional) |

## ⚠️ Lo peor del ranking (41–50): prácticas sobrevaloradas — NO pierdas tiempo aquí

Confirmado por la guía oficial de Google sobre AI Search (compartida en r/SEO) y el consenso de los devs:

| # | Anti-práctica | Por qué evitarla |
|---|---|---|
| 41 | Perseguir 100/100 en Lighthouse como objetivo | Consenso en r/webdev: pasar de 90 a 100 es un "rabbit hole" sin impacto real; 90+ basta |
| 42 | Crear `llms.txt` | Google oficial: no lo usa ni lo necesita |
| 43 | "Chunking" del contenido para AI | Google oficial: sus sistemas entienden páginas completas |
| 44 | Reescribir textos "para las IA" | Google oficial: escribe para tu audiencia, no para el bot |
| 45 | Comprar menciones/enlaces inauténticos | Google oficial: no ayuda y puede penalizar |
| 46 | Keyword stuffing / forzar long-tail | Los sistemas entienden sinónimos; daña la lectura |
| 47 | FAQ schema esperando rich results | Google los retiró de los resultados |
| 48 | Depender 100% del tráfico de Google | Caso real en r/SEO: AI Overview cita tu contenido y te roba el clic; diversifica (push, RSS, redes) |
| 49 | Meter frameworks/librerías pesadas "porque sí" | r/webdev: "no todo necesita React"; cada KB de JS cuesta TBT |
| 50 | Optimizar sin medir antes y después | Regla de oro: medir → arreglar → volver a medir |

---

## 🎯 Plan sugerido (quick wins para este repo, en orden)

1. **`sitemap.xml` dinámico** desde D1 (ruta edge, igual que las páginas). — #2
2. **JSON-LD NewsArticle + canonical + meta description** en `assembleArticulo` / `generateMetadata`. — #3, #4, #18
3. **Reducir la imagen de portada** a ~800px para tarjetas y hero (variante en R2). — #1
4. **Self-host de la fuente del tema** y `preconnect` a R2. — #8, #13
5. **Paginación de "Todas las Noticias"** antes de que crezca más. — #27

## Fuentes (hilos analizados)

- [Case Study: Next.js LCP de 4.2s a 0.8s](https://www.reddit.com/r/nextjs/comments/1sgy4q3/case_study_how_i_reduced_a_nextjs_ecommerce_lcp/) — r/nextjs
- [100/100 PageSpeed en Next.js 15 (scripts tras interacción)](https://www.reddit.com/r/nextjs/comments/1tfij7s/how_i_optimized_my_nextjs_15_app_to_a_perfect/) — r/nextjs
- [Small tweaks que mueven la aguja en Next.js](https://www.reddit.com/r/nextjs/comments/1mw6se7/small_tweaks_that_make_a_big_difference_in_nextjs/) — r/nextjs
- [SEO con 27k páginas indexadas en Next.js](https://www.reddit.com/r/nextjs/comments/1osr7bf/nextjs_project_scaling_to_27k_indexed_pages_and/) — r/nextjs
- [Guía oficial de Google para AI Search (mitos GEO/AEO)](https://www.reddit.com/r/SEO/comments/1te4t71/googles_guide_to_optimizing_for_generative_ai/) — r/SEO
- [Crawled, Not Indexed = autoridad](https://www.reddit.com/r/SEO/comments/1qzt59k/understanding_crawled_not_indexed_in_gsc_an/) — r/SEO
- [Por qué ChatGPT cita una página y no otra (1.4M prompts)](https://www.reddit.com/r/SEO/comments/1ss0drr/why_chatgpt_cites_one_page_over_another_study_of/) — r/SEO
- [Google me castiga por tener buen contenido (AI Overviews)](https://www.reddit.com/r/SEO/comments/1m0fcii/google_is_punishing_me_for_having_good_content/) — r/SEO
- [¿Vale la pena perseguir 100/100 en Lighthouse?](https://www.reddit.com/r/webdev/comments/1s614l0/is_chasing_100100_lighthouse_score_worth_it_as_an/) — r/webdev
- [¿100 en las 4 métricas de PageSpeed en producción?](https://www.reddit.com/r/webdev/comments/1r4yptj/has_anyone_managed_to_get_100_in_all_four/) — r/webdev
- ["Best practices" que los devs dejaron de seguir](https://www.reddit.com/r/webdev/comments/1qzo2na/whats_a_widely_accepted_best_practice_youve/) — r/webdev
