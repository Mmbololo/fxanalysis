import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/verify-email?error=missing", req.url));
  }

  const user = await prisma.user.findUnique({ where: { emailVerifyToken: token } });

  if (!user) {
    return NextResponse.redirect(new URL("/verify-email?error=invalid", req.url));
  }

  if (user.emailVerified) {
    return NextResponse.redirect(new URL("/verify-email?status=already", req.url));
  }

  if (user.emailVerifyExpiry && new Date() > user.emailVerifyExpiry) {
    return NextResponse.redirect(new URL("/verify-email?error=expired", req.url));
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyToken: null, emailVerifyExpiry: null },
  });

  // Send welcome email now that they're verified
  sendWelcomeEmail({ to: user.email, name: user.name || user.email.split("@")[0] })
    .catch(err => console.error("[email] Welcome email failed:", err.message));

  return NextResponse.redirect(new URL("/verify-email?status=success", req.url));
}
