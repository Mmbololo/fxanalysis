import { NextResponse } from "next/server";
import { Resend } from "resend";

// GET /api/auth/test-email?to=you@example.com
// Tests Resend directly with minimal payload to diagnose errors
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to");

  if (!to) return NextResponse.json({ error: "?to=email required" }, { status: 400 });

  const key = process.env.RESEND_API_KEY;
  if (!key) return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });

  const resend = new Resend(key);
  const { data, error } = await resend.emails.send({
    from: "TradingIntel <no_reply@tradeintel.live>",
    to,
    subject: "TradingIntel — email test",
    html: "<p>Email test successful. Resend is working.</p>",
  });

  if (error) {
    return NextResponse.json({ ok: false, error, keyPrefix: key.slice(0, 8) }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data?.id, keyPrefix: key.slice(0, 8) });
}
