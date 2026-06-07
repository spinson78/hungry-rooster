import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { customer_name, customer_phone, customer_address, items, subtotal, tax, tip, total, special_requests, fulfillment_type } = await req.json();

  if (!customer_name || !items || items.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Generate a short readable order number
  const orderNum = `THR-${Date.now().toString().slice(-5)}`;

  const { data, error } = await supabase.from("orders").insert({
    order_number: orderNum,
    customer_name,
    customer_phone: customer_phone || "",
    customer_email: "",
    customer_address: customer_address || "Pickup",
    items,
    subtotal: subtotal || 0,
    tax_amount: tax || 0,
    tip_amount: tip || 0,
    total,
    special_requests: special_requests || "",
    fulfillment_type: fulfillment_type || "pickup",
    order_type: "menu",
    status: "pending",
    stripe_session_id: "",
  }).select().single();

  if (error) {
    console.error("Order insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, order_id: data.id, order_number: orderNum });
}
