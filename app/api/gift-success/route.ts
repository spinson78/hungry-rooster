import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";

function generateCode(prefix: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${code}`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Hungry Rooster <noreply@thehungryroostertx.com>",
        to,
        subject,
        html,
      }),
    });
  } catch (err) {
    console.error("Email send error:", err);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }

    const meta = session.metadata || {};
    const giftType = meta.gift_type;

    // Idempotency — check if already processed
    if (giftType === "gift_card") {
      const { data: existing } = await supabase
        .from("gift_cards")
        .select("id, code, recipient_name, recipient_email")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ success: true, code: existing.code, recipient_name: existing.recipient_name, gift_type: "gift_card" });
      }

      // Generate unique code
      let code = generateCode("THR");
      let attempt = 0;
      while (attempt < 5) {
        const { data: clash } = await supabase.from("gift_cards").select("id").eq("code", code).maybeSingle();
        if (!clash) break;
        code = generateCode("THR");
        attempt++;
      }

      const amountCents = parseInt(meta.amount_cents || "0");

      await supabase.from("gift_cards").insert({
        code,
        amount_cents: amountCents,
        balance_cents: amountCents,
        purchaser_name: meta.purchaser_name,
        purchaser_email: meta.purchaser_email,
        recipient_name: meta.recipient_name,
        recipient_email: meta.recipient_email,
        message: meta.message,
        stripe_session_id: sessionId,
        status: "active",
      });

      // Email to recipient if they have an email
      if (meta.recipient_email) {
        const displayAmount = (amountCents / 100).toFixed(2);
        const fromLine = meta.purchaser_name ? `<p style="font-size:16px;color:#555;">From: <strong>${meta.purchaser_name}</strong></p>` : "";
        const msgLine = meta.message ? `<blockquote style="border-left:4px solid #EFBE43;padding:8px 16px;color:#444;font-style:italic;margin:16px 0;">${meta.message}</blockquote>` : "";

        await sendEmail(
          meta.recipient_email,
          `You've received a $${displayAmount} gift card from The Hungry Rooster 🐓`,
          `
          <div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#111;color:#fff;border-radius:12px;overflow:hidden;">
            <div style="background:#1a1a1a;padding:24px 32px;text-align:center;">
              <p style="color:#EFBE43;font-weight:bold;letter-spacing:2px;font-size:11px;text-transform:uppercase;margin:0 0 8px;">The Hungry Rooster</p>
              <h1 style="font-size:28px;margin:0;color:#fff;">You've got dinner money 🎉</h1>
            </div>
            <div style="padding:32px;">
              ${fromLine}
              ${msgLine}
              <div style="background:#222;border:2px solid #EFBE43;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
                <p style="color:#aaa;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Your Gift Card Code</p>
                <p style="font-size:32px;font-weight:900;letter-spacing:4px;color:#EFBE43;margin:0;">${code}</p>
                <p style="color:#aaa;font-size:13px;margin:8px 0 0;">Value: <strong style="color:#fff;">$${displayAmount}</strong></p>
              </div>
              <p style="color:#ccc;font-size:14px;">Enter this code at checkout when you order on our website. Your balance never expires.</p>
              <div style="text-align:center;margin-top:28px;">
                <a href="${baseUrl}/menu" style="background:#007F7F;color:#fff;font-weight:900;padding:14px 32px;border-radius:100px;text-decoration:none;font-size:15px;">Order Now</a>
              </div>
            </div>
            <div style="padding:20px 32px;text-align:center;color:#555;font-size:12px;border-top:1px solid #333;">
              The Hungry Rooster · 1499 Regal Row, Dallas TX 75247
            </div>
          </div>
          `
        );
      }

      // Confirmation to purchaser
      if (meta.purchaser_email) {
        const displayAmount = (amountCents / 100).toFixed(2);
        await sendEmail(
          meta.purchaser_email,
          `Your Hungry Rooster gift card is on its way! 🐓`,
          `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;"><p>Hi ${meta.purchaser_name || "there"},</p><p>Your $${displayAmount} gift card for <strong>${meta.recipient_name || "your recipient"}</strong> has been sent${meta.recipient_email ? ` to ${meta.recipient_email}` : ""}.</p><p>Gift card code: <strong>${code}</strong></p><p>Thanks for sharing the love!</p><p>— The Hungry Rooster Team</p></div>`
        );
      }

      return NextResponse.json({ success: true, code, recipient_name: meta.recipient_name, gift_type: "gift_card" });
    }

    if (giftType === "dinner_gift") {
      const { data: existing } = await supabase
        .from("dinner_gifts")
        .select("id, claim_code, recipient_name, gift_type")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ success: true, claim_code: existing.claim_code, recipient_name: existing.recipient_name, gift_type: "dinner_gift", dinner_gift_type: meta.dinner_gift_type });
      }

      const dinnerGiftType = meta.dinner_gift_type || "claim_code";
      let claimCode: string | null = null;

      if (dinnerGiftType === "claim_code") {
        claimCode = generateCode("DINNER");
        let attempt = 0;
        while (attempt < 5) {
          const { data: clash } = await supabase.from("dinner_gifts").select("id").eq("claim_code", claimCode).maybeSingle();
          if (!clash) break;
          claimCode = generateCode("DINNER");
          attempt++;
        }
      }

      await supabase.from("dinner_gifts").insert({
        gift_type: dinnerGiftType,
        claim_code: claimCode,
        package_name: meta.package_name,
        package_price_cents: parseInt(meta.package_price_cents || "0"),
        serves: meta.serves,
        purchaser_name: meta.purchaser_name,
        purchaser_email: meta.purchaser_email,
        recipient_name: meta.recipient_name,
        recipient_email: meta.recipient_email,
        recipient_phone: meta.recipient_phone,
        message: meta.message,
        delivery_date: meta.delivery_date || null,
        delivery_address: meta.delivery_address || null,
        delivery_city_zip: meta.delivery_city_zip || null,
        stripe_session_id: sessionId,
        status: "pending",
      });

      // Notify recipient
      if (meta.recipient_email) {
        const fromLine = meta.purchaser_name ? `<p>From: <strong>${meta.purchaser_name}</strong></p>` : "";
        const msgLine = meta.message ? `<blockquote style="border-left:4px solid #EFBE43;padding:8px 16px;color:#444;font-style:italic;margin:16px 0;">${meta.message}</blockquote>` : "";

        if (dinnerGiftType === "claim_code") {
          await sendEmail(
            meta.recipient_email,
            `Someone sent you dinner from The Hungry Rooster 🍽️`,
            `
            <div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#111;color:#fff;border-radius:12px;overflow:hidden;">
              <div style="background:#1a1a1a;padding:24px 32px;text-align:center;">
                <p style="color:#EFBE43;font-weight:bold;letter-spacing:2px;font-size:11px;text-transform:uppercase;margin:0 0 8px;">The Hungry Rooster</p>
                <h1 style="font-size:28px;margin:0;color:#fff;">Dinner's on someone else tonight 🎉</h1>
              </div>
              <div style="padding:32px;">
                ${fromLine}
                ${msgLine}
                <div style="background:#222;border:2px solid #007F7F;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
                  <p style="color:#aaa;font-size:13px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Your Dinner</p>
                  <p style="font-size:22px;font-weight:900;color:#fff;margin:0;">${meta.package_name}</p>
                  ${meta.serves ? `<p style="color:#aaa;font-size:13px;margin:6px 0 0;">${meta.serves}</p>` : ""}
                </div>
                <p style="color:#ccc;font-size:14px;">Click below to claim your dinner — pick your date and delivery address and we'll take care of the rest.</p>
                <div style="text-align:center;margin-top:28px;">
                  <a href="${baseUrl}/gift/claim/${claimCode}" style="background:#EFBE43;color:#000;font-weight:900;padding:14px 32px;border-radius:100px;text-decoration:none;font-size:15px;">Claim My Dinner</a>
                </div>
                <p style="color:#555;font-size:12px;text-align:center;margin-top:16px;">Claim code: ${claimCode}</p>
              </div>
              <div style="padding:20px 32px;text-align:center;color:#555;font-size:12px;border-top:1px solid #333;">
                The Hungry Rooster · 1499 Regal Row, Dallas TX 75247
              </div>
            </div>
            `
          );
        } else {
          // Scheduled — let them know it's coming
          await sendEmail(
            meta.recipient_email,
            `A dinner delivery is headed your way from The Hungry Rooster 🍽️`,
            `
            <div style="font-family:sans-serif;max-width:540px;margin:0 auto;">
              ${fromLine}
              ${msgLine}
              <p>You have a dinner coming on <strong>${meta.delivery_date}</strong>:</p>
              <p><strong>${meta.package_name}</strong>${meta.serves ? ` (${meta.serves})` : ""}</p>
              <p>We'll deliver to: ${meta.delivery_address}, ${meta.delivery_city_zip}</p>
              <p>We'll reach out to confirm timing closer to the date. Enjoy!</p>
              <p>— The Hungry Rooster Team</p>
            </div>
            `
          );
        }
      }

      // Write scheduled gifts to orders table so they appear in admin Orders Log
      if (dinnerGiftType === "scheduled") {
        try {
          const priceDollars = parseInt(meta.package_price_cents || "0") / 100;
          const taxAmount = parseFloat((priceDollars * 0.0825).toFixed(2));
          await supabase.from("orders").insert({
            order_type: "gift_dinner",
            customer_name: meta.purchaser_name,
            customer_email: meta.purchaser_email,
            customer_phone: meta.recipient_phone || null,
            customer_address: `${meta.delivery_address}, ${meta.delivery_city_zip}`,
            items: [{ name: meta.package_name, qty: 1, serves: meta.serves, note: `Gift for ${meta.recipient_name}` }],
            subtotal: priceDollars,
            tax: taxAmount,
            total: parseFloat((priceDollars + taxAmount).toFixed(2)),
            status: "paid",
            fulfillment_type: "delivery",
            special_requests: `🎁 GIFT ORDER — Deliver on ${meta.delivery_date} to ${meta.recipient_name}${meta.recipient_phone ? ` (${meta.recipient_phone})` : ""}. From: ${meta.purchaser_name}. Message: "${meta.message}"`,
            stripe_session_id: sessionId,
          });
        } catch (err) { console.error("Gift order insert error:", err); }
      }

      return NextResponse.json({ success: true, claim_code: claimCode, recipient_name: meta.recipient_name, gift_type: "dinner_gift", dinner_gift_type: dinnerGiftType });
    }

    return NextResponse.json({ error: "Unknown gift type" }, { status: 400 });
  } catch (err) {
    console.error("Gift success error:", err);
    return NextResponse.json({ error: "Failed to process gift" }, { status: 500 });
  }
}
