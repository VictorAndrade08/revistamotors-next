import { queryParams } from "@/lib/d1";

export const runtime = "edge";

// Sirve las imágenes subidas desde el admin (guardadas en D1).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const rows = await queryParams<{ mime: string; datos: string }>(
    "SELECT mime, datos FROM imagenes WHERE id = ?1 LIMIT 1;",
    [id],
  );
  if (!rows.length) return new Response("No existe", { status: 404 });
  const bin = atob(rows[0].datos);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Response(bytes, {
    headers: {
      "Content-Type": rows[0].mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
