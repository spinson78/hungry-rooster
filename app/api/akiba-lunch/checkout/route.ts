import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });

const ITEMS: Record<string, { label: string; cents: number; price: number }> = {
  brisket_sandwich: { label: "Brisket Sandwich w/ French Fries",  cents: 1650, price: 16.50 },
  caesar_salad:     { label: "Chicken Caesar Salad",               cents: 2100, price: 21.00 },
  bbq_wrap:         { label: "Crispy BBQ Chicken Wrap w/ Chips",   cents: 1650, price: 16.50 },
  tenders:          { label: "5 Pc Tenders & Fries",               cents: 1800, price: 18.00 },
};

const MEAL_CENTS = 500;

interface CartItem { item_id: string; qty: number; meal_count: number; }

export async function POST(req: NextRequest) {
  const { student_name, grade, cart, drink } = await req.json() as {
    student_name: string; grade: string; cart: CartItem[]; drink?: string;
  };

  if (!student_name || !grade || !Array.isArray(cart) || cart.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const totalMeals = cart.reduce((sum, c) => sum + (c.meal_count || 0), 0);
  if (totalMeals > 0 && !drink) {
    return NextResponse.json({ error: "Please choose a drink for meal add-ons" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.thehungryroostertx.com";
  const now = new Date();
  const daysToFriday = (5 - now.getDay() + 7) % 7 || 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + daysToFriday);
  const weekOf = friday.toISOString().split("T")[0];

  const lineItems: { price_data: { currency: string; product_data: { name: string }; unit_amount: number }; quantity: number }[] = [];

  for (const { item_id, qty, meal_count } of cart) {
    const item = ITEMS[item_id];
    if (!item || qty < 1) continue;
    lineItems.push({
      price_data: { currency: "usd", product_data: { name: `${item.label} — ${student_name} (${grade})` }, unit_amount: item.cents },
      quantity: qty,
    });
    if ((meal_count || 0) > 0) {
      lineItems.push({
        price_data: { currency: "usd", product_data: { name: `Meal Add-on (${drink}) — ${student_name}` }, unit_amount: MEAL_CENTS },
        quantity: meal_count,
      });
    }
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ error: "No valid items in cart" }, { status: 400 });
  }

  const cartSummary = cart
    .filter(c => c.qty > 0)
    .map(c => `${c.qty}× ${ITEMS[c.item_id]?.label}${(c.meal_count || 0) > 0 ? ` (+${c.meal_count} meal)` : ""}`)
    .join(", ");

  const totalCents = lineItems.reduce((sum, li) => sum + li.price_data.unit_amount * li.quantity, 0);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${baseUrl}/akiba-lunch/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/akiba-lunch`,
      metadata: {
        student_name,
        grade,
        cart: JSON.stringify(cart),
        cart_summary: cartSummary,
        drink: drink || "",
        total_meals: String(totalMeals),
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
