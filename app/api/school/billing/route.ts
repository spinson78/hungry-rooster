import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  // Cron auth check (optional — Hobby plan doesn't send CRON_SECRET)
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get all active accounts with a balance > 0
  const { data: accounts } = await supabase
    .from("school_accounts")
    .select("id, student_name, parent_name, parent_email, balance, billing_preference, stripe_customer_id, stripe_payment_method_id")
    .eq("status", "active")
    .gt("balance", 0);

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ success: true, message: "No balances to collect", charged: 0, invoiced: 0 });
  }

  let charged = 0;
  let invoiced = 0;
  const failures: string[] = [];

  for (const acct of accounts) {
    const amountCents = Math.round(Number(acct.balance) * 100);
    if (amountCents < 50) continue; // Stripe minimum

    try {
      if (acct.billing_preference === "auto_charge" && acct.stripe_payment_method_id && acct.stripe_customer_id) {
        // ── Auto-charge card on file ──────────────────────────────────
        const pi = await stripe.paymentIntents.create({
          amount: amountCents,
          currency: "usd",
          customer: acct.stripe_customer_id,
          payment_method: acct.stripe_payment_method_id,
          confirm: true,
          off_session: true,
          description: `Weekly coffee shop tab — ${acct.student_name}`,
          metadata: { account_id: acct.id, student_name: acct.student_name },
        });

        if (pi.status === "succeeded") {
          // Record payment + zero out balance
          await supabase.from("school_transactions").insert({
            account_id: acct.id,
            type: "billing_charge",
            amount: -Number(acct.balance),
            description: `Weekly billing — card charged $${Number(acct.balance).toFixed(2)}`,
            stripe_payment_intent_id: pi.id,
          });
          await supabase.from("school_accounts").update({ balance: 0 }).eq("id", acct.id);
          charged++;
        } else {
          throw new Error(`PaymentIntent status: ${pi.status}`);
        }
      } else {
        // ── Send Stripe invoice ───────────────────────────────────────
        let customerId = acct.stripe_customer_id;

        if (!customerId) {
          // Create Stripe customer on the fly for invoice-only accounts
          const customer = await stripe.customers.create({
            name: acct.parent_name,
            email: acct.parent_email,
            metadata: { student_name: acct.student_name, account_id: acct.id },
          });
          customerId = customer.id;
          await supabase.from("school_accounts").update({ stripe_customer_id: customerId }).eq("id", acct.id);
        }

        // Create invoice item + invoice, then send
        await stripe.invoiceItems.create({
          customer: customerId,
          amount: amountCents,
          currency: "usd",
          description: `Weekly coffee shop tab — ${acct.student_name}`,
        });

        const invoice = await stripe.invoices.create({
          customer: customerId,
          collection_method: "send_invoice",
          days_until_due: 7,
          metadata: { account_id: acct.id, student_name: acct.student_name },
        });

        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
        await stripe.invoices.sendInvoice(finalizedInvoice.id);

        await supabase.from("school_transactions").insert({
          account_id: acct.id,
          type: "billing_invoice",
          amount: Number(acct.balance),
          description: `Weekly invoice sent — $${Number(acct.balance).toFixed(2)} due in 7 days`,
          stripe_invoice_id: finalizedInvoice.id,
        });
        // For invoices: zero out balance optimistically (will handle unpaid via webhook if needed)
        await supabase.from("school_accounts").update({ balance: 0 }).eq("id", acct.id);
        invoiced++;
      }
    } catch (err) {
      console.error(`Billing failed for account ${acct.id} (${acct.student_name}):`, err);
      failures.push(acct.student_name);

      // Freeze the account
      await supabase.from("school_accounts").update({
        status: "frozen",
        freeze_reason: "Payment failed on weekly billing",
      }).eq("id", acct.id);

      // Notify parent
      if (acct.parent_email && process.env.RESEND_API_KEY) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "The Hungry Rooster <sales@thehungryroostertx.com>",
            to: acct.parent_email,
            subject: `⚠️ Action needed: ${acct.student_name}'s coffee shop account`,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;"><h2 style="color:#ef4444;">Account Temporarily Paused</h2><p>Hi ${acct.parent_name},</p><p>We were unable to process this week's payment of <strong>$${Number(acct.balance).toFixed(2)}</strong> for ${acct.student_name}'s coffee shop account. The account has been temporarily paused.</p><p>Please contact us to update your payment method and reactivate the account.</p><p>— The Hungry Rooster Coffee Shop</p></div>`,
          }),
        });
      }
    }
  }

  console.log(`School billing: charged ${charged}, invoiced ${invoiced}, failed ${failures.length}`);
  return NextResponse.json({
    success: true,
    charged,
    invoiced,
    failed: failures.length,
    failures,
  });
}
