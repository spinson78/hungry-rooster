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
    person_name: meta.person_name,
    special_requests: meta.special_requests,
    location_id: meta.location_id,
    location_slug: meta.location_slug,
    location_name: meta.location_name,
    delivery_date: meta.delivery_date,
    items: JSON.parse(meta.items),
    total: (session.amount_total || 0) / 100,
  });
}
