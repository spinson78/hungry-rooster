import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
      .select("id, status, student_name, balance, billing_preference, stripe_customer_id, stripe_payment_method_id")
      .eq("id", account_id)
      .single();

    if (!acct) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    if (acct.status === "frozen")
      return NextResponse.json({ error: "Account is frozen — see admin" }, { status: 403 });
    if (acct.status === "pending_setup")
      return NextResponse.json({ error: "Account setup is not complete" }, { status: 403 });

    // ── Auto Charge: charge card immediately ──────────────────────────
    if (acct.billing_preference === "auto_charge") {
      if (!acct.stripe_payment_method_id || !acct.stripe_customer_id) {
        return NextResponse.json({ error: "No card on file — account setup may be incomplete" }, { status: 403 });
      }
      try {
        const pi = await stripe.paymentIntents.create({
          amount: Math.round(total * 100),
          currency: "usd",
          customer: acct.stripe_customer_id,
          payment_method: acct.stripe_payment_method_id,
          confirm: true,
          off_session: true,
          description: `COOP — ${acct.student_name}: ${description}`,
          metadata: { account_id: acct.id, student_name: acct.student_name },
        });

        if (pi.status !== "succeeded") {
          throw new Error(`Payment status: ${pi.status}`);
        }

        await supabase.from("school_transactions").insert({
          account_id,
          type: "auto_charge_purchase",
          amount: total,
          description: `${description} [auto-charged ${pi.id}]`,
        });

        return NextResponse.json({ success: true, auto_charged: true, new_balance: Number(acct.balance), student_name: acct.student_name });
      } catch (err) {
        const msg = (err as Error).message || "Card charge failed";
        console.error("Auto-charge purchase failed:", msg);
        // Freeze account on payment failure
        await supabase.from("school_accounts").update({
          status: "frozen",
          freeze_reason: "Card charge failed at POS",
        }).eq("id", account_id);
        return NextResponse.json({ error: `Card declined — account paused. ${msg}` }, { status: 402 });
      }
    }

    // ── Charge on Friday (invoice): add to running tab ─────────────────
    const { error: acctErr } = await supabase.from("school_transactions").insert({
      account_id,
      type: "purchase",
      amount: total,
      description,
    });
    if (acctErr) {
      console.error("school_transactions purchase insert error:", JSON.stringify(acctErr));
      return NextResponse.json({ error: "DB insert failed: " + acctErr.message }, { status: 500 });
    }

    // Increment balance
    const newBalance = (Number(acct.balance) || 0) + total;
    await supabase
      .from("school_accounts")
      .update({ balance: newBalance })
      .eq("id", account_id);

    return NextResponse.json({ success: true, auto_charged: false, new_balance: newBalance, student_name: acct.student_name });
  }

  if (payment_type === "cash") {
    const { error: cashErr } = await supabase.from("school_transactions").insert({
      account_id: null,
      type: "cash_sale",
      amount: total,
      description,
    });
    if (cashErr) {
      console.error("school_transactions cash_sale insert error:", JSON.stringify(cashErr));
      return NextResponse.json({ error: "DB insert failed: " + cashErr.message }, { status: 500 });
    }
    const change = cash_received ? Math.max(0, cash_received - total) : 0;
    return NextResponse.json({ success: true, change });
  }

  if (payment_type === "card") {
    // Card payment via Stripe Terminal — PaymentIntent was already confirmed by the Terminal SDK.
    // This endpoint just records the transaction for reporting.
    const { stripe_payment_intent_id } = body;
    const cardDesc = stripe_payment_intent_id ? `${description} [${stripe_payment_intent_id}]` : description;
    const { error: cardErr } = await supabase.from("school_transactions").insert({
      account_id: null,
      type: "card_sale",
      amount: total,
      description: cardDesc,
    });
    if (cardErr) {
      console.error("school_transactions card_sale insert error:", JSON.stringify(cardErr));
      return NextResponse.json({ error: "DB insert failed: " + cardErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid payment_type" }, { status: 400 });
}
