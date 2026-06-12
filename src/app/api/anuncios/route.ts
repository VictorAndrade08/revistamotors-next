import { NextResponse } from "next/server";
import { query } from "@/lib/d1";
import { ANUNCIOS } from "@/lib/anuncios";

// API pública: el sitio la usa para aplicar los anuncios (imagen / activo).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Estado = { id: string; imagen: string | null; activo: number };

export async function GET() {
  let rows: Estado[] = [];
  try {
    rows = await query<Estado>("SELECT id, imagen, activo FROM anuncios;");
  } catch {
    rows = [];
  }
  const byId = new Map(rows.map((r) => [r.id, r]));
  const list = ANUNCIOS.map((a) => {
    const st = byId.get(a.id);
    return {
      original: a.path,
      imagen: st?.imagen ?? null,
      activo: st ? st.activo === 1 : true,
    };
  });
  return NextResponse.json(list, {
    headers: { "Cache-Control": "public, max-age=30" },
  });
}
