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
    customer_name, customer_email, customer_phone,
    customer_address, special_requests, fulfillment_type,
    items, subtotal, tax, delivery_fee, delivery_distance_miles,
    tip, gift_discount, gift_code, sms_opted_in,
    scheduled_for,
  } = body;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";
  const orderNum = `THR-${Date.now().toString().slice(-6)}`;

  // 1. Pre-save order to DB so full item detail is persisted before Stripe redirect
  const { data: orderData, error: dbError } = await supabase.from("orders").insert({
    order_number: orderNum,
    order_type: "menu",
    customer_name,
    customer_email: customer_email || "",
    customer_phone: customer_phone || "",
    customer_address: customer_address || "Pickup",
    special_requests: special_requests || "",
    items,
    subtotal,
    tax_amount: tax,
    delivery_fee: delivery_fee || 0,
    delivery_distance_miles: delivery_distance_miles || 0,
    tip_amount: tip || 0,
    total: Math.max(0, subtotal + tax + (delivery_fee || 0) + (tip || 0) - (gift_discount || 0)),
    sms_opted_in: sms_opted_in || false,
    fulfillment_type: fulfillment_type || "pickup",
    scheduled_for: scheduled_for || null,
    status: "pending_payment",
    stripe_session_id: "",
  }).select().single();

  if (dbError || !orderData) {
    console.error("DB insert error:", dbError);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  // 2. Build Stripe line items
  type LineItem = { price_data: { currency: string; product_data: { name: string; description?: string }; unit_amount: number }; quantity: number };
  const lineItems: LineItem[] = items.map((item: { name: string; qty: number; unit_price: number; size?: string; mods?: string; addons?: string[] }) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.qty > 1 ? `${item.qty}x ${item.name}` : item.name,
        description: [item.size, item.mods, ...(item.addons || [])].filter(Boolean).join(" · ") || undefined,
      },
      unit_amount: Math.round(item.unit_price * 100),
    },
    quantity: item.qty,
  }));

  lineItems.push({
    price_data: { currency: "usd", product_data: { name: "Sales Tax (8.25%)" }, unit_amount: Math.round(tax * 100) },
    quantity: 1,
  });

  if ((delivery_fee || 0) > 0) {
    lineItems.push({
      price_data: { currency: "usd", product_data: { name: "Delivery Fee" }, unit_amount: Math.round(delivery_fee * 100) },
      quantity: 1,
    });
  }

  if ((tip || 0) > 0) {
    lineItems.push({
      price_data: { currency: "usd", product_data: { name: "Driver Tip", description: "100% goes to your driver" }, unit_amount: Math.round(tip * 100) },
      quantity: 1,
    });
  }

  // 3. Gift card → Stripe coupon
  const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
  if ((gift_discount || 0) > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: Math.round(gift_discount * 100),
      currency: "usd",
      duration: "once",
      name: `Gift Card${gift_code ? ` (${gift_code})` : ""}`,
    });
    discounts.push({ coupon: coupon.id });
  }

  // 4. Stripe session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    ...(discounts.length > 0 ? { discounts } : {}),
    mode: "payment",
    customer_email: customer_email || undefined,
    success_url: `${baseUrl}/menu/success?order_id=${orderData.id}`,
    cancel_url: `${baseUrl}/menu`,
    metadata: {
      order_type: "menu",
      order_id: String(orderData.id),
      order_number: orderNum,
      customer_name,
      customer_phone: customer_phone || "",
      gift_code: gift_code || "",
      gift_discount: String(gift_discount || 0),
      sms_opted_in: String(sms_opted_in || false),
    },
    custom_text: { submit: { message: "Fred's on it. Your order will be confirmed by text." } },
  });

  // 5. Store session ID on the pre-saved order
  await supabase.from("orders").update({ stripe_session_id: session.id }).eq("id", orderData.id);

  return NextResponse.json({ url: session.url });
}
