import { NextResponse } from "next/server";
import { runParams } from "@/lib/d1";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// En Pages (edge) no hay disco: la imagen se guarda en D1 (base64) y se
// sirve por /api/img/[id]. Límite ~1.2 MB por los límites de fila de D1.
const MAX_BYTES = 1_200_000;

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Imagen muy grande: usa una de máximo 1.2 MB" },
      { status: 413 },
    );
  }
  const id = crypto.randomUUID();
  const mime = file.type || "image/jpeg";
  const datos = toBase64(await file.arrayBuffer());
  await runParams(
    "INSERT INTO imagenes (id, mime, datos) VALUES (?1, ?2, ?3);",
    [id, mime, datos],
  );
  return NextResponse.json({ url: `/api/img/${id}` });
}
