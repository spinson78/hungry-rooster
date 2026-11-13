import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TAX_RATE = 0.0825;
// Nov 23 @ midnight CST = Nov 24 T06:00:00Z
const CUTOFF = new Date("2026-11-24T06:00:00Z");

function isOpen() {
  return new Date() < CUTOFF;
}

export async function GET() {
  return NextResponse.json({ open: isOpen(), cutoff: CUTOFF.toISOString() });
}

export async function POST(req: NextRequest) {
  if (!isOpen()) {
    return NextResponse.json(
      { error: "Thanksgiving pre-orders are now closed. Orders were due November 23 at midnight." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { customer_name, customer_email, customer_address, items, special_requests } = body;

  if (!customer_name || !customer_email || !customer_address || !items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  type OrderItem = { name: string; qty: number; unit_price: number; note?: string };
  const orderItems: OrderItem[] = items;

  const subtotal = orderItems.reduce((s: number, i: OrderItem) => s + i.unit_price * i.qty, 0);
  if (subtotal < 50) {
    return NextResponse.json({ error: "Minimum order is $50." }, { status: 400 });
  }

  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = subtotal + taxAmount;
  const orderNum = `TG-${Date.now().toString().slice(-6)}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.thehungryroostertx.com";

  const { data: orderData, error: dbError } = await supabase
    .from("thanksgiving_orders")
    .insert({
      order_number: orderNum,
      customer_name,
      customer_email,
      customer_address,
      items: orderItems,
      subtotal,
      tax_amount: taxAmount,
      total,
      special_requests: special_requests || "",
      stripe_session_id: "",
      status: "pending_payment",
    })
    .select()
    .single();

  if (dbError || !orderData) {
    console.error("Thanksgiving DB insert error:", dbError);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  const lineItems = orderItems.map((i: OrderItem) => ({
    price_data: {
      currency: "usd",
      product_data: { name: i.name, ...(i.note ? { description: i.note } : {}) },
      unit_amount: Math.round(i.unit_price * 100),
    },
    quantity: i.qty,
  }));

  lineItems.push({
    price_data: {
      currency: "usd",
      product_data: { name: "Sales Tax (8.25%)" },
      unit_amount: Math.round(taxAmount * 100),
    },
    quantity: 1,
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    customer_email,
    success_url: `${baseUrl}/thanksgiving/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/thanksgiving`,
    metadata: {
      order_type: "thanksgiving",
      order_id: String(orderData.id),
      order_number: orderNum,
      customer_name,
      customer_email,
      customer_address,
      special_requests: (special_requests || "").slice(0, 490),
      items: JSON.stringify(orderItems).slice(0, 490),
    },
    custom_text: { submit: { message: "Delivered Wednesday, November 26. We'll see you at the table! 🦃" } },
  });

  await supabase.from("thanksgiving_orders").update({ stripe_session_id: session.id }).eq("id", orderData.id);

  return NextResponse.json({ url: session.url });
}
