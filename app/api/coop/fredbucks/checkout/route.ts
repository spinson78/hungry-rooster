import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { teacher_name, teacher_email, school_name, amount } = await req.json();

  if (!teacher_name || !teacher_email || !amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (amount % 50 !== 0 || amount < 50 || amount > 500) {
    return NextResponse.json({ error: "Amount must be in $50 increments (max $500)" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";
  const coupons = amount / 5;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: {
          name: `Fred's Bucks — ${coupons} coupons ($5 each)`,
          description: `THE COOP by The Hungry Rooster · Pick up at The Coop Counter after purchase`,
          images: [],
        },
        unit_amount: amount * 100,
      },
      quantity: 1,
    }],
    customer_email: teacher_email,
    success_url: `${baseUrl}/coop/fredbucks/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/coop/fredbucks`,
    metadata: {
      teacher_name,
      teacher_email,
      school_name: school_name || "",
      amount: amount.toString(),
      coupons_total: coupons.toString(),
    },
  });

  return NextResponse.json({ url: session.url });
}
