import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

// PATCH: update role or assign subscription
export async function PATCH(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  if (body.action === "setRole") {
    const user = await prisma.user.update({
      where: { id },
      data: { role: body.role },
    });
    return NextResponse.json({ ok: true, role: user.role });
  }

  if (body.action === "assignSubscription") {
    const { planId, durationDays } = body;
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    // Cancel any existing active subscription
    await prisma.subscription.updateMany({
      where: { userId: id, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (durationDays || 30));

    const sub = await prisma.subscription.create({
      data: { userId: id, planId, status: "ACTIVE", startDate, endDate },
      include: { plan: true },
    });
    return NextResponse.json({ ok: true, subscription: sub });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// DELETE: remove user
export async function DELETE(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (id === session.user.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  await prisma.subscription.deleteMany({ where: { userId: id } });
  await prisma.payment.deleteMany({ where: { userId: id } });
  await prisma.signal.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
