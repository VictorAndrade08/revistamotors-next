import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_USER,
  ADMIN_PASS,
  ADMIN_SECRET,
  ADMIN_COOKIE,
  adminConfigOk,
} from "@/lib/admin-config";
import { createToken, safeEqual } from "@/lib/session";

export const runtime = "edge";

export async function POST(req: Request) {
  // Fail-closed: sin secretos bien configurados no se permite iniciar sesión.
  if (!adminConfigOk()) {
    return NextResponse.json(
      { error: "El panel no está configurado (faltan ADMIN_PASS/ADMIN_SECRET)" },
      { status: 500 },
    );
  }

  let body: { user?: unknown; pass?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }
  const user = typeof body.user === "string" ? body.user : "";
  const pass = typeof body.pass === "string" ? body.pass : "";

  if (safeEqual(user, ADMIN_USER) && safeEqual(pass, ADMIN_PASS)) {
    const token = await createToken(ADMIN_SECRET);
    const c = await cookies();
    c.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json(
    { error: "Usuario o clave incorrectos" },
    { status: 401 },
  );
}
