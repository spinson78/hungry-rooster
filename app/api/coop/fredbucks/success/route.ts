import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function makeRefCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `FB-${year}-${rand}`;
}

export async function GET(req: NextRequest) {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "session_id required" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check if already processed
  const { data: existing } = await supabase
    .from("fred_bucks_purchases")
    .select("id, ref_code, teacher_name, coupons_total")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, ...existing });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
  }

  const { teacher_name, teacher_email, school_name, coupons_total } = session.metadata!;
  const amount_paid = (session.amount_total || 0) / 100;
  const coupons = parseInt(coupons_total);

  let ref_code = makeRefCode();
  // Ensure uniqueness
  let attempts = 0;
  while (attempts < 5) {
    const { data: clash } = await supabase.from("fred_bucks_purchases").select("id").eq("ref_code", ref_code).maybeSingle();
    if (!clash) break;
    ref_code = makeRefCode();
    attempts++;
  }

  const { data: purchase } = await supabase
    .from("fred_bucks_purchases")
    .insert({
      teacher_name,
      teacher_email,
      school_name: school_name || null,
      amount_paid,
      coupons_total: coupons,
      coupons_redeemed: 0,
      stripe_session_id: sessionId,
      ref_code,
    })
    .select("id, ref_code, teacher_name, coupons_total")
    .single();

  // Email staff with print link
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";
  const printUrl = `${baseUrl}/fredbucks-print.html?teacher=${encodeURIComponent(teacher_name)}&ref=${encodeURIComponent(ref_code)}&count=${coupons}`;

  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "THE COOP <sales@thehungryroostertx.com>",
        to: "sales@thehungryroostertx.com",
        subject: `🐓 Fred's Bucks purchased — ${teacher_name} (${coupons} coupons)`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#000;">Fred's Bucks Purchase</h2>
            <p><strong>Teacher:</strong> ${teacher_name}</p>
            <p><strong>Email:</strong> ${teacher_email}</p>
            ${school_name ? `<p><strong>School:</strong> ${school_name}</p>` : ""}
            <p><strong>Amount Paid:</strong> $${amount_paid.toFixed(2)}</p>
            <p><strong>Coupons:</strong> ${coupons} × $5 Fred's Bucks</p>
            <p><strong>Ref Code:</strong> ${ref_code}</p>
            <div style="margin:24px 0;">
              <a href="${printUrl}" style="background:#000;color:#fff;font-weight:900;padding:14px 28px;border-radius:50px;text-decoration:none;font-size:16px;">
                🖨️ Print Fred's Bucks Sheet
              </a>
            </div>
            <p style="color:#888;font-size:12px;">Hand the printed sheet to ${teacher_name} at The Coop Counter. Each coupon is worth $5 cash value.</p>
          </div>
        `,
      }),
    });
  }

  return NextResponse.json({ success: true, ...purchase });
}
