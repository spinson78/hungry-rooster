import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pin = searchParams.get("pin")?.trim();
  if (!pin) return NextResponse.json({ found: false });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("school_accounts")
    .select("id, student_name, grade_class, balance, status")
    .eq("student_pin", pin)
    .maybeSingle();

  if (!data) return NextResponse.json({ found: false });
  return NextResponse.json({ found: true, account: data });
}
