import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHomePage } from "@/site-data/db-loader";
import SitePage from "@/components/SitePage";

// Portada del sitio (ruta "/"). Se sirve desde D1 (runtime edge): el marco del
// tema + las últimas noticias de la BD inyectadas en el hero, así que publicar
// una noticia la coloca en portada al instante, sin rebuild.
export const runtime = "edge";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getHomePage();
  return { title: page?.title || "Revista Motors Ecuador" };
}

export default async function Home() {
  const page = await getHomePage();
  if (!page) notFound();
  return <SitePage page={page} />;
}
