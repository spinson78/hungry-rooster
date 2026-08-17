import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Parent portal — look up by email + student PIN
export async function POST(req: NextRequest) {
  const { email, pin } = await req.json();
  if (!email || !pin) return NextResponse.json({ error: "email and pin required" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: account } = await supabase
    .from("school_accounts")
    .select("id, student_name, parent_name, parent_email, grade_class, school_name, billing_preference, balance, status, freeze_reason, created_at")
    .eq("parent_email", email.toLowerCase().trim())
    .eq("student_pin", pin.trim())
    .maybeSingle();

  if (!account) {
    return NextResponse.json({ error: "No account found for that email and student ID combination." }, { status: 404 });
  }

  // Fetch last 50 transactions
  const { data: transactions } = await supabase
    .from("school_transactions")
    .select("id, type, amount, description, items, created_at")
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ account, transactions: transactions || [] });
}

// Admin: get all accounts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("id");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (accountId) {
    const { data: account } = await supabase
      .from("school_accounts")
      .select("*")
      .eq("id", accountId)
      .single();
    const { data: transactions } = await supabase
      .from("school_transactions")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false })
      .limit(100);
    return NextResponse.json({ account, transactions: transactions || [] });
  }

  const { data: accounts } = await supabase
    .from("school_accounts")
    .select("id, student_name, student_pin, grade_class, school_name, parent_name, parent_email, billing_preference, balance, status, created_at")
    .order("student_name", { ascending: true });

  return NextResponse.json({ accounts: accounts || [] });
}
