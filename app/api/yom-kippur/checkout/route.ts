import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TAX_RATE = 0.0825;
const BOX_PRICE = 100; // per box
const CUTOFF = new Date("2026-09-20T15:00:00Z"); // Sep 20 @ 10 AM CDT

function isOrderingOpen(): boolean {
  return new Date() < CUTOFF;
}

export async function POST(req: NextRequest) {
  if (!isOrderingOpen()) {
    return NextResponse.json(
      { error: "Break Fast ordering is now closed. Orders were due September 20 at 10 AM." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const {
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
    quantity,
    special_requests,
    tip,
  } = body;

  if (!customer_name || !customer_phone || !customer_address || !quantity) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const qty = parseInt(quantity) || 1;
  const subtotal = BOX_PRICE * qty;
  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
  const tipAmount = tip || 0;
  const total = subtotal + taxAmount + tipAmount;
  const orderNum = `YK-${Date.now().toString().slice(-6)}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.thehungryroostertx.com";

  // Pre-save to DB
  const { data: orderData, error: dbError } = await supabase
    .from("yom_kippur_orders")
    .insert({
      order_number: orderNum,
      customer_name,
      customer_email: customer_email || "",
      customer_phone,
      customer_address,
      package: "break_fast_box",
      addons: [],
      subtotal,
      tax_amount: taxAmount,
      tip_amount: tipAmount,
      total,
      fulfillment_type: "delivery",
      special_requests: special_requests || "",
      stripe_session_id: "",
      status: "pending_payment",
    })
    .select()
    .single();

  if (dbError || !orderData) {
    console.error("YK DB insert error:", dbError);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  const lineItems = [
    {
      price_data: {
        currency: "usd",
        product_data: {
          name: `Yom Kippur Break Fast Box${qty > 1 ? ` × ${qty}` : ""}`,
          description: "6 Bagels · Tuna Salad · Egg Salad · Salmon Salad · Caesar Salad · Coffee Cake · Delivery included · Serves 4–6",
        },
        unit_amount: BOX_PRICE * 100,
      },
      quantity: qty,
    },
    {
      price_data: {
        currency: "usd",
        product_data: { name: "Sales Tax (8.25%)" },
        unit_amount: Math.round(taxAmount * 100),
      },
      quantity: 1,
    },
  ];

  if (tipAmount > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Tip — Thank you!" },
        unit_amount: Math.round(tipAmount * 100),
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    customer_email: customer_email || undefined,
    success_url: `${baseUrl}/yom-kippur/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/yom-kippur`,
    metadata: {
      order_type: "yom_kippur",
      order_id: String(orderData.id),
      order_number: orderNum,
      customer_name,
      customer_phone,
      customer_address,
      quantity: String(qty),
      subtotal: String(subtotal),
      tax_amount: String(taxAmount),
      tip_amount: String(tipAmount),
      special_requests: special_requests || "",
    },
  });

  await supabase.from("yom_kippur_orders").update({ stripe_session_id: session.id }).eq("id", orderData.id);

  return NextResponse.json({ url: session.url });
}
