import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { id, action, table = "orders" } = await req.json();
  if (!id || !action) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const allowedTables = ["orders", "group_orders"];
  if (!allowedTables.includes(table)) return NextResponse.json({ error: "Invalid table" }, { status: 400 });

  if (action === "complete") {
    const { error } = await supabase.from(table).update({ status: "complete" }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === "archive") {
    const { error } = await supabase.from(table).update({ status: "archived" }).eq("id", id).eq("status", "complete");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
