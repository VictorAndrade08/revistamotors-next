import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const safe = (file.name || "img").replace(/[^a-zA-Z0-9._-]/g, "-");
  const name = `${process.hrtime.bigint().toString(36)}-${safe}`;
  const dir = path.join(process.cwd(), "public", "assets", "uploads", "admin");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return NextResponse.json({ url: `/assets/uploads/admin/${name}` });
}
