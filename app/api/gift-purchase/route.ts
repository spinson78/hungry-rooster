import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const TAX_RATE = 0.0825;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { giftType } = body;

    if (giftType === "gift_card") {
      // Dollar-amount gift card
      const { amount, qty: gcQty, purchaserName, purchaserEmail, recipientName, recipientEmail, message } = body;
      const singleAmountCents = Math.round(parseFloat(amount) * 100);
      const cardQty = Math.max(1, parseInt(gcQty) || 1);
      if (!singleAmountCents || singleAmountCents < 1000) {
        return NextResponse.json({ error: "Minimum gift card amount is $10" }, { status: 400 });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `The Hungry Rooster Gift Card — $${(singleAmountCents / 100).toFixed(2)}`,
                description: recipientName ? `A gift for ${recipientName}` : "Digital gift card",
              },
              unit_amount: singleAmountCents,
            },
            quantity: cardQty,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/gift/success?session_id={CHECKOUT_SESSION_ID}&type=gift_card`,
        cancel_url: `${baseUrl}/gift`,
        metadata: {
          gift_type: "gift_card",
          amount_cents: String(singleAmountCents),
          qty: String(cardQty),
          purchaser_name: purchaserName || "",
          purchaser_email: purchaserEmail || "",
          recipient_name: recipientName || "",
          recipient_email: recipientEmail || "",
          message: (message || "").slice(0, 490),
        },
        customer_email: purchaserEmail || undefined,
      });

      return NextResponse.json({ url: session.url });
    }

    if (giftType === "dinner_gift") {
      // Send a dinner -- scheduled OR claim code
      const {
        dinnerGiftType,   // "scheduled" | "claim_code"
        packageName,
        packagePrice,
        serves,
        qty: dinnerQty,
        addCookies,
        purchaserName,
        purchaserEmail,
        recipientName,
        recipientEmail,
        recipientPhone,
        message,
        // scheduled only:
        deliveryDate,
        deliveryAddress,
        deliveryCityZip,
      } = body;

      const dinnerCount = Math.max(1, parseInt(dinnerQty) || 1);
      const priceCents = Math.round(parseFloat(packagePrice) * 100);
      const cookieCents = addCookies ? 2400 : 0;
      const subtotalCents = (priceCents + cookieCents) * dinnerCount;
      const taxCents = Math.round(subtotalCents * TAX_RATE);

      const lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Send a Dinner: ${packageName}`,
              description: dinnerGiftType === "scheduled"
                ? `Scheduled delivery to ${recipientName} on ${deliveryDate}`
                : `Dinner coupon for ${recipientName} — they'll claim & schedule online`,
            },
            unit_amount: priceCents,
          },
          quantity: dinnerCount,
        },
        ...(addCookies ? [{
          price_data: {
            currency: "usd" as const,
            product_data: { name: "Add-on: A Dozen Mini Cookies", description: "Freshly baked cookies delivered with the dinner" },
            unit_amount: 2400,
          },
          quantity: dinnerCount,
        }] : []),
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Sales Tax (8.25%)" },
            unit_amount: taxCents,
          },
          quantity: 1,
        },
      ];

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${baseUrl}/gift/success?session_id={CHECKOUT_SESSION_ID}&type=dinner_gift`,
        cancel_url: `${baseUrl}/gift`,
        metadata: {
          gift_type: "dinner_gift",
          dinner_gift_type: dinnerGiftType || "claim_code",
          qty: String(dinnerCount),
          package_name: packageName || "",
          package_price_cents: String(priceCents),
          add_cookies: addCookies ? "true" : "false",
          serves: serves || "",
          purchaser_name: purchaserName || "",
          purchaser_email: purchaserEmail || "",
          recipient_name: recipientName || "",
          recipient_email: recipientEmail || "",
          recipient_phone: recipientPhone || "",
          message: (message || "").slice(0, 490),
          delivery_date: deliveryDate || "",
          delivery_address: deliveryAddress || "",
          delivery_city_zip: deliveryCityZip || "",
        },
        customer_email: purchaserEmail || undefined,
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: "Invalid gift type" }, { status: 400 });
  } catch (err) {
    console.error("Gift purchase error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
