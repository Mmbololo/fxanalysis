import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.signal.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = {};

  if (body.status) data.status = body.status;
  if (body.exitPrice !== undefined) data.exitPrice = parseFloat(body.exitPrice);
  if (body.notes !== undefined) data.notes = body.notes;

  if (body.status === "CLOSED" || body.status === "CANCELLED") {
    data.closedAt = new Date();
    if (body.exitPrice !== undefined) data.exitPrice = parseFloat(body.exitPrice);
  }

  const signal = await prisma.signal.update({ where: { id }, data });
  return NextResponse.json({ signal });
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.signal.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.signal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
