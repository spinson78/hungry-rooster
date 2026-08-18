import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

const PACKAGE_LABELS: Record<string, string> = {
  weekly_challah:       "Challah — Single Order",
  weekly_babka:         "Babka — Single Order",
  s1_1challah:          "Semester 1 · 1 Challah/week",
  s1_2challah:          "Semester 1 · 2 Challah/week",
  s1_1challah_1babka:   "Semester 1 · 1 Challah + 1 Babka",
  s1_2challah_1babka:   "Semester 1 · 2 Challah + 1 Babka",
  s2_1challah:          "Semester 2 · 1 Challah/week",
  s2_2challah:          "Semester 2 · 2 Challah/week",
  s2_1challah_1babka:   "Semester 2 · 1 Challah + 1 Babka",
  s2_2challah_1babka:   "Semester 2 · 2 Challah + 1 Babka",
  fy_1challah:          "Full Year · 1 Challah/week",
  fy_2challah:          "Full Year · 2 Challah/week",
  fy_1challah_1babka:   "Full Year · 1 Challah + 1 Babka",
  fy_2challah_1babka:   "Full Year · 2 Challah + 1 Babka",
};

export async function POST(req: NextRequest) {
  const { name, phone, order_type, package: pkg, babka_flavor, is_installment } = await req.json();
  if (!name || !phone || !order_type || !pkg) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.thehungryroostertx.com";
  const label = PACKAGE_LABELS[pkg] || pkg;
  const flavorNote = babka_flavor ? ` (${babka_flavor} babka)` : "";
  const productName = `THE COOP · ${label}${flavorNote}`;

  try {
    // Create or find Stripe customer
    const customer = await stripe.customers.create({
      name,
      phone,
      metadata: { order_type, package: pkg, babka_flavor: babka_flavor || "" },
    });

    let amountCents: number;
    let sessionDescription = productName;

    if (is_installment) {
      // Charge only first installment at checkout
      const prices: Record<string, number> = {
        fy_1challah_1babka: 65100,
        fy_2challah_1babka: 82700,
      };
      const total = prices[pkg] || 0;
      amountCents = Math.round(total / 4);
      sessionDescription = `${productName} — Installment 1 of 4`;
    } else {
      const prices: Record<string, number> = {
        weekly_challah: 650,
        weekly_babka: 1800,
        s1_1challah: 7600,
        s1_2challah: 15200,
        s1_1challah_1babka: 29000,
        s1_2challah_1babka: 36600,
        s2_1challah: 10500,
        s2_2challah: 21000,
        s2_1challah_1babka: 39500,
        s2_2challah_1babka: 50000,
        fy_1challah: 17200,
        fy_2challah: 34400,
        fy_1challah_1babka: 65100,
        fy_2challah_1babka: 82700,
      };
      amountCents = prices[pkg] || 0;
    }

    if (!amountCents) return NextResponse.json({ error: "Unknown package" }, { status: 400 });

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customer.id,
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: sessionDescription },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      success_url: `${baseUrl}/coopchallah/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/coopchallah`,
      metadata: {
        name,
        phone,
        order_type,
        package: pkg,
        babka_flavor: babka_flavor || "",
        is_installment: is_installment ? "true" : "false",
      },
    };

    // Save card for future installment charges
    if (is_installment) {
      sessionParams.payment_intent_data = {
        setup_future_usage: "off_session",
        metadata: { order_type, package: pkg, is_installment: "true" },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
