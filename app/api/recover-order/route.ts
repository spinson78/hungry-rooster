import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { session_id } = await req.json();
  if (!session_id) return NextResponse.json({ error: "session_id required" }, { status: 400 });

  // Resolve the Checkout Session — accept cs_live_..., cs_test_..., or pi_... (Payment Intent ID)
  let resolvedSessionId = session_id.trim();
  let session: Stripe.Checkout.Session;

  if (resolvedSessionId.startsWith("pi_")) {
    // Look up checkout session by payment intent ID
    const sessions = await stripe.checkout.sessions.list({ payment_intent: resolvedSessionId, limit: 1 });
    if (!sessions.data.length) {
      return NextResponse.json({ error: "No checkout session found for that Payment Intent ID" }, { status: 404 });
    }
    session = sessions.data[0];
    resolvedSessionId = session.id;
  } else {
    try {
      session = await stripe.checkout.sessions.retrieve(resolvedSessionId);
    } catch {
      return NextResponse.json({ error: "Stripe session not found" }, { status: 404 });
    }
  }

  // Check if order already exists
  const { data: existing } = await supabase
    .from("orders")
    .select("id, status")
    .eq("stripe_session_id", resolvedSessionId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: `Order already exists in DB (id: ${existing.id}, status: ${existing.status})` }, { status: 409 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Session is not paid" }, { status: 400 });
  }

  const meta = session.metadata ?? {};
  const order_type = meta.order_type || "dinner";
  const total = (session.amount_total || 0) / 100;
  const subtotal = meta.subtotal ? parseFloat(meta.subtotal) : total;
  const taxAmount = meta.tax_amount ? parseFloat(meta.tax_amount) : 0;
  const tipAmount = meta.tip_amount ? parseFloat(meta.tip_amount) : 0;

  let items: unknown[] = [];
  try { items = JSON.parse(meta.items || "[]"); } catch { items = []; }

  const orderNum = `THR-RECOVERED-${Date.now().toString().slice(-6)}`;

  const { data: inserted, error } = await supabase.from("orders").insert({
    order_number:     orderNum,
    order_type,
    menu_id:          meta.menu_id || null,
    customer_name:    meta.customer_name || "",
    customer_email:   meta.customer_email || "",
    customer_phone:   meta.customer_phone || "",
    customer_address: meta.customer_address || "",
    special_requests: meta.special_requests || "",
    items,
    subtotal,
    tax_amount:       taxAmount,
    tip_amount:       tipAmount,
    total,
    fulfillment_type: order_type === "dinner" ? "delivery" : "pickup",
    status:           "complete",   // already fulfilled
    stripe_session_id: resolvedSessionId,
    sms_opted_in:     meta.sms_opted_in === "true",
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    order: {
      id:            inserted.id,
      order_number:  inserted.order_number,
      customer_name: inserted.customer_name,
      order_type:    inserted.order_type,
      total:         inserted.total,
      status:        inserted.status,
    },
  });
}
