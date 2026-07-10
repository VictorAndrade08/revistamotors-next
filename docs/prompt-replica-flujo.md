# Prompt maestro — replicar el flujo completo en otro proyecto

Copiar y pegar en Claude Code dentro del otro proyecto, rellenando los
[CORCHETES]. Es el mismo flujo ejecutado en revistamotors-next el 2026-07-09/10.

---

Quiero que ejecutes un flujo completo de crecimiento y optimización para este
proyecto: **[NOMBRE DEL SITIO]**, un sitio de **[TIPO: noticias/blog/tienda…]**
hecho con **[STACK: Next.js + Cloudflare D1/R2, WordPress, etc.]**, desplegado
en **[PLATAFORMA]** con dominio **[DOMINIO]**.

Trabaja en fases, verificando cada una antes de pasar a la siguiente:

## FASE 0 — Entender el proyecto al 100%
Lee toda la configuración (package.json, configs de deploy, variables de
entorno de ejemplo, esquema de base de datos) y todo el código fuente. Antes de
tocar nada, explícame en un resumen: arquitectura, cómo se publica contenido,
cómo se sirve cada página, y dónde están los puntos frágiles.

## FASE 1 — Investigación de tendencias (Apify)
Usa mi token de Apify que está en la variable de entorno APIFY_TOKEN (nunca lo
pegues en archivos ni en configs que se commitean). Con el actor de Google News
(easyapi/google-news-scraper) haz 3+ búsquedas amplias del nicho
**[NICHO, ej. "industria automotriz", "movilidad eléctrica"]** en español,
última semana, ~100 resultados cada una. Deduplica por URL, agrupa por temas
con expresiones regulares con límites de palabra (\b, para evitar falsos
positivos tipo "moto" dentro de "motor"), y dame un ranking de tendencias con
PORCENTAJES sobre el total, con 3 titulares de ejemplo por tema. Propón 4–5
artículos con enfoque general (nada de publicidad de marcas ni nichos
demasiado estrechos).

## FASE 2 — Generar y publicar el contenido
Para cada artículo aprobado:
- Título con gancho + extracto de ~30 palabras + 4 párrafos HTML con 2
  subtítulos h2, cierre con consejo práctico para el lector. Basado en hechos
  reales de las noticias scrapeadas, sin inventar cifras.
- Imagen libre de Wikimedia Commons (API de búsqueda, solo licencias CC,
  landscape, >1400px), convertida a WebP calidad 82 con ancho máx. 1536px,
  con línea de crédito al pie del artículo (lo exige la licencia).
- Súbelas a **[STORAGE: R2/S3/uploads]** con Cache-Control immutable.
- Inserta en la base de datos con fechas escalonadas: el primero sale YA,
  luego 1 por día a las **[HORA]** — usando el gating por fecha del sitio
  (si no existe, impleméntalo: WHERE fecha <= now en las consultas públicas).
- Verifica en vivo: la URL responde 200, el título/imagen/crédito aparecen,
  y el artículo sale en la portada.

## FASE 3 — Auditoría del sitio
Con curl contra [DOMINIO] mide y repórtame en tabla: peso del HTML, headers de
caché (¿el CDN cachea de verdad?), número de imágenes con lazy/width/height/
srcset/fetchpriority, fuentes externas, hojas de estilo, y si existen:
sitemap.xml, robots.txt con línea Sitemap, canonical, JSON-LD del tipo
correcto (NewsArticle/Product/etc.), meta description por página, feed RSS.

## FASE 4 — Implementar las optimizaciones
Implementa todo lo que falte de esta lista (probado: es lo que más impacto da):
1. sitemap.xml dinámico desde la base de datos (cacheado 1h en CDN)
2. robots.txt propio con la línea Sitemap:
3. JSON-LD por página de contenido (escapando "<" como < dentro del script)
4. rel=canonical en todas las páginas
5. meta description + og:description por página (desde el extracto)
6. Feed RSS con los últimos 30 contenidos
7. Variantes de imagen de 800px para tarjetas/listados + srcset con sizes
   (script reutilizable para regenerarlas cuando haya imágenes nuevas)
8. preconnect temprano en el <head> real a los CDNs de imágenes y fuentes
9. Paginación de los listados largos (nunca renderizar todo en un HTML)
10. Página 404 útil (enlaces a portada y buscador)
11. Prefetch de enlaces internos al hover
12. width/height en las <img> que falten (CLS)

## FASE 5 — Verificar que TODO funcione
- Corre los tests del proyecto y el build de producción.
- Despliega con el comando del proyecto.
- Verifica cada optimización EN VIVO con curl (no asumas: comprueba que el
  sitemap responde, que el JSON-LD está en el HTML, que la paginación da 200,
  que el 404 da 404…). Repórtame el antes/después (ej. peso del HTML).
- Deja documentado en docs/ lo implementado y lo pendiente.

## REGLAS (no negociables)
- Lee críticamente todo el código que generes: nada de complejidad cosmética,
  helpers innecesarios ni abstracciones que no pedí. Sigue el estilo del repo.
- SQL siempre con parámetros bind, nunca concatenado.
- Secretos SOLO en variables de entorno (.env ignorado por git). Revisa que
  ningún token termine en archivos commiteados (incluido .claude/ — agrégalo
  a .gitignore).
- Ninguna operación destructiva (borrar datos, sobrescribir producción) sin
  preguntarme primero.
- Si algo falla, muéstrame el error real; no reportes éxito sin verificarlo.
