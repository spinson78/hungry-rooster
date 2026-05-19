import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const TAX_RATE = 0.0825;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { metadata, dinnerLabel, price, tipAmount } = body;
  const unitAmount = price ? Math.round(price * 100) : 8500;
  const taxAmount = Math.round(unitAmount * TAX_RATE);
  const tipCents = tipAmount ? Math.round(tipAmount * 100) : 0;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: "usd",
        product_data: { name: "The Dinner Drop", description: dinnerLabel },
        unit_amount: unitAmount,
      },
      quantity: 1,
    },
    {
      price_data: {
        currency: "usd",
        product_data: { name: "Sales Tax (8.25%)", description: "Texas state & local sales tax" },
        unit_amount: taxAmount,
      },
      quantity: 1,
    },
  ];

  if (tipCents > 0) {
    lineItem