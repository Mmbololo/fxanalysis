import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

export async function PATCH(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name, durationDiv, price, description } = await req.json();

  const plan = await prisma.plan.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(durationDiv && { durationDiv }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(description !== undefined && { description }),
    },
  });
  return NextResponse.json({ ok: true, plan });
}

export async function DELETE(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.plan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
