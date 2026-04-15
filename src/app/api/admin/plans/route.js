import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

export async function POST(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, durationDiv, price, description } = await req.json();
  if (!name || !durationDiv || !price) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const plan = await prisma.plan.create({
    data: { name, durationDiv, price: parseFloat(price), description: description || null },
  });
  return NextResponse.json({ ok: true, plan }, { status: 201 });
}
