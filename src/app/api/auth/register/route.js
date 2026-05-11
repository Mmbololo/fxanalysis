import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

const BASE = process.env.NEXTAUTH_URL || "https://tradeintel.live";

export async function POST(req) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "An account with this email already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const emailVerifyToken = crypto.randomBytes(32).toString("hex");
    const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.create({
      data: {
        email,
        name: name?.trim() || null,
        passwordHash,
        emailVerifyToken,
        emailVerifyExpiry,
        emailVerified: false,
      },
    });

    const verifyUrl = `${BASE}/api/auth/verify-email?token=${emailVerifyToken}`;
    try {
      await sendVerificationEmail({
        to: email,
        name: name?.trim() || email.split("@")[0],
        verifyUrl,
      });
    } catch (err) {
      console.error("[email] Verification email failed:", err.message);
      // Account is created but email failed — still succeed so user can use resend
    }

    return NextResponse.json(
      { message: "Account created. Please check your email to verify your account.", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[register]", error.message);
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
