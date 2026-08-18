// Cron: runs on 10/15, 1/8, 3/15 to charge installments 2, 3, 4
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

async function sendEmail(to: string, subject: string, html: string) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "THE COOP <noreply@thehungryroostertx.com>", to, subject, html }),
  });
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const today = new Date().toISOString().split("T")[0];

  // Find pending installments due today or earlier
  const { data: due } = await supabase
    .from("coopchallah_installments")
    .select("*, coopchallah_orders(name, phone, package, stripe_customer_id, stripe_payment_method_id)")
    .eq("status", "pending")
    .lte("due_date", today);

  if (!due || due.length === 0) {
    return NextResponse.json({ processed: 0, message: "No installments due today" });
  }

  const results = { charged: 0, failed: 0, failures: [] as string[] };

  for (const inst of due) {
    const order = inst.coopchallah_orders as { name: string; phone: string; package: string; stripe_customer_id: string; stripe_payment_method_id: string };
    if (!order?.stripe_payment_method_id || !order?.stripe_customer_id) {
      results.failed++;
      results.failures.push(`${order?.name || inst.order_id} — no payment method`);
      await supabase.from("coopchallah_installments").update({ status: "failed" }).eq("id", inst.id);
      continue;
    }

    try {
      const pi = await stripe.paymentIntents.create({
        amount: Math.round(inst.amount * 100),
        currency: "usd",
        customer: order.stripe_customer_id,
        payment_method: order.stripe_payment_method_id,
        off_session: true,
        confirm: true,
        description: `THE COOP Challah — ${order.name} · Installment ${inst.installment_number} of 4`,
      });

      await supabase.from("coopchallah_installments").update({
        status: "paid",
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: pi.id,
      }).eq("id", inst.id);

      await supabase.from("coopchallah_orders")
        .update({ installments_paid: inst.installment_number })
        .eq("id", inst.order_id);

      results.charged++;

      // Notify staff
      await sendEmail("sales@thehungryroostertx.com", `✅ Installment ${inst.installment_number}/4 charged — ${order.name}`, `<p style="font-family:sans-serif"><strong>${order.name}</strong> — Installment ${inst.installment_number} of 4 auto-drafted successfully.<br>Amount: <strong>$${inst.amount.toFixed(2)}</strong><br>Package: ${order.package.replace(/_/g," ")}</p>`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Stripe error";
      results.failed++;
      results.failures.push(`${order.name} — ${msg}`);
      await supabase.from("coopchallah_installments").update({ status: "failed" }).eq("id", inst.id);

      await sendEmail("sales@thehungryroostertx.com", `❌ Installment charge failed — ${order.name}`, `<p style="font-family:sans-serif"><strong>${order.name}</strong> — Installment ${inst.installment_number} of 4 FAILED.<br>Error: ${msg}<br>Phone: ${order.phone}</p>`);
    }
  }

  return NextResponse.json({ ...results, processed: due.length });
}
