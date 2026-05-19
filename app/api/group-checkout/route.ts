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
  try {
    const body = await req.json();
    const { items, personName, customerEmail, specialRequests, locationId, locationSlug, locationName, deliveryDate, tipAmount } = body;

    const subtotalCents = items.reduce(
      (s: number, i: { price: number; qty: number }) => s + Math.round(i.price * 100) * i.qty, 0
    );
    const taxCents = Math.round(subtotalCents * TAX_RATE);
    const tipCents = tipAmount ? Math.round(tipAmount * 100) : 0;

    const lineItems = [
      ...items.map((item: { name: string; price: number; qty: number; description: string }) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.name, description: item.description },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.qty,
      })),
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
      lineItems.push({
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
      line_items: lineItems,
      mode: "payment",
      customer_email: customerEmail || undefined,
      success_url: `${baseUrl}/group/${locationSlug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/group/${locationSlug}`,
      metadata: {
        order_type: "group_order",
        person_name: personName,
        location_slug: locationSlug,
        location_name: locationName,
        delivery_date: deliveryDate,
      },
      custom_text: {
        submit: { message: `Ordering for ${locationName} - Delivery ${deliveryDate}` },
      },
    });

    const subtotal = items.reduce((s: number, i: { price: number; qty: number }) => s + i.price * i.qty, 0);
    const tip = tipAmount || 0;

    await supabase.from("group_orders").insert({
      location_id: locationId,
      location_slug: locationSlug,
      person_name: personName,
      customer_email: customerEmail || "",
      items,
      total: subtotal + (subtotal * TAX_RATE) + tip,
      special_requests: specialRequests || "",
      delivery_date: deliveryDate,
      status: "pending",
      stripe_session_id: session.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Group checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session. Please try again." }, { status: 500 });
  }
}
