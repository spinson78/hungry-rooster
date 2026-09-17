import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const { data: emp, error } = await supabase
    .from("employees")
    .select("id, name, hourly_rate, is_active")
    .eq("token", token)
    .single();

  if (error || !emp) return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  if (!emp.is_active) return NextResponse.json({ error: "Account inactive" }, { status: 403 });

  // Open punch (clocked in, no clock_out yet)
  const { data: openPunch } = await supabase
    .from("time_entries")
    .select("id, clock_in")
    .eq("employee_id", emp.id)
    .is("clock_out", null)
    .order("clock_in", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Recent completed shifts (last 10)
  const { data: recentShifts } = await supabase
    .from("time_entries")
    .select("id, clock_in, clock_out")
    .eq("employee_id", emp.id)
    .not("clock_out", "is", null)
    .order("clock_in", { ascending: false })
    .limit(10);

  return NextResponse.json({
    employee: { id: emp.id, name: emp.name },
    clocked_in: !!openPunch,
    open_punch: openPunch || null,
    recent_shifts: recentShifts || [],
  });
}
