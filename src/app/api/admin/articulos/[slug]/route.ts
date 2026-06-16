import { NextResponse } from "next/server";
import { queryParams, runParams } from "@/lib/d1";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const rows = await queryParams(
    "SELECT * FROM articulos WHERE slug = ?1 LIMIT 1;",
    [slug],
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
  await runParams("DELETE FROM articulos WHERE slug = ?1;", [slug]);
  return NextResponse.json({ ok: true });
}
