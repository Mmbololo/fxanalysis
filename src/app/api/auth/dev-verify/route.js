import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// One-click manual email verification — use this when Resend isn't configured yet
// GET /api/auth/dev-verify?email=you@example.com
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "email param required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.redirect(new URL("/login?verified=1", req.url));
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyToken: null, emailVerifyExpiry: null },
  });

  return NextResponse.redirect(new URL("/login?verified=1", req.url));
}
