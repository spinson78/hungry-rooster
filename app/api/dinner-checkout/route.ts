import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { metadata, dinnerLabel } = body;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "The Dinner Drop",
            description: dinnerLabel,
          },
          unit_amount: 8500,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${baseUrl}/dinner/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/dinner`,
    metadata,
    custom_text: {
      submit: { message: "Fred is on it. We'll confirm delivery by text." },
    },
  });

  return NextResponse.json({ url: session.url });
}
