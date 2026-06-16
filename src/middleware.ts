import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, ADMIN_SECRET } from "@/lib/admin-config";
import { verifyToken } from "@/lib/session";

// Protege /admin y /api/admin (excepto el login).
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLogin =
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/api/admin/login");
  if (isLogin) return NextResponse.next();

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!(await verifyToken(token, ADMIN_SECRET))) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
