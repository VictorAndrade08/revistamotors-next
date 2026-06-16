import { NextResponse } from "next/server";
import { query, execSql, esc } from "@/lib/d1";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const rows = await query(
    `SELECT * FROM articulos WHERE slug = ${esc(slug)} LIMIT 1;`,
  );
  if (!rows.length) {
    return NextResponse.json({ error: "No existe" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  await execSql(`DELETE FROM articulos WHERE slug = ${esc(slug)};`);
  return NextResponse.json({ ok: true });
}
