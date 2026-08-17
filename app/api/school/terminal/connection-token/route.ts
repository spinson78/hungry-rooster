import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Stripe Terminal requires a fresh connection token each session
export async function POST() {
  try {
    const connectionToken = await stripe.terminal.connectionTokens.create();
    return NextResponse.json({ secret: connectionToken.secret });
  } catch (err) {
    console.error("Terminal connection token error:", err);
    return NextResponse.json({ error: "Failed to create connection token" }, { status: 500 });
  }
}
