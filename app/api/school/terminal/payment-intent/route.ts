import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { amount_cents, description } = await req.json();

  if (!amount_cents || amount_cents < 50) {
    return NextResponse.json({ error: "Minimum charge is $0.50" }, { status: 400 });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount_cents),
      currency: "usd",
      payment_method_types: ["card_present"],
      capture_method: "automatic",
      description: description || "Coffee Shop",
      metadata: { source: "school_pos" },
    });
    return NextResponse.json({ client_secret: paymentIntent.client_secret, id: paymentIntent.id });
  } catch (err) {
    console.error("Terminal PaymentIntent error:", err);
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 });
  }
}
