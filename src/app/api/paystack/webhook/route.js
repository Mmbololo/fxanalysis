import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import prisma from "@/lib/prisma";

const PACKAGES = {
  daily:   { name: "24-Hour Pass",  days: 1  },
  weekly:  { name: "Weekly Pro",    days: 7  },
  monthly: { name: "Monthly Elite", days: 30 },
};

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get("x-paystack-signature");

  // Verify HMAC signature
  const expected = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
    .update(body)
    .digest("hex");

  if (sig !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event;
  try { event = JSON.parse(body); } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  if (event.event === "charge.success") {
    const { reference, amount, metadata } = event.data;
    const userId = metadata?.userId;
    const packageId = metadata?.packageId || "weekly";
    const pkg = PACKAGES[packageId] || PACKAGES.weekly;

    if (!userId) return NextResponse.json({ ok: true }); // no userId, skip

    try {
      const plan = await prisma.plan.upsert({
        where: { id: packageId },
        update: { name: pkg.name, price: amount / 100 },
        create: { id: packageId, name: pkg.name, durationDiv: packageId.toUpperCase(), price: amount / 100 },
      });

      const now = new Date();
      const endDate = new Date(now.getTime() + pkg.days * 86400 * 1000);

      await prisma.subscription.updateMany({
        where: { userId, status: "ACTIVE" },
        data: { status: "EXPIRED" },
      });

      await prisma.subscription.create({
        data: { userId, planId: plan.id, status: "ACTIVE", startDate: now, endDate },
      });

      await prisma.payment.updateMany({
        where: { pesapalTxId: reference },
        data: { status: "COMPLETED" },
      });

      console.log(`[webhook] Subscription activated: ${userId} → ${pkg.name}`);
    } catch (err) {
      console.error("[webhook] Error:", err.message);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
