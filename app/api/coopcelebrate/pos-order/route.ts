import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POS-originated celebration order (no Stripe — payment handled by POS)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    order_type, purchaser_name, classroom, kids_name,
    delivery_date, delivery_time, student_count,
    quantity, cupcake_flavor, toppings, special_requests,
    payment_method, total,
  } = body;

  if (!order_type || !purchaser_name || !classroom || !delivery_date || !delivery_time || !payment_method) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("celebration_orders")
    .insert({
      order_type,
      purchaser_name,
      classroom,
      kids_name: kids_name || null,
      delivery_date,
      delivery_time,
      student_count: student_count ? parseInt(student_count) : null,
      quantity: parseInt(quantity || "1"),
      cupcake_flavor: cupcake_flavor || null,
      toppings: toppings || [],
      special_requests: special_requests || null,
      source: "pos",
      payment_method,
      total: total || null,
      status: "confirmed",
    })
    .select()
    .single();

  if (error) {
    console.error("POS celebration order insert error:", JSON.stringify(error));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, order: data });
}
