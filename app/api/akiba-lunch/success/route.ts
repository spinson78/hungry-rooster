import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function sendEmail(to: string, subject: string, html: string) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "THE COOP <noreply@thehungryroostertx.com>", to, subject, html }),
  });
}

export async function GET(req: NextRequest) {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  // Already processed?
  const { data: existing } = await supabase
    .from("akiba_lunch_orders")
    .select("*")
    .eq("stripe_session_id", sessionId)
    .single();
  if (existing) return NextResponse.json({ success: true, ...existing });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not complete" }, { status: 400 });
    }

    const meta = session.metadata || {};

    const { data: order, error } = await supabase
      .from("akiba_lunch_orders")
      .insert({
        student_name: meta.student_name,
        grade: meta.grade,
        item_name: meta.item_name,
        item_price: parseFloat(meta.item_price),
        make_it_meal: meta.make_it_meal === "true",
        drink: meta.drink || null,
        amount_total: parseFloat(meta.amount_total),
        stripe_session_id: sessionId,
        status: "paid",
        week_of: meta.week_of,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const mealNote = meta.make_it_meal === "true"
      ? `<tr><td style="padding:6px 0;color:#888;">Meal Add-on</td><td style="padding:6px 0;">+ ${meta.drink}</td></tr>` : "";

    await sendEmail("sales@thehungryroostertx.com", `🏫 Akiba Lunch — ${meta.student_name} (${meta.grade})`, `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#111;color:#fff;padding:24px;border-radius:12px;">
        <h2 style="color:#facc15;margin:0 0 16px">New Akiba Lunch Order</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 0;color:#888;">Student</td><td style="padding:6px 0;font-weight:bold;">${meta.student_name}</td></tr>
          <tr><td style="padding:6px 0;color:#888;">Grade</td><td style="padding:6px 0;">${meta.grade}</td></tr>
          <tr><td style="padding:6px 0;color:#888;">Item</td><td style="padding:6px 0;">${meta.item_name}</td></tr>
          ${mealNote}
          <tr><td style="padding:6px 0;color:#888;">Total</td><td style="padding:6px 0;color:#facc15;font-weight:bold;">$${parseFloat(meta.amount_total).toFixed(2)}</td></tr>
          <tr><td style="padding:6px 0;color:#888;">Delivery</td><td style="padding:6px 0;">Thursday · Akiba Yavneh</td></tr>
        </table>
      </div>
    `);

    return NextResponse.json({ success: true, ...order });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
