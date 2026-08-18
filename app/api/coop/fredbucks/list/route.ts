import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: purchases } = await supabase
    .from("fred_bucks_purchases")
    .select("id, teacher_name, teacher_email, school_name, amount_paid, coupons_total, coupons_redeemed, ref_code, created_at")
    .order("created_at", { ascending: false });

  return NextResponse.json({ purchases: purchases || [] });
}
