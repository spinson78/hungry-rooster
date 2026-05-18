import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ success: false });

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return NextResponse.json({ success: false });

  const meta = session.metadata!;

  return NextResponse.json({
    success: true,
    menu_id: meta.menu_id || null,
    customer_name: meta.customer_name,
    customer_phone: meta.customer_phone,
    customer_email: meta.customer_email,
    customer_address: meta.customer_address,
    special_requests: meta.special_requests,
    items: JSON.parse(meta.items),
    total: (session.amount_total || 0) / 100,
  });
}
