import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { runParams } from "@/lib/d1";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Subida de imágenes del panel.
// - Preferente: Cloudflare R2 (binding `MEDIA`, bucket "medias", carpeta
//   "revistamottros/uploads/"). Sin límite práctico de tamaño; devuelve la URL
//   pública r2.dev.
// - Respaldo: si no hay binding R2, se guarda en D1 (base64) y se sirve por
//   /api/img/[id] (límite ~1.2 MB por los límites de fila de D1).

const MAX_BYTES_D1 = 1_200_000;
const R2_FOLDER = "revistamottros/uploads/";
const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL ??
  "https://pub-25cde2184a5249da96fa022aae951321.r2.dev";

// Binding R2 (interfaz mínima para no depender de @cloudflare/workers-types).
interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ReadableStream,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
}

function getR2(): R2Bucket | null {
  try {
    const env = getRequestContext().env as unknown as { MEDIA?: R2Bucket };
    return env.MEDIA ?? null;
  } catch {
    return null;
  }
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

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

  const mime = file.type || "image/jpeg";
  const id = crypto.randomUUID();
  const r2 = getR2();

  // --- Preferente: subir a R2 ---
  if (r2) {
    const ext = EXT[mime] ?? "bin";
    const key = `${R2_FOLDER}${id}.${ext}`;
    await r2.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: mime },
    });
    return NextResponse.json({ url: `${R2_PUBLIC_URL}/${key}` });
  }

  // --- Respaldo: D1 (base64) ---
  if (file.size > MAX_BYTES_D1) {
    return NextResponse.json(
      { error: "Imagen muy grande: usa una de máximo 1.2 MB" },
      { status: 413 },
    );
  }
  const datos = toBase64(await file.arrayBuffer());
  await runParams(
    "INSERT INTO imagenes (id, mime, datos) VALUES (?1, ?2, ?3);",
    [id, mime, datos],
  );
  return NextResponse.json({ url: `/api/img/${id}` });
}
