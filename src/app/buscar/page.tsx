import ThemeScripts from "@/components/ThemeScripts";
import SearchFilter from "@/components/SearchFilter";
import { getSearchData, type SearchShell, type SearchItem } from "@/site-data/db-loader";
import { escapeHtml } from "@/lib/text";

// El buscador se sirve desde D1 (runtime edge): las noticias creadas en el
// panel quedan buscables al instante, junto con las originales.
export const runtime = "edge";
export const metadata = { title: "Buscar" };

function buildCard(shell: SearchShell, it: SearchItem): string {
  return shell.cardTemplate
    .replaceAll("{{URL}}", escapeHtml(it.url))
    .replaceAll("{{TITLE}}", escapeHtml(it.title))
    .replaceAll("{{THUMB}}", escapeHtml(it.thumb))
    .replaceAll("{{EXCERPT}}", escapeHtml(it.excerpt))
    .replaceAll("{{FIND}}", escapeHtml(it.find));
}

export default async function BuscarPage() {
  const { shell, items } = await getSearchData();
  const cards = items.map((it) => buildCard(shell, it)).join("\n");
  const html = shell.prefix + cards + shell.suffix;

  return (
    <div className={shell.bodyClass}>
      <div
        className="hidden"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: shell.head }}
      />
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <ThemeScripts scripts={shell.scripts} />
      <SearchFilter />
    </div>
  );
}
