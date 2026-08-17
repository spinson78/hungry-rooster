import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Records any POS transaction: account tab, card sale, or cash sale
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { payment_type, account_id, items, total, cash_received } = body;

  if (!payment_type || !items || !total) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const description = items.map((i: { name: string; qty: number }) => `${i.qty}× ${i.name}`).join(", ");

  if (payment_type === "account") {
    if (!account_id) return NextResponse.json({ error: "account_id required" }, { status: 400 });

    // Verify account is active
    const { data: acct } = await supabase
      .from("school_accounts")
      .select("id, status, student_name, balance")
      .eq("id", account_id)
      .single();

    if (!acct) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    if (acct.status === "frozen")
      return NextResponse.json({ error: "Account is frozen — see admin" }, { status: 403 });
    if (acct.status === "pending_setup")
      return NextResponse.json({ error: "Account setup is not complete" }, { status: 403 });

    // Insert transaction
    await supabase.from("school_transactions").insert({
      account_id,
      type: "purchase",
      amount: total,
      description,
      items,
    });

    // Increment balance
    const newBalance = (Number(acct.balance) || 0) + total;
    await supabase
      .from("school_accounts")
      .update({ balance: newBalance })
      .eq("id", account_id);

    return NextResponse.json({ success: true, new_balance: newBalance, student_name: acct.student_name });
  }

  if (payment_type === "cash") {
    await supabase.from("school_transactions").insert({
      account_id: null,
      type: "cash_sale",
      amount: total,
      description,
      items,
    });
    const change = cash_received ? Math.max(0, cash_received - total) : 0;
    return NextResponse.json({ success: true, change });
  }

  if (payment_type === "card") {
    // Card payment via Stripe Terminal — PaymentIntent was already confirmed by the Terminal SDK.
    // This endpoint just records the transaction for reporting.
    const { stripe_payment_intent_id } = body;
    await supabase.from("school_transactions").insert({
      account_id: null,
      type: "card_sale",
      amount: total,
      description,
      items,
      stripe_payment_intent_id: stripe_payment_intent_id || null,
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid payment_type" }, { status: 400 });
}
