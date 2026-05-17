import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { metadata, dinnerLabel, price } = body;
  const unitAmount = price ? Math.round(price * 100) : 8500;

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
          unit_amount: unitAmount,
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
