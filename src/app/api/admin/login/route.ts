import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, computeAdminToken, isValidAdminPassword } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  const { password } = (await request.json()) as { password?: string };

  if (!password || !(await isValidAdminPassword(password))) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const token = await computeAdminToken();
  if (!token) {
    return NextResponse.json(
      { error: "El dashboard no está configurado (faltan env vars)" },
      { status: 503 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
