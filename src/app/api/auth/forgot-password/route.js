import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

const BASE = process.env.NEXTAUTH_URL || "https://tradeintel.live";

export async function POST(req) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond OK to prevent email enumeration
  if (!user) return NextResponse.json({ ok: true });

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  const resetUrl = `${BASE}/reset-password?token=${token}`;
  sendPasswordResetEmail({
    to: user.email,
    name: user.name || user.email.split("@")[0],
    resetUrl,
  }).catch(err => console.error("[email] Password reset failed:", err.message));

  return NextResponse.json({ ok: true });
}
