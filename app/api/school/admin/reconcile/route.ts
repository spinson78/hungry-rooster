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

  // How far back to look (default: 7 days)
  const { searchParams } = new URL(req.url);
  const hoursBack = parseInt(searchParams.get("hours") || "168");
  const since = Math.floor(Date.now() / 1000) - hoursBack * 3600;

  const missing: Array<{
    stripe_id: string;
    type: "qr_kiosk" | "auto_charge";
    amount: number;
    description: string;
    created: string;
  }> = [];

  // ── QR kiosk: paginate through ALL checkout sessions in the window ────────
  let sessionCursor: string | undefined = undefined;
  while (true) {
    const sessionPage = await stripe.checkout.sessions.list({
      limit: 100,
      created: { gte: since },
      ...(sessionCursor ? { starting_after: sessionCursor } : {}),
    });

    for (const s of sessionPage.data) {
      if (s.metadata?.source !== "coop_qr_kiosk") continue;
      if (s.payment_status !== "paid") continue;

      const amount = (s.amount_total || 0) / 100;
      const description = s.metadata?.description || "QR kiosk payment";

      const { data: existing } = await supabase
        .from("school_transactions")
        .select("id")
        .like("description", `%[${s.id}]%`)
        .maybeSingle();

      if (!existing) {
        missing.push({
          stripe_id: s.id,
          type: "qr_kiosk",
          amount,
          description,
          created: new Date(s.created * 1000).toISOString(),
        });

        if (doWrite) {
          const { error: err } = await supabase.from("school_transactions").insert({
            account_id: null,
            type: "card_sale",
            amount,
            description: `${description} [${s.id}] [backfilled]`,
          });
          if (err) console.error("Reconcile QR insert error:", err.message, s.id);
        }
      }
    }

    if (!sessionPage.has_more) break;
    sessionCursor = sessionPage.data[sessionPage.data.length - 1].id;
  }

  // ── Auto-charges: paginate through ALL payment intents in the window ──────
  let intentCursor: string | undefined = undefined;
  while (true) {
    const intentPage = await stripe.paymentIntents.list({
      limit: 100,
      created: { gte: since },
      ...(intentCursor ? { starting_after: intentCursor } : {}),
    });

    for (const pi of intentPage.data) {
      if (!pi.description?.startsWith("COOP —")) continue;
      if (pi.status !== "succeeded") continue;

      const amount = (pi.amount || 0) / 100;

      const { data: existing } = await supabase
        .from("school_transactions")
        .select("id")
        .like("description", `%[auto-charged ${pi.id}]%`)
        .maybeSingle();

      if (!existing) {
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
          const { error: err } = await supabase.from("school_transactions").insert({
            account_id: accountId,
            type: "auto_charge_purchase",
            amount,
            description: `${pi.description} [auto-charged ${pi.id}] [backfilled]`,
          });
          if (err) console.error("Reconcile auto-charge insert error:", err.message, pi.id);
        }
      }
    }

    if (!intentPage.has_more) break;
    intentCursor = intentPage.data[intentPage.data.length - 1].id;
  }

  return NextResponse.json({
    action: doWrite ? "backfilled" : "dry_run",
    hours_checked: hoursBack,
    missing_count: missing.length,
    missing,
  });
}
