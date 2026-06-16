import { NextResponse } from "next/server";
import { query, execSql, esc } from "@/lib/d1";
import { ANUNCIOS } from "@/lib/anuncios";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type Estado = { id: string; imagen: string | null; activo: number };

export async function GET() {
  const rows = await query<Estado>("SELECT id, imagen, activo FROM anuncios;");
  const byId = new Map(rows.map((r) => [r.id, r]));
  const list = ANUNCIOS.map((a) => {
    const st = byId.get(a.id);
    return {
      ...a,
      imagen: st?.imagen ?? null,
      activo: st ? st.activo === 1 : true,
    };
  });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const { id, imagen, activo } = await req.json();
  if (!ANUNCIOS.some((a) => a.id === id)) {
    return NextResponse.json({ error: "Anuncio inválido" }, { status: 400 });
  }
  const sets: string[] = [];
  if (imagen !== undefined) sets.push(`imagen = ${esc(imagen)}`);
  if (activo !== undefined) sets.push(`activo = ${activo ? 1 : 0}`);
  if (sets.length) {
    await execSql(
      `UPDATE anuncios SET ${sets.join(", ")} WHERE id = ${esc(id)};`,
    );
  }
  return NextResponse.json({ ok: true });
}
