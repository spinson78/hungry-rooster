import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { purchase_id, quantity, note } = await req.json();
  if (!purchase_id || !quantity || quantity < 1) {
    return NextResponse.json({ error: "purchase_id and quantity required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: purchase } = await supabase
    .from("fred_bucks_purchases")
    .select("id, teacher_name, coupons_total, coupons_redeemed")
    .eq("id", purchase_id)
    .single();

  if (!purchase) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });

  const remaining = purchase.coupons_total - purchase.coupons_redeemed;
  if (quantity > remaining) {
    return NextResponse.json({ error: `Only ${remaining} coupon${remaining !== 1 ? "s" : ""} remaining` }, { status: 400 });
  }

  await supabase.from("fred_bucks_redemptions").insert({
    purchase_id,
    teacher_name: purchase.teacher_name,
    quantity,
    value: quantity * 5,
    note: note || null,
  });

  const { data: updated } = await supabase
    .from("fred_bucks_purchases")
    .update({ coupons_redeemed: purchase.coupons_redeemed + quantity })
    .eq("id", purchase_id)
    .select("coupons_total, coupons_redeemed")
    .single();

  return NextResponse.json({
    success: true,
    redeemed: quantity,
    value: quantity * 5,
    coupons_total: updated?.coupons_total,
    coupons_redeemed: updated?.coupons_redeemed,
    remaining: (updated?.coupons_total || 0) - (updated?.coupons_redeemed || 0),
  });
}
