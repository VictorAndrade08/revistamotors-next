import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage } from "@/site-data/loader";
import SitePage from "@/components/SitePage";

// Portada del sitio (ruta "/").
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage([]);
  return { title: page?.title || "Revista Motors Ecuador" };
}

export default async function Home() {
  const page = await getPage([]);
  if (!page) notFound();
  return <SitePage page={page} />;
}
