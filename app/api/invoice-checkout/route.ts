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
  const { invoice_id, gratuity = 0 } = await req.json();

  const { data: inv, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoice_id)
    .single();

  if (error || !inv) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://thehungryroostertx.com";

  // Strip angle brackets from email if present e.g. <user@domain.com>
  const cleanEmail = inv.customer_email
    ? inv.customer_email.replace(/^[<\s]+|[>\s]+$/g, "").trim() || undefined
    : undefined;

  const lineItems: { price_data: { currency: string; product_data: { name: string }; unit_amount: number }; quantity: number }[] = [];

  // Taxable line items
  (inv.line_items as LineItem[]).forEach(item => {
    if (!item.description || item.qty * item.rate <= 0) return;
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: item.description },
        unit_amount: Math.round(item.qty * item.rate * 100),
      },
      quantity: 1,
    });
  });

  // Tax (8.25%) — skipped if tax_exempt
  const subtotal = (inv.line_items as LineItem[]).reduce((s: number, i: LineItem) => s + i.qty * i.rate, 0);
  const tax = subtotal * 0.0825;
  if (tax > 0 && !inv.tax_exempt) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Sales Tax (8.25%)" },
        unit_amount: Math.round(tax * 100),
      },
      quantity: 1,
    });
  }

  // Non-taxable fees
  if (inv.delivery_fee > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Delivery Fee" },
        unit_amount: Math.round(inv.delivery_fee * 100),
      },
      quantity: 1,
    });
  }
  if (inv.service_fee > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Service Fee" },
        unit_amount: Math.round(inv.service_fee * 100),
      },
      quantity: 1,
    });
  }

  // Customer-chosen gratuity
  const grat = Number(gratuity) || 0;
  if (grat > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Gratuity" },
        unit_amount: Math.round(grat * 100),
      },
      quantity: 1,
    });
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ error: "Invoice has no billable items" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: cleanEmail,
    line_items: lineItems,
    success_url: `${baseUrl}/invoice/${inv.id}/paid`,
    cancel_url: `${baseUrl}/invoice/${inv.id}`,
    metadata: {
      invoice_id: inv.id,
      invoice_number: inv.invoice_number,
      gratuity: String(grat),
    },
  });

  // Save the URL so admin can also copy it
  await supabase
    .from("invoices")
    .update({ stripe_checkout_url: session.url, stripe_session_id: session.id, status: "sent" })
    .eq("id", inv.id);

  return NextResponse.json({ url: session.url });
}
