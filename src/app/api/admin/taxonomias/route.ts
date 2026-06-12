import { NextResponse } from "next/server";
import { query } from "@/lib/d1";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Devuelve todas las categorías y etiquetas existentes (para elegir).
export async function GET() {
  const rows = await query<{ categorias: string; tags: string }>(
    "SELECT categorias, tags FROM articulos;",
  );
  const cats = new Set<string>();
  const tags = new Set<string>();
  for (const r of rows) {
    try {
      (JSON.parse(r.categorias || "[]") as string[]).forEach((c) => cats.add(c));
    } catch {}
    try {
      (JSON.parse(r.tags || "[]") as string[]).forEach((t) => tags.add(t));
    } catch {}
  }
  return NextResponse.json({
    categorias: [...cats].sort((a, b) => a.localeCompare(b)),
    tags: [...tags].sort((a, b) => a.localeCompare(b)),
  });
}
