import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const TAX_RATE = 0.0825;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lineItems, metadata, tipAmount } = body;

  // Server-side cutoff check — prevents orders slipping through after 9 AM
  if (metadata?.menu_id) {
    const { data: menu } = await supabase
      .from("shabbat_menus")
      .select("cutoff_time, is_active, quantity_remaining")
      .eq("id", metadata.menu_id)
      .single();

    if (!menu || !menu.is_active) {
      return NextResponse.json({ error: "This week's Shabbat ordering is closed." }, { status: 403 });
    }
    if (new Date() >= new Date(menu.cutoff_time)) {
      return NextResponse.json({ error: "The ordering cutoff has passed. Orders closed at 9 AM." }, { status: 403 });
    }
    if (menu.quantity_remaining <= 0) {
      return NextResponse.json({ error: "Sorry, this week's Shabbat Box is sold out." }, { status: 403 });
    }
  }

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
    metadata: {
      ...metadata,
      subtotal:   (subtotalCents / 100).toFixed(2),
      tax_amount: (taxCents      / 100).toFixed(2),
      tip_amount: (tipCents      / 100).toFixed(2),
    },
    custom_text: {
      submit: { message: "Your Shabbat Box will be delivered Friday. Shabbat Shalom!" },
    },
  });

  return NextResponse.json({ url: session.url });
}
