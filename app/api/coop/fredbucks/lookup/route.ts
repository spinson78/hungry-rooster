import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ref_code = searchParams.get("ref_code")?.toUpperCase().trim();
  if (!ref_code) return NextResponse.json({ error: "ref_code required" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: purchase } = await supabase
    .from("fred_bucks_purchases")
    .select("id, teacher_name, coupons_total, coupons_redeemed")
    .eq("ref_code", ref_code)
    .maybeSingle();

  if (!purchase) return NextResponse.json({ error: "Code not found — check the code on your coupon sheet." }, { status: 404 });

  const remaining = purchase.coupons_total - purchase.coupons_redeemed;
  return NextResponse.json({
    id: purchase.id,
    teacher_name: purchase.teacher_name,
    coupons_total: purchase.coupons_total,
    coupons_redeemed: purchase.coupons_redeemed,
    remaining,
  });
}
