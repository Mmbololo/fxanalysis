import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPaymentConfirmationEmail } from "@/lib/email";

const PACKAGES = {
  daily:   { name: "24-Hour Pass",  days: 1  },
  weekly:  { name: "Weekly Pro",    days: 7  },
  monthly: { name: "Monthly Elite", days: 30 },
};

async function activateSubscription(userId, packageId, amount, reference) {
  const pkg = PACKAGES[packageId] || PACKAGES.weekly;

  // Upsert the plan
  const plan = await prisma.plan.upsert({
    where: { id: packageId },
    update: { name: pkg.name, price: amount },
    create: { id: packageId, name: pkg.name, durationDiv: packageId.toUpperCase(), price: amount },
  });

  const now = new Date();
  const endDate = new Date(now.getTime() + pkg.days * 86400 * 1000);

  // Expire any existing active subscription for this user
  await prisma.subscription.updateMany({
    where: { userId, status: "ACTIVE" },
    data: { status: "EXPIRED" },
  });

  await prisma.subscription.create({
    data: { userId, planId: plan.id, status: "ACTIVE", startDate: now, endDate },
  });

  // Mark payment completed
  await prisma.payment.updateMany({
    where: { pesapalTxId: reference },
    data: { status: "COMPLETED" },
  });

  return { plan, endDate };
}

// ── Redirect callback from Paystack ───────────────────────────────────────────
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("ref") || searchParams.get("reference") || searchParams.get("trxref");
  const packageId = searchParams.get("pkg") || "weekly";

  if (!reference) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?payment=failed`);
  }

  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const data = await res.json();

    if (!data.status || data.data?.status !== "success") {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?payment=failed`);
    }

    // Find the payment record to get userId
    const payment = await prisma.payment.findFirst({ where: { pesapalTxId: reference } });
    if (!payment) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?payment=failed`);
    }

    const { plan, endDate } = await activateSubscription(
      payment.userId,
      packageId,
      data.data.amount / 100,
      reference
    );

    // Send confirmation email (non-blocking)
    const user = await prisma.user.findUnique({ where: { id: payment.userId } });
    if (user) {
      sendPaymentConfirmationEmail({
        to: user.email,
        name: user.name || user.email.split("@")[0],
        plan: plan.name,
        amount: payment.amount,
        currency: "KES",
        endDate,
        txId: reference,
      }).catch(err => console.error("[email] Payment confirmation:", err.message));
    }

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?payment=success`);
  } catch (err) {
    console.error("[paystack/verify]", err.message);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?payment=failed`);
  }
}
