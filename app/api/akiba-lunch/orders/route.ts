import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { data: orders } = await supabase
    .from("akiba_lunch_orders")
    .select("*")
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  return NextResponse.json({ orders: orders || [] });
}

export async function POST(req: Request) {
  const { id, action } = await req.json();
  if (!id || !action) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  if (action === "archive") {
    await supabase.from("akiba_lunch_orders").update({ status: "archived" }).eq("id", id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
