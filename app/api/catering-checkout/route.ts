import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    flow_type,           // "package" | "alacarte"
    customer_name, customer_email, customer_phone,
    customer_address,    // full address string or "Pickup"
    special_requests,
    fulfillment_type,    // "pickup" | "delivery"
    items,
    subtotal,
    delivery_fee,
    delivery_distance_miles,
    event_date,
  } = body;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";
  const total = subtotal + (delivery_fee || 0);
  const orderNum = `THR-${Date.now().toString().slice(-6)}`;

  // Pre-save order to DB
  const { data: orderData, error: dbError } = await supabase.from("orders").insert({
    order_number: orderNum,
    order_type: "catering",
    customer_name,
    customer_email: customer_email || "",
    customer_phone: customer_phone || "",
    customer_address: customer_address || (fulfillment_type === "pickup" ? "Pickup" : ""),
    special_requests: `Event: ${event_date}${special_requests ? " · " + special_requests : ""}`,
    items,
    subtotal,
    tax_amount: 0,
    delivery_fee: delivery_fee || 0,
    delivery_distance_miles: delivery_distance_miles || 0,
    tip_amount: 0,
    total,
    sms_opted_in: false,
    fulfillment_type: fulfillment_type || "delivery",
    status: "pending_payment",
    stripe_session_id: "",
  }).select().single();

  if (dbError || !orderData) {
    console.error("Catering DB insert error:", dbError);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  // Build line items
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: {
    name?: string; itemName?: string; qty?: number; price?: number; size?: string; serving?: string; category?: string;
    includes?: string[]; choices?: string[];
  }) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.name || item.itemName || "Catering Item",
        description: [
          item.category,
          item.size,
          item.serving ? `Serves ${item.serving}` : undefined,
          ...(item.includes || []).slice(0, 3),
          ...(item.choices || []),
        ].filter(Boolean).join(" · ") || undefined,
      },
      unit_amount: Math.round((item.price || 0) * 100),
    },
    quantity: item.qty || 1,
  }));

  if ((delivery_fee || 0) > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Delivery Fee" },
        unit_amount: Math.round(delivery_fee * 100),
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    customer_email: customer_email || undefined,
    success_url: `${baseUrl}/catering/success?order_id=${orderData.id}`,
    cancel_url: `${baseUrl}/catering`,
    metadata: {
      order_type: "catering",
      flow_type: flow_type || "package",
      order_id: String(orderData.id),
      order_number: orderNum,
      customer_name,
      customer_phone: customer_phone || "",
    },
    custom_text: { submit: { message: "Fred's crew will confirm by phone within 24 hours." } },
  });

  await supabase.from("orders").update({ stripe_session_id: session.id }).eq("id", orderData.id);

  return NextResponse.json({ url: session.url });
}
