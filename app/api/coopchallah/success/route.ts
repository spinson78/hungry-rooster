import { NextRequest, NextResponse } from "next/server";
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

// Installment due dates (8/28 is collected at checkout)
const INSTALLMENT_DATES = ["2026-10-15", "2027-01-08", "2027-03-15"];

function getNextFriday(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 5=Fri
  const daysUntilFriday = (5 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilFriday);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export async function GET(req: NextRequest) {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check already processed
  const { data: existing } = await supabase
    .from("coopchallah_orders")
    .select("id, name, order_type, package, babka_flavor, amount_total, is_installment, status")
    .eq("stripe_session_id", sessionId)
    .single();

  if (existing) return NextResponse.json({ success: true, ...existing });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not complete" }, { status: 400 });
    }

    const meta = session.metadata || {};
    const isInstallment = meta.is_installment === "true";
    const pi = session.payment_intent as Stripe.PaymentIntent | null;

    // Get payment method for future installments
    let stripePaymentMethodId: string | null = null;
    if (isInstallment && pi?.payment_method) {
      stripePaymentMethodId = typeof pi.payment_method === "string"
        ? pi.payment_method
        : pi.payment_method.id;
    }

    const TOTALS: Record<string, number> = {
      weekly_challah: 6.50, weekly_babka: 18,
      s1_1challah: 76, s1_2challah: 152, s1_1challah_1babka: 290, s1_2challah_1babka: 366,
      s2_1challah: 105, s2_2challah: 210, s2_1challah_1babka: 395, s2_2challah_1babka: 500,
      fy_1challah: 172, fy_2challah: 344, fy_1challah_1babka: 651, fy_2challah_1babka: 827,
    };

    const pkg = meta.package || "";
    const amountTotal = TOTALS[pkg] || (session.amount_total || 0) / 100;

    // Insert order
    const { data: order, error } = await supabase
      .from("coopchallah_orders")
      .insert({
        name: meta.name,
        phone: meta.phone,
        order_type: meta.order_type,
        package: pkg,
        babka_flavor: meta.babka_flavor || null,
        amount_total: amountTotal,
        is_installment: isInstallment,
        installments_paid: isInstallment ? 1 : 1,
        installments_total: isInstallment ? 4 : 1,
        stripe_customer_id: session.customer as string,
        stripe_payment_method_id: stripePaymentMethodId,
        stripe_session_id: sessionId,
        status: "active",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Create installment schedule if applicable
    if (isInstallment && order) {
      const installmentAmt = Math.round((amountTotal / 4) * 100) / 100;
      // Installment 1 already paid at checkout — create records 2, 3, 4
      await supabase.from("coopchallah_installments").insert([
        { order_id: order.id, installment_number: 1, amount: installmentAmt, due_date: "2026-08-28", paid_at: new Date().toISOString(), status: "paid", stripe_payment_intent_id: pi?.id || null },
        { order_id: order.id, installment_number: 2, amount: installmentAmt, due_date: INSTALLMENT_DATES[0], status: "pending" },
        { order_id: order.id, installment_number: 3, amount: installmentAmt, due_date: INSTALLMENT_DATES[1], status: "pending" },
        { order_id: order.id, installment_number: 4, amount: installmentAmt, due_date: INSTALLMENT_DATES[2], status: "pending" },
      ]);
    }

    // Send notification email
    const flavorNote = meta.babka_flavor ? ` (${meta.babka_flavor} babka)` : "";
    const installmentNote = isInstallment
      ? `\nPayment Plan: 4 installments of $${(amountTotal / 4).toFixed(2)}\nInstallment 1 of 4 paid today.\nRemaining drafts: Oct 15, Jan 8, Mar 15.`
      : "";
    const pickupNote = meta.order_type === "weekly"
      ? `Pickup: ${getNextFriday()} · The Coop Counter`
      : "Pickup: Every Friday · The Coop Counter";

    await sendEmail("sales@thehungryroostertx.com", `🍞 New Challah Order — ${meta.name}`, `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#111;color:#fff;padding:24px;border-radius:12px;">
          <h2 style="color:#facc15;margin:0 0 16px">New Challah/Babka Order</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:6px 0;color:#888;">Name</td><td style="padding:6px 0;font-weight:bold;">${meta.name}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Phone</td><td style="padding:6px 0;">${meta.phone}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Package</td><td style="padding:6px 0;">${pkg.replace(/_/g," ")}${flavorNote}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Type</td><td style="padding:6px 0;">${meta.order_type}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Total</td><td style="padding:6px 0;color:#facc15;font-weight:bold;">$${amountTotal.toFixed(2)}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Pickup</td><td style="padding:6px 0;">${pickupNote.replace(/\n/g,"<br>")}</td></tr>
          </table>
          ${installmentNote ? `<div style="margin-top:16px;background:#222;border-radius:8px;padding:12px;font-size:13px;color:#aaa;">${installmentNote.replace(/\n/g,"<br>")}</div>` : ""}
        </div>
      `);

    return NextResponse.json({ success: true, name: meta.name, order_type: meta.order_type, package: pkg, babka_flavor: meta.babka_flavor || null, amount_total: amountTotal, is_installment: isInstallment });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
