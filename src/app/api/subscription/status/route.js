import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ active: false });
  }

  const now = new Date();
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
      endDate: { gt: now },
    },
    include: { plan: true },
  });

  return NextResponse.json({
    active: !!subscription,
    plan: subscription?.plan?.name ?? null,
    endDate: subscription?.endDate ?? null,
  });
}
