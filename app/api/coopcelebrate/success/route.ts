import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  // Idempotent — return existing if already recorded
  const { data: existing } = await supabase
    .from("celebration_orders")
    .select("id, purchaser_name, classroom, delivery_date, delivery_time, order_type, quantity, student_count, cupcake_flavor, toppings, total")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (existing) return NextResponse.json({ order: existing });

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
  }

  const m = session.metadata ?? {};
  const subtotal = parseFloat(m.subtotal || "0");
  const tax_amount = parseFloat(m.tax_amount || "0");
  const total = (session.amount_total || 0) / 100;

  const { data: order, error } = await supabase
    .from("celebration_orders")
    .insert({
      order_type:       m.celebration_type,
      purchaser_name:   m.purchaser_name,
      classroom:        m.classroom,
      kids_name:        m.kids_name || null,
      delivery_date:    m.delivery_date,
      delivery_time:    m.delivery_time,
      student_count:    m.student_count ? parseInt(m.student_count) : null,
      quantity:         parseInt(m.quantity || "1"),
      cupcake_flavor:   m.cupcake_flavor || null,
      toppings:         JSON.parse(m.toppings || "[]"),
      special_requests: m.special_requests || null,
      source:           "online",
      payment_method:   "stripe",
      stripe_session_id: sessionId,
      subtotal,
      tax_amount,
      total,
      status: "confirmed",
    })
    .select()
    .single();

  if (error) {
    console.error("celebration_orders insert error:", JSON.stringify(error));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Admin notification
  const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://www.thehungryroostertx.com";
  const typeLabel = m.celebration_type === "froyo" ? "Frozen Yogurt Party"
    : m.celebration_type === "cupcakes" ? "Cupcake Order"
    : "Coop Celebration Pack";

  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "The Hungry Rooster <sales@thehungryroostertx.com>",
        to: ["sales@thehungryroostertx.com"],
        subject: `🎉 New ${typeLabel} — ${m.purchaser_name} · ${m.delivery_date}`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#eab308;">🎉 New Celebration Order</h2>
          <p><strong>Type:</strong> ${typeLabel}</p>
          <p><strong>Purchaser:</strong> ${m.purchaser_name}</p>
          <p><strong>Classroom:</strong> ${m.classroom}</p>
          ${m.kids_name ? `<p><strong>Kid's Name:</strong> ${m.kids_name}</p>` : ""}
          <p><strong>Delivery:</strong> ${m.delivery_date} at ${m.delivery_time}</p>
          ${m.student_count ? `<p><strong>Students:</strong> ${m.student_count}</p>` : ""}
          ${m.quantity ? `<p><strong>Quantity:</strong> ${m.quantity}</p>` : ""}
          ${m.cupcake_flavor ? `<p><strong>Flavor:</strong> ${m.cupcake_flavor}</p>` : ""}
          ${m.toppings && m.toppings !== "[]" ? `<p><strong>Toppings:</strong> ${JSON.parse(m.toppings).join(", ")}</p>` : ""}
          ${m.special_requests ? `<p><strong>Special Requests:</strong> ${m.special_requests}</p>` : ""}
          <p><strong>Total:</strong> $${total.toFixed(2)}</p>
          <p><a href="${BASE}/admin">View in Admin →</a></p>
        </div>`,
      }),
    }).catch(e => console.error("Celebration notify email failed:", e));
  }

  return NextResponse.json({ order });
}
