import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// GET  → dry-run: returns list of missing transactions
// POST → backfills missing transactions into school_transactions

export async function GET(req: NextRequest) {
  return reconcile(req, false);
}

export async function POST(req: NextRequest) {
  return reconcile(req, true);
}

async function reconcile(req: NextRequest, doWrite: boolean) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // How far back to look (default: 2 days)
  const { searchParams } = new URL(req.url);
  const hoursBack = parseInt(searchParams.get("hours") || "48");
  const since = Math.floor(Date.now() / 1000) - hoursBack * 3600;

  // ── 1. Pull all COOP-related Stripe charges in the window ─────────────────
  // These include: QR kiosk sessions (source=coop_qr_kiosk) and auto-charges (from /purchase route)
  const missing: Array<{
    stripe_id: string;
    type: "qr_kiosk" | "auto_charge";
    amount: number;
    description: string;
    created: string;
  }> = [];

  // QR kiosk → checkout sessions
  const sessions = await stripe.checkout.sessions.list({ limit: 100, created: { gte: since } });
  for (const s of sessions.data) {
    if (s.metadata?.source !== "coop_qr_kiosk") continue;
    if (s.payment_status !== "paid") continue;
    const amount = (s.amount_total || 0) / 100;
    const description = s.metadata?.description || "QR kiosk payment";

    // Check if already in school_transactions (match on session ID in description)
    const { data: existing } = await supabase
      .from("school_transactions")
      .select("id")
      .like("description", `%[${s.id}]%`)
      .maybeSingle();

    if (!existing) {
      missing.push({ stripe_id: s.id, type: "qr_kiosk", amount, description, created: new Date(s.created * 1000).toISOString() });

      if (doWrite) {
        await supabase.from("school_transactions").insert({
          account_id: null,
          type: "card_sale",
          amount,
          description: `${description} [${s.id}] [backfilled]`,
        });
      }
    }
  }

  // Auto-charges → payment intents with COOP description
  const intents = await stripe.paymentIntents.list({ limit: 100, created: { gte: since } });
  for (const pi of intents.data) {
    // Only COOP auto-charges — they have a description starting with "COOP —"
    if (!pi.description?.startsWith("COOP —")) continue;
    if (pi.status !== "succeeded") continue;
    const amount = (pi.amount || 0) / 100;

    // Check if already in school_transactions (match on payment intent ID)
    const { data: existing } = await supabase
      .from("school_transactions")
      .select("id")
      .like("description", `%[auto-charged ${pi.id}]%`)
      .maybeSingle();

    if (!existing) {
      // Try to find the account by stripe_customer_id
      let accountId: string | null = null;
      if (pi.customer) {
        const { data: acct } = await supabase
          .from("school_accounts")
          .select("id")
          .eq("stripe_customer_id", pi.customer)
          .maybeSingle();
        accountId = acct?.id ?? null;
      }

      missing.push({
        stripe_id: pi.id,
        type: "auto_charge",
        amount,
        description: pi.description || "Auto-charge",
        created: new Date(pi.created * 1000).toISOString(),
      });

      if (doWrite) {
        await supabase.from("school_transactions").insert({
          account_id: accountId,
          type: "auto_charge_purchase",
          amount,
          description: `${pi.description} [auto-charged ${pi.id}] [backfilled]`,
        });
      }
    }
  }

  return NextResponse.json({
    action: doWrite ? "backfilled" : "dry_run",
    hours_checked: hoursBack,
    missing_count: missing.length,
    missing,
  });
}
