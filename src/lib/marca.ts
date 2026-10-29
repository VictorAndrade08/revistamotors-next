// Marca del sitio: logo y banner con el dominio revistamotors.com.ec.
// Las páginas (D1 y shell del buscador) traen el marcado original de WordPress
// con el logo y el banner viejos (".com"); aquí se cambian al renderizar, así
// no hay que reescribir la base. Los archivos nuevos tienen otro nombre porque
// /assets/* se cachea como immutable.

export const LOGO_VIEJO = "/assets/uploads/2023/03/motorslogo.svg";
// Letras blancas con contorno azul: sirve sobre la cabecera blanca y sobre el
// pie azul.
export const LOGO = "/assets/uploads/2026/10/motorslogo-comec-v2.webp";
const LOGO_ANCHO = 1200;
const LOGO_ALTO = 169;

export const BANNER_VIEJO = "/assets/uploads/2023/07/MOTORS-BANNER-1500X170.jpg";
export const BANNER = "/assets/uploads/2026/10/MOTORS-BANNER-1500X170-comec.jpg";

export function aplicarMarca(html: string): string {
  if (!html) return html;
  // El pie va en azul (ver overrides.css): light-scheme pone el texto en blanco.
  html = html.replace(
    /<footer class="footer-wrap\b/g,
    '<footer class="footer-wrap light-scheme',
  );
  return html
    .replace(/<img\b[^>]*>/g, (tag) =>
      tag.includes(LOGO_VIEJO)
        ? tag
            .replaceAll(LOGO_VIEJO, LOGO)
            .replace(/\swidth="[^"]*"/, ` width="${LOGO_ANCHO}"`)
            .replace(/\sheight="[^"]*"/, ` height="${LOGO_ALTO}"`)
        : tag,
    )
    .replaceAll(LOGO_VIEJO, LOGO)
    .replaceAll(BANNER_VIEJO, BANNER);
}
