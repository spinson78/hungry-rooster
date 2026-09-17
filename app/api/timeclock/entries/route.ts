import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET — all entries with employee name, optional ?employee_id= and ?since= (admin)
export async function GET(req: NextRequest) {
  const employeeId = req.nextUrl.searchParams.get("employee_id");
  const since = req.nextUrl.searchParams.get("since"); // ISO date string

  let query = supabase
    .from("time_entries")
    .select("id, employee_id, clock_in, clock_out, notes, employees(name)")
    .order("clock_in", { ascending: false })
    .limit(200);

  if (employeeId) query = query.eq("employee_id", employeeId);
  if (since) query = query.gte("clock_in", since);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
