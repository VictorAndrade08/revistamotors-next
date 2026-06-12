import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allRoutes, getPage, routeToSlug } from "@/site-data/loader";
import SitePage from "@/components/SitePage";

// Solo se sirven las rutas conocidas del sitio; el resto devuelve 404.
export const dynamicParams = false;

type Params = { slug?: string[] };

export function generateStaticParams(): Params[] {
  return allRoutes().map((r) => ({ slug: routeToSlug(r.route) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  return { title: page?.title || "Revista Motors Ecuador" };
}

export default async function Page({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  return <SitePage page={page} />;
}
