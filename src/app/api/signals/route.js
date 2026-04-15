import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const signals = await prisma.signal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ signals });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    instrument, direction, entryPrice, targetPrice, stopLoss,
    confidence, bias, notes, aiSummary, riskReward, validFor,
    keySupport, keyResist,
  } = body;

  if (!instrument || !direction || !entryPrice) {
    return NextResponse.json({ error: "instrument, direction and entryPrice are required" }, { status: 400 });
  }

  const signal = await prisma.signal.create({
    data: {
      userId: session.user.id,
      instrument,
      direction,
      entryPrice: parseFloat(entryPrice),
      targetPrice: targetPrice ? parseFloat(targetPrice) : null,
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      confidence: parseInt(confidence) || 5,
      bias: bias || null,
      notes: notes || null,
      aiSummary: aiSummary || null,
      riskReward: riskReward || null,
      validFor: validFor || null,
      keySupport: keySupport ? parseFloat(keySupport) : null,
      keyResist: keyResist ? parseFloat(keyResist) : null,
    },
  });

  return NextResponse.json({ signal }, { status: 201 });
}
