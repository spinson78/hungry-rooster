import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const TAX_RATE = 0.0825;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lineItems, metadata, tipAmount } = body;

  const subtotalCents = (lineItems as { price_data: { unit_amount: number }; quantity: number }[])
    .reduce((sum: number, item: { price_data: { unit_amount: number }; quantity: number }) =>
      sum + item.price_data.unit_amount * item.quantity, 0);

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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: allLineItems,
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
