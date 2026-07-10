import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageData } from "@/site-data/db-loader";
import SitePage from "@/components/SitePage";

// Todas las páginas (originales + noticias del panel) se sirven desde D1 en el
// runtime edge. Así, crear una noticia en /admin la publica al instante en su
// URL, sin regenerar archivos ni hacer rebuild.
export const runtime = "edge";

type Params = { slug: string[] };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageData(slug.join("/"));
  if (!page) return { title: "Revista Motors Ecuador" };
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.route },
    openGraph: {
      title: page.title,
      description: page.description,
      url: page.route,
      ...(page.image ? { images: [page.image] } : {}),
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const page = await getPageData(slug.join("/"));
  if (!page) notFound();
  return <SitePage page={page} />;
}
