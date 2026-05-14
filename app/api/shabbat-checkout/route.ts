import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lineItems, metadata } = body;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${baseUrl}/shabbat/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/shabbat`,
    metadata,
    custom_text: {
      submit: { message: "Your Shabbat Box will be delivered Friday. Shabbat Shalom!" },
    },
  });

  return NextResponse.json({ url: session.url });
}
