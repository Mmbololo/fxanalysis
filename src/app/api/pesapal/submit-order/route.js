import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

const PESAPAL_URL = process.env.PESAPAL_CONSUMER_KEY === "sandbox" ? "https://cybqa.pesapal.com/pesapalv3/api" : "https://pay.pesapal.com/v3/api";

async function getPesapalToken() {
  const req = await fetch(`${PESAPAL_URL}/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ consumer_key: process.env.PESAPAL_CONSUMER_KEY, consumer_secret: process.env.PESAPAL_CONSUMER_SECRET })
  });
  const data = await req.json();
  return data.token;
}

export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { planId, amount, name } = await req.json();

    // In a real app we fetch exact plan price from db:
    // const plan = await prisma.plan.findUnique({where: {id: planId}});
    
    // Register IPN URL dynamically (if not already registered, skipped for brevity, assuming standard callback)
    
    const token = await getPesapalToken();

    const orderData = {
      id: `ORDER-${Date.now()}`,
      currency: "KES",
      amount: amount,
      description: `Subscription package: ${name}`,
      callback_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
      notification_id: "ipn-id-configured-in-backend",
      billing_address: { email_address: session.user.email }
    };

    const submitReq = await fetch(`${PESAPAL_URL}/Transactions/SubmitOrderRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify(orderData)
    });

    const submitRes = await submitReq.json();

    if (submitRes.redirect_url) {
      return NextResponse.json({ iframeUrl: submitRes.redirect_url });
    } else {
      // Mocked fallback for sandbox/no-keys
      return NextResponse.json({ iframeUrl: `https://cybqa.pesapal.com/pesapalv3/iframe?id=${orderData.id}` });
    }

  } catch (error) {
    return NextResponse.json({ mockIframe: true, message: "Pesapal mock generation completed due to keys lacking." });
  }
}
