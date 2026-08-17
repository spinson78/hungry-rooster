import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "The Hungry Rooster <sales@thehungryroostertx.com>",
      to,
      subject,
      html,
    }),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    student_name, student_pin, grade_class, school_name,
    parent_name, parent_email, parent_phone, billing_preference, notes,
  } = body;

  if (!student_name || !student_pin || !parent_name || !parent_email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!/^\d{4,6}$/.test(student_pin)) {
    return NextResponse.json({ error: "Student ID must be 4–6 digits" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check PIN uniqueness
  const { data: pinClash } = await supabase
    .from("school_accounts")
    .select("id")
    .eq("student_pin", student_pin)
    .maybeSingle();
  if (pinClash) {
    return NextResponse.json({ error: "That student ID is already in use. Choose a different number." }, { status: 409 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";

  if (billing_preference === "auto_charge") {
    // Create Stripe customer + hosted setup session to collect card
    const customer = await stripe.customers.create({
      name: parent_name,
      email: parent_email,
      phone: parent_phone || undefined,
      metadata: { student_name, school_name: school_name || "" },
    });

    const setupSession = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: customer.id,
      payment_method_types: ["card"],
      success_url: `${baseUrl}/school/register/setup-complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/school/register`,
      metadata: {
        student_name, student_pin,
        grade_class: grade_class || "",
        school_name: school_name || "",
        parent_name, parent_email,
        parent_phone: parent_phone || "",
        billing_preference,
        notes: (notes || "").slice(0, 490),
      },
    });

    await supabase.from("school_accounts").insert({
      student_name, student_pin, grade_class, school_name,
      parent_name, parent_email, parent_phone,
      billing_preference: "auto_charge",
      stripe_customer_id: customer.id,
      stripe_setup_session_id: setupSession.id,
      status: "pending_setup",
      notes,
    });

    return NextResponse.json({ url: setupSession.url });
  }

  // Invoice billing — active immediately, no card needed
  await supabase.from("school_accounts").insert({
    student_name, student_pin, grade_class, school_name,
    parent_name, parent_email, parent_phone,
    billing_preference: "invoice",
    status: "active",
    notes,
  });

  await sendEmail(
    parent_email,
    `${student_name}'s coffee shop account is ready! ☕`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
      <h1 style="color:#e9c46a;margin-top:0;">Account Ready! ☕</h1>
      <p>Hi ${parent_name},</p>
      <p><strong>${student_name}</strong> is all set at the coffee shop!</p>
      <div style="background:#1c1c1e;border:2px solid #e9c46a;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
        <p style="color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Student Account ID</p>
        <p style="font-size:42px;font-weight:900;color:#e9c46a;letter-spacing:6px;margin:0;">${student_pin}</p>
        <p style="color:#71717a;font-size:12px;margin:8px 0 0;">Keep this safe — ${student_name} will use this number at the counter</p>
      </div>
      <p>Each Friday, you'll receive an invoice by email for the week's purchases. You can pay online via the link in the invoice.</p>
      <p>If you have any questions, reply to this email.</p>
      <p style="color:#71717a;font-size:13px;margin-top:32px;">— The Hungry Rooster Coffee Shop</p>
    </div>
    `
  );

  return NextResponse.json({ success: true });
}
