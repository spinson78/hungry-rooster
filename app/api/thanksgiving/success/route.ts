import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  const { data: existing } = await supabase
    .from("thanksgiving_orders")
    .select("*")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (existing?.status === "confirmed") return NextResponse.json({ order: existing });

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
  }

  const m = session.metadata ?? {};

  const { data: order, error } = await supabase
    .from("thanksgiving_orders")
    .update({ status: "confirmed" })
    .eq("stripe_session_id", sessionId)
    .select()
    .single();

  const finalOrder = order ?? (error ? null : existing);
  if (!finalOrder) {
    // Fallback insert
    let parsedItems = [];
    try { parsedItems = JSON.parse(m.items || "[]"); } catch { parsedItems = []; }
    const { data: inserted } = await supabase
      .from("thanksgiving_orders")
      .insert({
        order_number: m.order_number,
        customer_name: m.customer_name,
        customer_email: m.customer_email || session.customer_email || "",
        customer_address: m.customer_address,
        items: parsedItems,
        subtotal: (session.amount_total || 0) / 100 / 1.0825,
        tax_amount: ((session.amount_total || 0) / 100) - ((session.amount_total || 0) / 100 / 1.0825),
        total: (session.amount_total || 0) / 100,
        special_requests: m.special_requests || "",
        stripe_session_id: sessionId,
        status: "confirmed",
      })
      .select()
      .single();
    if (inserted) {
      await sendEmails(inserted, session);
      return NextResponse.json({ order: inserted });
    }
    return NextResponse.json({ error: "Failed to confirm order" }, { status: 500 });
  }

  await sendEmails(finalOrder, session);
  return NextResponse.json({ order: finalOrder });
}

type TGOrder = {
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_address: string;
  items: Array<{ name: string; qty: number; unit_price: number }>;
  subtotal: number;
  tax_amount: number;
  total: number;
  special_requests?: string;
};

async function sendEmails(order: TGOrder, session: Stripe.Checkout.Session) {
  if (!process.env.RESEND_API_KEY) return;

  const itemRows = (order.items || [])
    .map((i) => `<tr>
      <td style="padding:6px 0;border-bottom:1px solid #27272a;">${i.qty}× ${i.name}</td>
      <td style="padding:6px 0;border-bottom:1px solid #27272a;text-align:right;">$${(i.unit_price * i.qty).toFixed(2)}</td>
    </tr>`)
    .join("");

  const receiptHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
      <h1 style="color:#f97316;margin:0 0 4px;">🦃 Order Confirmed!</h1>
      <p style="color:#71717a;margin:0 0 24px;font-size:14px;">Order #${order.order_number} · The Hungry Rooster</p>
      <p>Hi ${order.customer_name},</p>
      <p>Your Thanksgiving order is confirmed! We'll deliver everything to you on <strong>Wednesday, November 26</strong>.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:20px 0;">
        ${itemRows}
        <tr>
          <td style="padding:6px 0;color:#888;">Subtotal</td>
          <td style="padding:6px 0;text-align:right;">$${Number(order.subtotal).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#888;">Tax (8.25%)</td>
          <td style="padding:6px 0;text-align:right;">$${Number(order.tax_amount).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0 6px;font-weight:900;font-size:16px;color:#f97316;">Total Charged</td>
          <td style="padding:10px 0 6px;text-align:right;font-weight:900;font-size:16px;color:#f97316;">$${Number(order.total).toFixed(2)}</td>
        </tr>
      </table>
      <div style="background:#1c1c1e;border-radius:8px;padding:16px;margin:20px 0;font-size:13px;">
        <p style="margin:0 0 4px;color:#888;">Delivery address</p>
        <p style="margin:0;font-weight:bold;">${order.customer_address}</p>
        ${order.special_requests ? `<p style="margin:8px 0 0;color:#888;">Notes: ${order.special_requests}</p>` : ""}
      </div>
      <p style="color:#71717a;font-size:12px;">Questions? Reply to this email or call us. Happy Thanksgiving! 🦃</p>
      <p style="color:#71717a;font-size:12px;">— The Hungry Rooster · Dallas, TX</p>
    </div>`;

  const adminHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#f97316;">🦃 New Thanksgiving Order — ${order.order_number}</h2>
      <p><strong>Name:</strong> ${order.customer_name}</p>
      <p><strong>Email:</strong> ${order.customer_email}</p>
      <p><strong>Address:</strong> ${order.customer_address}</p>
      <p><strong>Delivery:</strong> Wednesday, November 26</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0;">
        ${itemRows}
        <tr><td><strong>Total</strong></td><td style="text-align:right;"><strong>$${Number(order.total).toFixed(2)}</strong></td></tr>
      </table>
      ${order.special_requests ? `<p><strong>Notes:</strong> ${order.special_requests}</p>` : ""}
    </div>`;

  const emails = [
    // Customer receipt
    ...(order.customer_email ? [{
      from: "The Hungry Rooster <sales@thehungryroostertx.com>",
      to: order.customer_email,
      subject: `🦃 Your Thanksgiving order is confirmed — #${order.order_number}`,
      html: receiptHtml,
    }] : []),
    // Admin notification
    {
      from: "The Hungry Rooster <sales@thehungryroostertx.com>",
      to: ["sales@thehungryroostertx.com"],
      subject: `🦃 Thanksgiving order — ${order.customer_name} · $${Number(order.total).toFixed(2)}`,
      html: adminHtml,
    },
  ];

  await Promise.allSettled(
    emails.map(e =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(e),
      })
    )
  );
}
