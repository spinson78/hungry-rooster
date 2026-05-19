import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, personName, customerEmail, specialRequests, locationId, locationSlug, locationName, deliveryDate } = body;

    const lineItems = items.map((item: { name: string; price: number; qty: number; description: string }) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name, description: item.description },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty,
    }));

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

    // Store full order in Supabase as "pending" — avoids Stripe metadata size limits
    await supabase.from("group_orders").insert({
      location_id: locationId,
      location_slug: locationSlug,
      person_name: personName,
      customer_email: customerEmail || "",
      items,
      total: items.reduce((s: number, i: { price: number; qty: number }) => s + i.price * i.qty, 0),
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
