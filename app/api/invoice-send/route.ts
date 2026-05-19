import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type LineItem = { description: string; qty: number; rate: number };

export async function POST(req: NextRequest) {
  const { invoice_id } = await req.json();

  const { data: inv, error } = await supabase.from("invoices").select("*").eq("id", invoice_id).single();
  if (error || !inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: inv.customer_email,
    line_items: (inv.line_items as LineItem[]).map(item => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.description || "Service" },
        unit_amount: Math.round(item.qty * item.rate * 100),
      },
      quantity: 1,
    })),
    success_url: `${baseUrl}/invoice/${inv.id}/paid`,
    cancel_url: `${baseUrl}/invoice/${inv.id}`,
    metadata: { invoice_id: inv.id, invoice_number: inv.invoice_number },
  });

  // Update invoice with checkout URL + status
  await supabase.from("invoices").update({
    stripe_checkout_url: session.url,
    stripe_session_id: session.id,
    status: "sent",
  }).eq("id", inv.id);

  // Build email
  const lineItemsHtml = (inv.line_items as LineItem[]).map(item => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #d4d4d8;">${item.description}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #a1a1aa; text-align: center;">${item.qty}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #ffffff; text-align: right; font-weight: bold;">$${(item.qty * item.rate).toFixed(2)}</td>
    </tr>
  `).join("");

  const dueLine = inv.due_date
    ? `<p style="color: #a1a1aa; font-size: 14px; margin: 4px 0;">Due: <strong style="color: #ffffff;">${new Date(inv.due_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong></p>`
    : "";

  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 620px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 40px 32px; border-radius: 12px;">
      <img src="https://hungry-rooster.vercel.app/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" style="height: 44px; margin-bottom: 32px;" />

      <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; margin-bottom: 4px;">Invoice ${inv.invoice_number}</h1>
      <p style="color: #71717a; font-size: 14px; margin-bottom: 6px;">Prepared for ${inv.customer_name}${inv.customer_company ? ` · ${inv.customer_company}` : ""}</p>
      ${dueLine}

      <div style="background: #18181b; border-radius: 10px; padding: 24px; margin: 28px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #52525b; padding-bottom: 10px; border-bottom: 1px solid #27272a;">Description</th>
              <th style="text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #52525b; padding-bottom: 10px; border-bottom: 1px solid #27272a;">Qty</th>
              <th style="text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #52525b; padding-bottom: 10px; border-bottom: 1px solid #27272a;">Amount</th>
            </tr>
          </thead>
          <tbody>${lineItemsHtml}</tbody>
        </table>
        <div style="text-align: right; padding-top: 16px; margin-top: 8px; border-top: 2px solid #3f3f46;">
          <span style="font-size: 22px; font-weight: 900; color: #2dd4bf;">Total: $${inv.total.toFixed(2)}</span>
        </div>
      </div>

      ${inv.notes ? `<div style="background: #18181b; border-radius: 10px; padding: 16px; margin-bottom: 24px;"><p style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Notes</p><p style="color: #d4d4d8; font-size: 14px; margin: 0;">${inv.notes}</p></div>` : ""}

      <a href="${session.url}" style="display: block; background: #2dd4bf; color: #000000; font-weight: 900; font-size: 18px; text-align: center; padding: 18px 32px; border-radius: 50px; text-decoration: none; margin-bottom: 16px;">
        Pay Invoice — $${inv.total.toFixed(2)} →
      </a>
      <p style="color: #52525b; font-size: 12px; text-align: center; margin-bottom: 32px;">Secure payment via Stripe. You'll receive a receipt upon completion.</p>

      <p style="color: #3f3f46; font-size: 12px; text-align: center;">The Hungry Rooster · 1499 Regal Row, Suite 206, Dallas TX</p>
      <p style="color: #3f3f46; font-size: 12px; text-align: center; margin-top: 4px;">Questions? Reply to this email or call us.</p>
    </div>
  `;

  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "The Hungry Rooster <onboarding@resend.dev>",
      to: [inv.customer_email],
      bcc: ["sales@thehungryroostertx.com"],
      subject: `Invoice ${inv.invoice_number} — $${inv.total.toFixed(2)} — The Hungry Rooster`,
      html: htmlBody,
    }),
  });

  if (!emailRes.ok) {
    const err = await emailRes.text();
    console.error("Resend error:", err);
    return NextResponse.json({ error: "Email failed to send" }, { status: 500 });
  }

  return NextResponse.json({ success: true, checkout_url: session.url });
}
