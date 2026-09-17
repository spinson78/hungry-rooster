import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { token, action } = await req.json(); // action: "in" | "out"
  if (!token || !["in", "out"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: emp, error } = await supabase
    .from("employees")
    .select("id, name, is_active")
    .eq("token", token)
    .single();

  if (error || !emp) return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  if (!emp.is_active) return NextResponse.json({ error: "Account inactive" }, { status: 403 });

  const now = new Date().toISOString();

  if (action === "in") {
    // Check for already-open punch
    const { data: existing } = await supabase
      .from("time_entries")
      .select("id")
      .eq("employee_id", emp.id)
      .is("clock_out", null)
      .maybeSingle();

    if (existing) return NextResponse.json({ error: "Already clocked in" }, { status: 409 });

    const { error: insertError } = await supabase
      .from("time_entries")
      .insert({ employee_id: emp.id, clock_in: now });

    if (insertError) return NextResponse.json({ error: "Failed to clock in" }, { status: 500 });
    return NextResponse.json({ success: true, action: "in", time: now });
  }

  // action === "out"
  const { data: openPunch } = await supabase
    .from("time_entries")
    .select("id")
    .eq("employee_id", emp.id)
    .is("clock_out", null)
    .order("clock_in", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!openPunch) return NextResponse.json({ error: "Not clocked in" }, { status: 409 });

  const { error: updateError } = await supabase
    .from("time_entries")
    .update({ clock_out: now })
    .eq("id", openPunch.id);

  if (updateError) return NextResponse.json({ error: "Failed to clock out" }, { status: 500 });
  return NextResponse.json({ success: true, action: "out", time: now });
}
