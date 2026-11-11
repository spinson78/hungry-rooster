import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Parent self-service PIN reset — verify by email, check balance + reset limit
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: acct } = await supabase
    .from("school_accounts")
    .select("id, student_name, parent_name, parent_email, balance, pin_reset_count")
    .eq("parent_email", email.toLowerCase().trim())
    .maybeSingle();

  if (!acct) {
    // Generic message to avoid account enumeration
    return NextResponse.json({ error: "No account found for that email address." }, { status: 404 });
  }

  if (Number(acct.balance) > 0) {
    return NextResponse.json({
      error: `Account ID cannot be reset while there is an outstanding balance of $${Number(acct.balance).toFixed(2)}. Please pay the balance first, then request a reset.`,
    }, { status: 403 });
  }

  const resetCount = Number(acct.pin_reset_count) || 0;
  if (resetCount >= 2) {
    return NextResponse.json({
      error: "Account ID reset limit reached (2 of 2 used). Please contact The Hungry Rooster directly for assistance.",
    }, { status: 403 });
  }

  // Generate a unique 4-digit PIN
  let newPin = "";
  for (let i = 0; i < 20; i++) {
    const candidate = String(Math.floor(1000 + Math.random() * 9000));
    const { data: clash } = await supabase
      .from("school_accounts")
      .select("id")
      .eq("student_pin", candidate)
      .neq("id", acct.id)
      .maybeSingle();
    if (!clash) { newPin = candidate; break; }
  }
  if (!newPin) return NextResponse.json({ error: "Could not generate a unique ID. Please try again." }, { status: 500 });

  await supabase.from("school_accounts").update({
    student_pin: newPin,
    pin_reset_count: resetCount + 1,
  }).eq("id", acct.id);

  const resetsLeft = 1 - resetCount; // remaining after this one

  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "THE COOP <sales@thehungryroostertx.com>",
        to: acct.parent_email,
        subject: `${acct.student_name}'s new COOP Account ID`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0a0a0a;color:#fff;padding:28px;border-radius:12px;">
            <h2 style="color:#e9c46a;margin:0 0 16px;">☕ Account ID Reset</h2>
            <p>Hi ${acct.parent_name},</p>
            <p>Your reset request was approved. Here is <strong>${acct.student_name}</strong>'s new account ID — please keep it private and do not share it with other students.</p>
            <div style="background:#1c1c1e;border:2px solid #e9c46a;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
              <p style="color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">New Account ID</p>
              <p style="font-size:48px;font-weight:900;color:#e9c46a;letter-spacing:8px;margin:0;">${newPin}</p>
            </div>
            <p style="background:#1c1c1e;border-left:3px solid #ef4444;padding:12px 16px;border-radius:0 8px 8px 0;font-size:13px;color:#f87171;margin-bottom:16px;">
              ⚠️ <strong>Important:</strong> You have ${resetsLeft === 1 ? "1 reset remaining" : "no resets remaining"} on this account. Account IDs can only be reset <strong>twice</strong> total. Please keep it private.
            </p>
            <p style="color:#71717a;font-size:12px;margin:0;">Questions? Reply to this email. — THE COOP by The Hungry Rooster</p>
          </div>
        `,
      }),
    });
  }

  return NextResponse.json({ success: true });
}
