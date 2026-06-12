import { NextResponse } from "next/server";
import { query, execSql, esc } from "@/lib/d1";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lista de noticias (para el panel)
export async function GET() {
  const rows = await query(
    "SELECT slug, titulo, fecha, portada FROM articulos ORDER BY fecha DESC;",
  );
  return NextResponse.json(rows);
}

// Crear o actualizar una noticia
export async function POST(req: Request) {
  const a = await req.json();
  if (!a.slug || !a.titulo) {
    return NextResponse.json(
      { error: "Faltan el título o el slug" },
      { status: 400 },
    );
  }
  const sql = `
    INSERT INTO articulos (slug, titulo, fecha, portada, extracto, html, categorias, tags)
    VALUES (${esc(a.slug)}, ${esc(a.titulo)}, ${esc(a.fecha)}, ${esc(a.portada)},
            ${esc(a.extracto)}, ${esc(a.html)},
            ${esc(JSON.stringify(a.categorias ?? []))}, ${esc(JSON.stringify(a.tags ?? []))})
    ON CONFLICT(slug) DO UPDATE SET
      titulo = excluded.titulo,
      fecha = excluded.fecha,
      portada = excluded.portada,
      extracto = excluded.extracto,
      html = excluded.html,
      categorias = excluded.categorias,
      tags = excluded.tags;`;
  await execSql(sql);
  return NextResponse.json({ ok: true, slug: a.slug });
}
