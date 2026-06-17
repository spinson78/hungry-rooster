import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const TAX_RATE = 0.0825;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { metadata, dinnerLabel, price, tipAmount, quantity = 1 } = body;
  const unitAmount = price ? Math.round(price * 100) : 8500;
  const taxAmount = Math.round(unitAmount * quantity * TAX_RATE);
  const tipCents = tipAmount ? Math.round(tipAmount * 100) : 0;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: "usd",
        product_data: {
          name: "The Dinner Drop",
          description: dinnerLabel,
        },
        unit_amount: unitAmount,
      },
      quantity,
    },
    {
      price_data: {
        currency: "usd",
        product_data: { name: "Sales Tax (8.25%)", description: "Texas state & local sales tax" },
        unit_amount: taxAmount,
      },
      quantity: 1,
    },
  ];

  if (tipCents > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Driver Tip", description: "Thank you! 100% goes to your driver." },
        unit_amount: tipCents,
      },
      quantity: 1,
    });
  }

  const subtotalCents = unitAmount * quantity;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${baseUrl}/dinner/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/dinner`,
    metadata: {
      ...metadata,
      quantity: String(quantity),
      subtotal:   (subtotalCents / 100).toFixed(2),
      tax_amount: (taxAmount / 100).toFixed(2),
      tip_amount: (tipCents / 100).toFixed(2),
    },
    custom_text: {
      submit: { message: "Fred is on it. We'll confirm delivery by text." },
    },
  });

  return NextResponse.json({ url: session.url });
}
