import shell from "@/site-data/search-shell.json";
import index from "@/site-data/search-index.json";
import ThemeScripts from "@/components/ThemeScripts";
import SearchFilter from "@/components/SearchFilter";
import type { ScriptEntry } from "@/site-data/loader";

type Item = {
  title: string;
  url: string;
  thumb: string;
  excerpt: string;
  text: string;
};

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function findKey(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildCard(it: Item): string {
  const find = findKey(`${it.title} ${it.text}`);
  return (shell.cardTemplate as string)
    .replaceAll("{{URL}}", esc(it.url))
    .replaceAll("{{TITLE}}", esc(it.title))
    .replaceAll("{{THUMB}}", esc(it.thumb))
    .replaceAll("{{EXCERPT}}", esc(it.excerpt))
    .replaceAll("{{FIND}}", esc(find));
}

export const metadata = { title: "Buscar" };

export default function BuscarPage() {
  const cards = (index as Item[]).map(buildCard).join("\n");
  const html = shell.prefix + cards + shell.suffix;

  return (
    <div className={shell.bodyClass}>
      <div
        className="hidden"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: shell.head }}
      />
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <ThemeScripts scripts={shell.scripts as ScriptEntry[]} />
      <SearchFilter />
    </div>
  );
}
