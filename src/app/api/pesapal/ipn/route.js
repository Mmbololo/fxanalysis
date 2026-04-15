import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const PESAPAL_URL = process.env.PESAPAL_CONSUMER_KEY === "sandbox" ? "https://cybqa.pesapal.com/pesapalv3/api" : "https://pay.pesapal.com/v3/api";

export async function GET(req) {
  const url = new URL(req.url);
  const orderTrackingId = url.searchParams.get("OrderTrackingId");
  const orderMerchantReference = url.searchParams.get("OrderMerchantReference");
  
  if (!orderTrackingId) return NextResponse.json({ error: "Missing tracking ID" }, { status: 400 });

  try {
    // 1. Get Auth Token
    const authReq = await fetch(`${PESAPAL_URL}/Auth/RequestToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ consumer_key: process.env.PESAPAL_CONSUMER_KEY, consumer_secret: process.env.PESAPAL_CONSUMER_SECRET })
    });
    const authData = await authReq.json();

    // 2. Query Transaction Status
    const statusReq = await fetch(`${PESAPAL_URL}/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${authData.token}`, "Accept": "application/json" }
    });
    const statusData = await statusReq.json();

    if (statusData.payment_status_description === "Completed") {
      // Create payment record and update subscription
      // Note: Ideally find user via standard mechanism
      // const user = await find user by merchant ref;
      // await prisma.subscription.create({...})
      console.log("PAYMENT COMPLETED: ", orderTrackingId);
    }

    return NextResponse.json({ status: 200, message: "IPN Received and Processed" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process IPN" }, { status: 500 });
  }
}
