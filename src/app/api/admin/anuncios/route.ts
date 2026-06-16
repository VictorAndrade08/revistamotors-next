import { NextResponse } from "next/server";
import { query, runParams } from "@/lib/d1";
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
  let body: { id?: unknown; imagen?: unknown; activo?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }
  const { id, imagen, activo } = body;
  if (!ANUNCIOS.some((a) => a.id === id)) {
    return NextResponse.json({ error: "Anuncio inválido" }, { status: 400 });
  }
  // Asegura la fila (la lista base no está pre-sembrada): así el UPDATE persiste
  // aunque sea la primera vez que se edita este anuncio.
  await runParams(
    "INSERT OR IGNORE INTO anuncios (id, imagen, activo) VALUES (?1, NULL, 1);",
    [id],
  );
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (imagen !== undefined) {
    sets.push(`imagen = ?${vals.length + 1}`);
    vals.push(imagen === null ? null : String(imagen));
  }
  if (activo !== undefined) {
    sets.push(`activo = ?${vals.length + 1}`);
    vals.push(activo ? 1 : 0);
  }
  if (sets.length) {
    vals.push(id);
    await runParams(
      `UPDATE anuncios SET ${sets.join(", ")} WHERE id = ?${vals.length};`,
      vals,
    );
  }
  return NextResponse.json({ ok: true });
}
