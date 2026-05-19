import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
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

    // Stripe metadata values have a 500 char limit — truncate items if needed
    const itemsJson = JSON.stringify(items);
    const metadata = {
      order_type: "group_order",
      person_name: personName,
      special_requests: (specialRequests || "").slice(0, 500),
      location_id: locationId,
      location_slug: locationSlug,
      location_name: locationName,
      delivery_date: deliveryDate,
      items: itemsJson.length > 500 ? itemsJson.slice(0, 497) + "..." : itemsJson,
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
  } catch (err) {
    console.error("Group checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session. Please try again." }, { status: 500 });
  }
}
