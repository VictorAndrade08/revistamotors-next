// Tipos de los datos de página. El contenido ya no se lee de disco: las páginas
// se sirven desde D1 (ver db-loader.ts). Estos tipos los comparten el buscador,
// SitePage y ThemeScripts.

export type ScriptEntry = { src?: string; code?: string };

export type PageData = {
  route: string;
  title: string;
  bodyClass: string;
  head: string;
  body: string;
  scripts: ScriptEntry[];
  // SEO opcional (lo llenan las noticias del panel): meta description y
  // portada para canonical/OpenGraph en generateMetadata.
  description?: string;
  image?: string;
};
