import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, computeAdminToken } from "@/lib/adminAuth";

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/api/admin/login"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_ADMIN_PATHS.has(pathname)) return NextResponse.next();

  const expectedToken = await computeAdminToken();
  const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!expectedToken || cookieToken !== expectedToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
