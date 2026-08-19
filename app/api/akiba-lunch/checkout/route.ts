import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });

const ITEMS: Record<string, { label: string; cents: number }> = {
  brisket_sandwich: { label: "Brisket Sandwich w/ French Fries", cents: 1650 },
  caesar_salad:     { label: "Chicken Caesar Salad",              cents: 2100 },
  bbq_wrap:         { label: "Crispy BBQ Chicken Wrap w/ Chips",  cents: 1650 },
};

const MEAL_CENTS = 500;

export async function POST(req: NextRequest) {
  const { student_name, grade, item_id, make_it_meal, drink } = await req.json();

  if (!student_name || !grade || !item_id || !ITEMS[item_id]) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (make_it_meal && !drink) {
    return NextResponse.json({ error: "Please choose a drink" }, { status: 400 });
  }

  const item = ITEMS[item_id];
  const totalCents = item.cents + (make_it_meal ? MEAL_CENTS : 0);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.thehungryroostertx.com";

  // Next Thursday delivery date
  const now = new Date();
  const daysToThursday = (4 - now.getDay() + 7) % 7 || 7;
  const thursday = new Date(now);
  thursday.setDate(now.getDate() + daysToThursday);
  const weekOf = thursday.toISOString().split("T")[0];

  const lineItems = [
    {
      price_data: {
        currency: "usd",
        product_data: { name: `${item.label} — ${student_name} (${grade})` },
        unit_amount: item.cents,
      },
      quantity: 1,
    },
  ];

  if (make_it_meal) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: `Make it a Meal — ${drink}` },
        unit_amount: MEAL_CENTS,
      },
      quantity: 1,
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${baseUrl}/akiba-lunch/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/akiba-lunch`,
      metadata: {
        student_name,
        grade,
        item_id,
        item_name: item.label,
        item_price: (item.cents / 100).toFixed(2),
        make_it_meal: make_it_meal ? "true" : "false",
        drink: drink || "",
        amount_total: (totalCents / 100).toFixed(2),
        week_of: weekOf,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
