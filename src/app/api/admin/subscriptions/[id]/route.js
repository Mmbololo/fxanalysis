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
  const { status, endDate } = await req.json();

  const sub = await prisma.subscription.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(endDate && { endDate: new Date(endDate) }),
    },
  });
  return NextResponse.json({ ok: true, subscription: sub });
}

export async function DELETE(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.subscription.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
