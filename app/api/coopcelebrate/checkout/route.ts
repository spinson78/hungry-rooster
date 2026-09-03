import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://www.thehungryroostertx.com";

// 48-hour cutoff enforced server-side too
function isWithin48Hours(dateStr: string): boolean {
  const delivery = new Date(dateStr + "T00:00:00");
  const cutoff = new Date(Date.now() + 48 * 60 * 60 * 1000);
  return delivery < cutoff;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    order_type, purchaser_name, classroom, kids_name,
    delivery_date, delivery_time, student_count,
    quantity, cupcake_flavor, toppings, special_requests,
  } = body;

  if (!order_type || !purchaser_name || !classroom || !delivery_date || !delivery_time) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (isWithin48Hours(delivery_date)) {
    return NextResponse.json({ error: "Orders require 48 hours advance notice" }, { status: 400 });
  }

  // ── Price calculation ──────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lineItems: any[] = [];
  let subtotal = 0;

  if (order_type === "froyo") {
    const count = Number(student_count) || 1;
    subtotal = count * 5;
    lineItems = [{
      price_data: {
        currency: "usd",
        product_data: {
          name: "Frozen Yogurt Party",
          description: `${count} students · Frozen yogurt, spoon & sprinkles included`,
        },
        unit_amount: 500,
      },
      quantity: count,
    }];
  } else if (order_type === "cupcakes") {
    const qty = Number(quantity) || 1;
    subtotal = qty * 36;
    lineItems = [{
      price_data: {
        currency: "usd",
        product_data: {
          name: `Cupcakes — ${cupcake_flavor === "chocolate" ? "Chocolate" : "Vanilla"} (dozen)`,
          description: "1 dozen · includes sprinkles",
        },
        unit_amount: 3600,
      },
      quantity: qty,
    }];
  } else if (order_type === "celebration_pack") {
    const qty = Number(quantity) || 1;
    subtotal = qty * 100;
    const toppingsList = Array.isArray(toppings) ? toppings.slice(0, 2).join(" & ") : "";
    lineItems = [{
      price_data: {
        currency: "usd",
        product_data: {
          name: "The Coop Celebration Pack",
          description: `12 cupcakes + 12 frozen yogurts · Toppings: ${toppingsList || "TBD"}`,
        },
        unit_amount: 10000,
      },
      quantity: qty,
    }];
  } else {
    return NextResponse.json({ error: "Invalid order_type" }, { status: 400 });
  }

  const tax = subtotal * 0.0825;
  const total = subtotal + tax;

  // Tax line item
  lineItems.push({
    price_data: {
      currency: "usd",
      product_data: { name: "Tax (8.25%)" },
      unit_amount: Math.round(tax * 100),
    },
    quantity: 1,
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${BASE}/coopcelebrate/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE}/coopcelebrate`,
    customer_email: undefined,
    metadata: {
      order_type: "coopcelebrate",
      celebration_type: order_type,
      purchaser_name,
      classroom,
      kids_name: kids_name || "",
      delivery_date,
      delivery_time,
      student_count: String(student_count || ""),
      quantity: String(quantity || 1),
      cupcake_flavor: cupcake_flavor || "",
      toppings: JSON.stringify(toppings || []),
      special_requests: special_requests || "",
      subtotal: subtotal.toFixed(2),
      tax_amount: tax.toFixed(2),
    },
    custom_text: {
      submit: { message: "Once purchased, no changes can be made. Please double-check your order details." },
    },
  });

  return NextResponse.json({ url: session.url });
}
