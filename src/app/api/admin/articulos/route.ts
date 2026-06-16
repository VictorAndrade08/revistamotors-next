import { NextResponse } from "next/server";
import { query, runParams } from "@/lib/d1";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Lista de noticias (para el panel)
export async function GET() {
  const rows = await query(
    "SELECT slug, titulo, fecha, portada FROM articulos ORDER BY fecha DESC;",
  );
  return NextResponse.json(rows);
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];

// Crear o actualizar una noticia
export async function POST(req: Request) {
  let a: Record<string, unknown>;
  try {
    a = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }
  const slug = str(a.slug).trim();
  const titulo = str(a.titulo).trim();
  if (!slug || !titulo) {
    return NextResponse.json(
      { error: "Faltan el título o el slug" },
      { status: 400 },
    );
  }
  // Bind params (?1..?8): el HTML va como dato, no concatenado al SQL.
  // Evita inyección y el límite de tamaño de sentencia de D1 (artículos largos).
  await runParams(
    `INSERT INTO articulos (slug, titulo, fecha, portada, extracto, html, categorias, tags)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
     ON CONFLICT(slug) DO UPDATE SET
       titulo = excluded.titulo,
       fecha = excluded.fecha,
       portada = excluded.portada,
       extracto = excluded.extracto,
       html = excluded.html,
       categorias = excluded.categorias,
       tags = excluded.tags;`,
    [
      slug,
      titulo,
      str(a.fecha),
      str(a.portada),
      str(a.extracto),
      str(a.html),
      JSON.stringify(arr(a.categorias)),
      JSON.stringify(arr(a.tags)),
    ],
  );
  return NextResponse.json({ ok: true, slug });
}
