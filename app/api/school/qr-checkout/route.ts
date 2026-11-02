import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { amount_cents, description } = await req.json();

  if (!amount_cents || amount_cents < 50) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `THE COOP — ${description}` },
          unit_amount: amount_cents,
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/school/pos/paid?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/school/pos`,
    metadata: { source: "coop_qr_kiosk", description },
  });

  return NextResponse.json({ session_id: session.id, url: session.url });
}
