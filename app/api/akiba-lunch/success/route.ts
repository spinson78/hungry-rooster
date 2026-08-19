import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });

const ITEMS: Record<string, { label: string; price: number }> = {
  brisket_sandwich: { label: "Brisket Sandwich w/ French Fries", price: 16.50 },
  caesar_salad:     { label: "Chicken Caesar Salad", price: 21.00 },
  bbq_wrap:         { label: "Crispy BBQ Chicken Wrap w/ Chips", price: 16.50 },
};

export async function GET(req: NextRequest) {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check if already processed
  const { data: existing } = await supabase
    .from("akiba_lunch_orders")
    .select("student_name, grade, amount_total, week_of")
    .like("stripe_session_id", `${sessionId}%`)
    .limit(1)
    .single();

  if (existing) {
    // Fetch full cart metadata from any row
    const { data: anyRow } = await supabase
      .from("akiba_lunch_orders")
      .select("*")
      .like("stripe_session_id", `${sessionId}%`)
      .limit(1)
      .single();
    return NextResponse.json({
      success: true,
      student_name: existing.student_name,
      grade: existing.grade,
      cart_summary: anyRow?.item_name || "",
      drink: anyRow?.drink || null,
      amount_total: existing.amount_total,
      week_of: existing.week_of,
    });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not complete" }, { status: 400 });
    }

    const meta = session.metadata || {};
    const cart: Array<{ item_id: string; qty: number; meal_count: number }> = JSON.parse(meta.cart || "[]");
    const drink = meta.drink || "";
    const weekOf = meta.week_of || null;
    const cartSummary = meta.cart_summary || "";
    const totalAmount = meta.amount_total || "0.00";

    // Insert one row per cart item (stripe_session_id gets index suffix to stay unique)
    for (let i = 0; i < cart.length; i++) {
      const { item_id, qty, meal_count } = cart[i];
      const item = ITEMS[item_id];
      if (!item || qty < 1) continue;
      const rowTotal = qty * item.price + (meal_count || 0) * 5;
      await supabase.from("akiba_lunch_orders").insert({
        student_name: meta.student_name,
        grade: meta.grade,
        item_name: qty > 1 ? `${item.label} ×${qty}` : item.label,
        item_price: item.price,
        make_it_meal: (meal_count || 0) > 0,
        drink: (meal_count || 0) > 0 ? drink : null,
        amount_total: rowTotal,
        stripe_session_id: `${sessionId}_${i}`,
        status: "paid",
        week_of: weekOf,
      });
    }

    // Send notification email
    const thursdayLabel = weekOf
      ? new Date(weekOf + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
      : "This Thursday";

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "THE COOP <noreply@thehungryroostertx.com>",
        to: "sales@thehungryroostertx.com",
        subject: `🏫 Akiba Lunch — ${meta.student_name} · $${totalAmount}`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#111;color:#fff;padding:24px;border-radius:12px;">
            <h2 style="color:#facc15;margin:0 0 16px">New Akiba Lunch Order</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:6px 0;color:#888;">Student</td><td style="padding:6px 0;font-weight:bold;">${meta.student_name}</td></tr>
              <tr><td style="padding:6px 0;color:#888;">Grade</td><td style="padding:6px 0;">${meta.grade}</td></tr>
              <tr><td style="padding:6px 0;color:#888;">Order</td><td style="padding:6px 0;">${cartSummary}</td></tr>
              ${drink ? `<tr><td style="padding:6px 0;color:#888;">Drink</td><td style="padding:6px 0;">${drink}</td></tr>` : ""}
              <tr><td style="padding:6px 0;color:#888;">Total</td><td style="padding:6px 0;color:#facc15;font-weight:bold;">$${totalAmount}</td></tr>
              <tr><td style="padding:6px 0;color:#888;">Delivery</td><td style="padding:6px 0;">${thursdayLabel}</td></tr>
            </table>
          </div>
        `,
      }),
    });

    return NextResponse.json({
      success: true,
      student_name: meta.student_name,
      grade: meta.grade,
      cart_summary: cartSummary,
      drink: drink || null,
      amount_total: parseFloat(totalAmount),
      week_of: weekOf,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
