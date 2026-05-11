import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

const BASE = process.env.NEXTAUTH_URL || "https://tradeintel.live";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user || user.emailVerified) {
      return NextResponse.json({ ok: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: token, emailVerifyExpiry: expiry },
    });

    const verifyUrl = `${BASE}/api/auth/verify-email?token=${token}`;
    await sendVerificationEmail({
      to: user.email,
      name: user.name || user.email.split("@")[0],
      verifyUrl,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[resend-verification] Error:", err.message, err.stack);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
