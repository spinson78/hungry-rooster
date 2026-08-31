import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const TAX_RATE = 0.0825;

// Cutoff: midnight Sep 9, 2026 CDT (= 05:00 UTC Sep 10)
const CUTOFF = new Date("2026-09-10T05:00:00Z");

export async function POST(req: NextRequest) {
  if (new Date() >= CUTOFF) {
    return NextResponse.json({ error: "Rosh Hashanah ordering is now closed." }, { status: 403 });
  }

  const body = await req.json();
  const { lineItems, metadata, tipAmount } = body;

  if (!lineItems || lineItems.length === 0) {
    return NextResponse.json({ error: "No items in order." }, { status: 400 });
  }

  const subtotalCents = (lineItems as { price_data: { unit_amount: number }; quantity: number }[])
    .reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0);

  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const tipCents = tipAmount ? Math.round(tipAmount * 100) : 0;

  const allLineItems = [
    ...lineItems,
    {
      price_data: {
        currency: "usd",
        product_data: { name: "Sales Tax (8.25%)", description: "Texas state & local sales tax" },
        unit_amount: taxCents,
      },
      quantity: 1,
    },
  ];

  if (tipCents > 0) {
    allLineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Driver Tip", description: "Thank you! 100% goes to your driver." },
        unit_amount: tipCents,
      },
      quantity: 1,
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.thehungryroostertx.com";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: allLineItems,
    mode: "payment",
    success_url: `${baseUrl}/rosh-hashanah/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/rosh-hashanah`,
    customer_email: metadata?.customer_email || undefined,
    metadata: {
      ...metadata,
    },
    custom_text: {
      submit: { message: "Your Rosh Hashanah order will be delivered Friday, September 11. Shana Tova! 🍎🍯" },
    },
  });

  return NextResponse.json({ url: session.url });
}
