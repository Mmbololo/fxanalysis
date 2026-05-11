import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const PACKAGES = {
  daily:   { name: "24-Hour Pass",   amountKES: 500,  days: 1  },
  weekly:  { name: "Weekly Pro",     amountKES: 2500, days: 7  },
  monthly: { name: "Monthly Elite",  amountKES: 8000, days: 30 },
};

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packageId } = await req.json();
    const pkg = PACKAGES[packageId];
    if (!pkg) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const reference = `TI-${session.user.id.slice(-6)}-${Date.now()}`;
    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/paystack/verify?ref=${reference}&pkg=${packageId}`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: pkg.amountKES * 100, // Paystack uses kobo/smallest unit
        currency: "KES",
        reference,
        callback_url: callbackUrl,
        metadata: {
          userId: session.user.id,
          packageId,
          packageName: pkg.name,
          custom_fields: [
            { display_name: "Package", variable_name: "package", value: pkg.name },
          ],
        },
      }),
    });

    const data = await res.json();

    if (!data.status || !data.data?.authorization_url) {
      console.error("[paystack] Init failed:", data);
      return NextResponse.json({ error: data.message || "Payment initiation failed" }, { status: 502 });
    }

    // Store a pending payment record
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount: pkg.amountKES,
        pesapalTxId: reference, // reuse field for reference
        status: "PENDING",
      },
    });

    return NextResponse.json({ redirectUrl: data.data.authorization_url });
  } catch (err) {
    console.error("[paystack/initiate]", err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
