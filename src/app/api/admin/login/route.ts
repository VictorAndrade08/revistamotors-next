import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_USER,
  ADMIN_PASS,
  ADMIN_SECRET,
  ADMIN_COOKIE,
} from "@/lib/admin-config";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { user, pass } = await req.json();
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    const c = await cookies();
    c.set(ADMIN_COOKIE, ADMIN_SECRET, {
      httpOnly: true,
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
