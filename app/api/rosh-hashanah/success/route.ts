import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "session_id required" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Idempotency — return existing record if already written
  const { data: existing } = await supabase
    .from("rosh_hashanah_orders")
    .select("id,customer_name,boxes_summary,addons_summary,total")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (existing) return NextResponse.json({ success: true, order: existing });

  // Fetch from Stripe
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
  }

  const meta = session.metadata ?? {};
  const total = (session.amount_total || 0) / 100;

  const { data: order, error } = await supabase
    .from("rosh_hashanah_orders")
    .insert({
      stripe_session_id: sessionId,
      customer_name: meta.customer_name || "",
      customer_email: meta.customer_email || "",
      customer_phone: meta.customer_phone || "",
      customer_address: meta.customer_address || "",
      special_requests: meta.special_requests || "",
      boxes_summary: meta.boxes_summary || "",
      addons_summary: meta.addons_summary || "",
      subtotal: parseFloat(meta.subtotal || "0"),
      tax_amount: parseFloat(meta.tax_amount || "0"),
      tip_amount: parseFloat(meta.tip_amount || "0"),
      total,
      status: "paid",
      delivery_date: "2026-09-11",
    })
    .select("id,customer_name,boxes_summary,addons_summary,total")
    .single();

  if (error) {
    console.error("rosh_hashanah_orders insert error:", JSON.stringify(error));
    return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
  }

  // Admin notification email
  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "The Hungry Rooster <sales@thehungryroostertx.com>",
        to: "sales@thehungryroostertx.com",
        subject: `🍎 Rosh Hashanah Order — ${meta.customer_name} ($${total.toFixed(2)})`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#111;color:#fff;padding:28px;border-radius:12px;">
            <h2 style="color:#e9c46a;margin:0 0 16px">New Rosh Hashanah Order 🍎🍯</h2>
            <table style="font-size:14px;width:100%;border-collapse:collapse;">
              <tr><td style="color:#888;padding:4px 0;width:120px">Name</td><td style="font-weight:700">${meta.customer_name}</td></tr>
              <tr><td style="color:#888;padding:4px 0">Phone</td><td>${meta.customer_phone}</td></tr>
              <tr><td style="color:#888;padding:4px 0">Email</td><td>${meta.customer_email}</td></tr>
              <tr><td style="color:#888;padding:4px 0">Address</td><td>${meta.customer_address}</td></tr>
              <tr><td style="color:#888;padding:4px 0">Delivery</td><td style="color:#4ade80;font-weight:700">Friday, September 11, 2026</td></tr>
            </table>
            <div style="background:#1c1c1e;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="color:#e9c46a;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">Boxes</p>
              <p style="margin:0;font-weight:700">${meta.boxes_summary || "—"}</p>
            </div>
            ${meta.addons_summary ? `
            <div style="background:#1c1c1e;border-radius:8px;padding:16px;margin-bottom:16px;">
              <p style="color:#e9c46a;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">Add-Ons</p>
              <p style="margin:0;font-weight:700">${meta.addons_summary}</p>
            </div>` : ""}
            ${meta.special_requests ? `<p style="color:#888;font-size:13px"><strong>Notes:</strong> ${meta.special_requests}</p>` : ""}
            <p style="font-size:20px;font-weight:900;color:#e9c46a;margin-top:16px;">Total: $${total.toFixed(2)}</p>
          </div>
        `,
      }),
    });
  }

  return NextResponse.json({ success: true, order });
}
