// Los JSON se leen con fs (no import): contienen caracteres que rompen la
// serialización JSON de webpack. La página es estática, solo corre en build.
import fs from "node:fs/promises";
import path from "node:path";
import ThemeScripts from "@/components/ThemeScripts";
import SearchFilter from "@/components/SearchFilter";
import type { ScriptEntry } from "@/site-data/loader";

type Shell = {
  bodyClass: string;
  head: string;
  prefix: string;
  suffix: string;
  cardTemplate: string;
  scripts: ScriptEntry[];
};

async function readJson<T>(file: string): Promise<T> {
  const p = path.join(process.cwd(), "src", "site-data", file);
  return JSON.parse(await fs.readFile(p, "utf-8")) as T;
}

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

function buildCard(shell: Shell, it: Item): string {
  const find = findKey(`${it.title} ${it.text}`);
  return shell.cardTemplate
    .replaceAll("{{URL}}", esc(it.url))
    .replaceAll("{{TITLE}}", esc(it.title))
    .replaceAll("{{THUMB}}", esc(it.thumb))
    .replaceAll("{{EXCERPT}}", esc(it.excerpt))
    .replaceAll("{{FIND}}", esc(find));
}

export const metadata = { title: "Buscar" };

export default async function BuscarPage() {
  const shell = await readJson<Shell>("search-shell.json");
  const index = await readJson<Item[]>("search-index.json");
  const cards = index.map((it) => buildCard(shell, it)).join("\n");
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
