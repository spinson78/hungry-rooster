import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ── Freeze / Unfreeze ─────────────────────────────────────────────────
  if (action === "freeze" || action === "unfreeze") {
    const { account_id, reason } = body;
    if (!account_id) return NextResponse.json({ error: "account_id required" }, { status: 400 });
    await supabase
      .from("school_accounts")
      .update({
        status: action === "freeze" ? "frozen" : "active",
        freeze_reason: action === "freeze" ? (reason || "Admin freeze") : null,
      })
      .eq("id", account_id);
    return NextResponse.json({ success: true });
  }

  // ── Manual Balance Adjustment ─────────────────────────────────────────
  if (action === "adjust") {
    const { account_id, amount, description } = body;
    if (!account_id || amount === undefined) {
      return NextResponse.json({ error: "account_id and amount required" }, { status: 400 });
    }
    const { data: acct } = await supabase
      .from("school_accounts")
      .select("balance")
      .eq("id", account_id)
      .single();

    const newBalance = Math.max(0, (Number(acct?.balance) || 0) + Number(amount));
    await supabase.from("school_accounts").update({ balance: newBalance }).eq("id", account_id);
    await supabase.from("school_transactions").insert({
      account_id,
      type: "adjustment",
      amount: Number(amount),
      description: description || (amount < 0 ? "Admin credit" : "Admin charge"),
    });
    return NextResponse.json({ success: true, new_balance: newBalance });
  }

  // ── Admin Create Account (sends invite email) ─────────────────────────
  if (action === "create") {
    const { student_name, student_pin, grade_class, school_name, parent_name, parent_email, parent_phone, billing_preference, notes } = body;
    if (!student_name || !student_pin || !parent_name || !parent_email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const pinClash = await supabase.from("school_accounts").select("id").eq("student_pin", student_pin).maybeSingle();
    if (pinClash.data) return NextResponse.json({ error: "Student ID already in use" }, { status: 409 });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";

    if (billing_preference === "auto_charge") {
      // Create Stripe customer and setup session
      const customer = await stripe.customers.create({ name: parent_name, email: parent_email });
      const setupSession = await stripe.checkout.sessions.create({
        mode: "setup",
        customer: customer.id,
        payment_method_types: ["card"],
        success_url: `${baseUrl}/school/register/setup-complete?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/school/register`,
        metadata: { student_name, student_pin, grade_class: grade_class || "", school_name: school_name || "", parent_name, parent_email, parent_phone: parent_phone || "", billing_preference, notes: (notes || "").slice(0, 490) },
      });
      await supabase.from("school_accounts").insert({
        student_name, student_pin, grade_class, school_name, parent_name, parent_email, parent_phone,
        billing_preference: "auto_charge", stripe_customer_id: customer.id,
        stripe_setup_session_id: setupSession.id, status: "pending_setup", notes,
      });
      // Email the setup link to the parent
      if (process.env.RESEND_API_KEY) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "The Hungry Rooster <sales@thehungryroostertx.com>",
            to: parent_email,
            subject: `Set up ${student_name}'s coffee shop account ☕`,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;"><h1 style="color:#e9c46a;">Almost ready! ☕</h1><p>Hi ${parent_name},</p><p>An account has been created for <strong>${student_name}</strong> at the school coffee shop. To activate it, please add a card on file for weekly billing:</p><div style="text-align:center;margin:28px 0;"><a href="${setupSession.url}" style="background:#e9c46a;color:#000;font-weight:900;padding:14px 32px;border-radius:50px;text-decoration:none;font-size:16px;">Add Card &amp; Activate Account</a></div><p style="color:#71717a;font-size:12px;">Your card will be charged every Friday for that week's purchases.</p></div>`,
          }),
        });
      }
    } else {
      await supabase.from("school_accounts").insert({
        student_name, student_pin, grade_class, school_name, parent_name, parent_email, parent_phone,
        billing_preference: "invoice", status: "active", notes,
      });
      // Send welcome email with PIN
      if (process.env.RESEND_API_KEY) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "The Hungry Rooster <sales@thehungryroostertx.com>",
            to: parent_email,
            subject: `${student_name}'s coffee shop account is ready ☕`,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;"><h1 style="color:#e9c46a;">Account Ready! ☕</h1><p>Hi ${parent_name},</p><p><strong>${student_name}</strong> is all set!</p><div style="background:#1c1c1e;border:2px solid #e9c46a;border-radius:12px;padding:24px;text-align:center;margin:24px 0;"><p style="color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Student Account ID</p><p style="font-size:42px;font-weight:900;color:#e9c46a;letter-spacing:6px;margin:0;">${student_pin}</p></div><p>You'll receive a Stripe invoice by email each Friday. Questions? Reply to this email.</p></div>`,
          }),
        });
      }
    }
    return NextResponse.json({ success: true });
  }

  // ── Send Payment Reminder ─────────────────────────────────────────────
  if (action === "remind") {
    const { account_id } = body;
    const { data: acct } = await supabase
      .from("school_accounts")
      .select("parent_email, parent_name, student_name, balance, student_pin")
      .eq("id", account_id).single();
    if (!acct || !acct.parent_email) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";
    if (process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "The Hungry Rooster <sales@thehungryroostertx.com>",
          to: acct.parent_email,
          subject: `Reminder: ${acct.student_name}'s coffee shop balance — $${Number(acct.balance).toFixed(2)}`,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;"><p>Hi ${acct.parent_name},</p><p>This is a friendly reminder that <strong>${acct.student_name}</strong> has an outstanding balance of <strong>$${Number(acct.balance).toFixed(2)}</strong>.</p><p>To view the full transaction history, visit: <a href="${baseUrl}/school/account">${baseUrl}/school/account</a> and enter your email and student ID (<strong>${acct.student_pin}</strong>).</p><p>— The Hungry Rooster Coffee Shop</p></div>`,
        }),
      });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
