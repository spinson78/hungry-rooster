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
    .from("yom_kippur_orders")
    .select("*")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (existing && existing.status === "confirmed") return NextResponse.json({ order: existing });

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
  }

  const m = session.metadata ?? {};

  const { data: order, error } = await supabase
    .from("yom_kippur_orders")
    .update({ status: "confirmed" })
    .eq("stripe_session_id", sessionId)
    .select()
    .single();

  if (error || !order) {
    // Fallback: insert if missing (edge case)
    const { data: inserted } = await supabase
      .from("yom_kippur_orders")
      .insert({
        order_number: m.order_number,
        customer_name: m.customer_name,
        customer_email: session.customer_email || "",
        customer_phone: m.customer_phone,
        customer_address: m.customer_address,
        package: "break_fast_box",
        addons: [],
        subtotal: parseFloat(m.subtotal || "0"),
        tax_amount: parseFloat(m.tax_amount || "0"),
        tip_amount: parseFloat(m.tip_amount || "0"),
        total: (session.amount_total || 0) / 100,
        fulfillment_type: "delivery",
        special_requests: m.special_requests || "",
        stripe_session_id: sessionId,
        status: "confirmed",
      })
      .select()
      .single();
    if (!inserted) return NextResponse.json({ error: "Failed to record order" }, { status: 500 });

    await sendAdminEmail(inserted, m);
    return NextResponse.json({ order: inserted });
  }

  await sendAdminEmail(order, m);
  return NextResponse.json({ order });
}

async function sendAdminEmail(order: Record<string, unknown>, m: Record<string, string>) {
  if (!process.env.RESEND_API_KEY) return;
  const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://www.thehungryroostertx.com";
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "The Hungry Rooster <sales@thehungryroostertx.com>",
      to: ["sales@thehungryroostertx.com"],
      subject: `🕍 New Break Fast Order — ${m.customer_name} · ${m.quantity} box${parseInt(m.quantity || "1") > 1 ? "es" : ""}`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#eab308;">🕍 New Yom Kippur Break Fast Order</h2>
        <p><strong>Order #:</strong> ${order.order_number}</p>
        <p><strong>Name:</strong> ${m.customer_name}</p>
        <p><strong>Phone:</strong> ${m.customer_phone}</p>
        <p><strong>Delivery Address:</strong> ${m.customer_address}</p>
        <p><strong>Quantity:</strong> ${m.quantity} Break Fast Box${parseInt(m.quantity || "1") > 1 ? "es" : ""}</p>
        <p><strong>Delivery:</strong> Sunday, September 20 (evening)</p>
        ${m.special_requests ? `<p><strong>Special Requests:</strong> ${m.special_requests}</p>` : ""}
        <p><strong>Total:</strong> $${(order.total as number).toFixed(2)}</p>
        <p><a href="${BASE}/admin">View in Admin →</a></p>
      </div>`,
    }),
  }).catch(e => console.error("YK notify email failed:", e));
}
