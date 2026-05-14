import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { items, personName, specialRequests, locationId, locationSlug, locationName, deliveryDate } = body;

  const lineItems = items.map((item: { name: string; price: number; qty: number; description: string }) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.name,
        description: item.description,
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.qty,
  }));

  const metadata = {
    person_name: personName,
    special_requests: specialRequests || "",
    location_id: locationId,
    location_slug: locationSlug,
    location_name: locationName,
    delivery_date: deliveryDate,
    items: JSON.stringify(items),
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${baseUrl}/group/${locationSlug}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/group/${locationSlug}`,
    metadata,
    custom_text: {
      submit: { message: `Ordering for ${locationName} - Delivery ${deliveryDate}` },
    },
  });

  return NextResponse.json({ url: session.url });
}
