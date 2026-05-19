import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const TAX_RATE = 0.0825;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lineItems, metadata, tipAmount } = body;

  // Calculate subtotal from line items
  const subtotalCents = (lineItems as { price_data: { unit_amount: number }; quantity: number }[])
    .reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0);

  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const tipCents = tipAmount ? Math.round(tipAmount * 100) : 0;

  const allLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    ...lineItems,
    {
      price_data: {
        currency: "usd",
        product_d