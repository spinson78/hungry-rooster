import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: orders } = await supabase
    .from("coopchallah_orders")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const { data: installments } = await supabase
    .from("coopchallah_installments")
    .select("*")
    .order("due_date", { ascending: true });

  return NextResponse.json({ orders: orders || [], installments: installments || [] });
}
