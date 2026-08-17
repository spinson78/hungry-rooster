import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["setup_intent"],
  });

  const setupIntent = session.setup_intent as Stripe.SetupIntent | null;
  const paymentMethodId = setupIntent?.payment_method as string | null;

  if (!paymentMethodId) {
    return NextResponse.json({ error: "Card not captured" }, { status: 400 });
  }

  // Set as customer default payment method
  if (session.customer) {
    await stripe.customers.update(session.customer as string, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  }

  // Update account to active
  const { data: account } = await supabase
    .from("school_accounts")
    .update({
      stripe_payment_method_id: paymentMethodId,
      status: "active",
    })
    .eq("stripe_setup_session_id", sessionId)
    .select("student_name, student_pin, parent_name, parent_email")
    .single();

  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  // Welcome email
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";
  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Hungry Rooster <sales@thehungryroostertx.com>",
        to: account.parent_email,
        subject: `${account.student_name}'s coffee shop account is ready! ☕`,
        html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
          <h1 style="color:#e9c46a;margin-top:0;">You're all set! ☕</h1>
          <p>Hi ${account.parent_name},</p>
          <p><strong>${account.student_name}</strong> can now use the coffee shop account!</p>
          <div style="background:#1c1c1e;border:2px solid #e9c46a;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
            <p style="color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Student Account ID</p>
            <p style="font-size:42px;font-weight:900;color:#e9c46a;letter-spacing:6px;margin:0;">${account.student_pin}</p>
          </div>
          <p>Your card on file will be charged automatically each Friday for the week's purchases.</p>
          <p>View your balance and transaction history at any time:<br/>
          <a href="${baseUrl}/school/account" style="color:#2dd4bf;">${baseUrl}/school/account</a></p>
          <p style="color:#71717a;font-size:13px;margin-top:32px;">— The Hungry Rooster Coffee Shop</p>
        </div>
        `,
      }),
    });
  }

  return NextResponse.json({
    success: true,
    student_name: account.student_name,
    student_pin: account.student_pin,
  });
}
