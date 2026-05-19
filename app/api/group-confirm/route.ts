import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ success: false });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") return NextResponse.json({ success: false });

    // Pull full order from Supabase — avoids Stripe metadata size limits
    const { data: order } = await supabase
      .from("group_orders")
      .select("*")
      .eq("stripe_session_id", sessionId)
      .single();

    if (!order) return NextResponse.json({ success: false, error: "Order not found" });

    if (order.status === "pending") {
      await supabase.from("group_orders").update({ status: "paid" }).eq("id", order.id);
    }

    return NextResponse.json({
      success: true,
      person_name: order.person_name,
      customer_email: order.customer_email || "",
      special_requests: order.special_requests,
      location_id: order.location_id,
      location_slug: order.location_slug,
      location_name: session.metadata?.location_name || order.location_slug,
      delivery_date: order.delivery_date,
      items: order.items,
      total: order.total,
    });
  } catch (err) {
    console.error("Group confirm error:", err);
    return NextResponse.json({ success: false });
  }
}
