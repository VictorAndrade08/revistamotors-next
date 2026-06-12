import type { PageData } from "@/site-data/loader";
import ThemeScripts from "./ThemeScripts";

/**
 * Renderiza una página con el aspecto IDÉNTICO al original:
 *  - head    → CSS del tema + estilos inline (el navegador los aplica).
 *  - body    → marcado original íntegro (server-rendered, estilado al instante).
 *  - scripts → JS del tema reactivado en TypeScript (slider, menús, sticky).
 * El wrapper lleva las clases del <body> original para que las variables CSS
 * del tema (Elementor/Foxiz) cascadeen correctamente.
 */
export default function SitePage({ page }: { page: PageData }) {
  return (
    <div className={page.bodyClass}>
      <div
        className="hidden"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: page.head }}
      />
      <div dangerouslySetInnerHTML={{ __html: page.body }} />
      <ThemeScripts scripts={page.scripts} />
    </div>
  );
}
