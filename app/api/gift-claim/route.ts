import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";

// GET /api/gift-claim?code=DINNER-XXXX — fetch gift details
export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get("code")?.toUpperCase().trim();
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  const { data, error } = await supabase
    .from("dinner_gifts")
    .select("id, claim_code, package_name, serves, purchaser_name, recipient_name, message, status, gift_type")
    .eq("claim_code", code)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ valid: false, message: "Dinner gift not found." });
  if (data.status === "claimed" || data.status === "delivered") return NextResponse.json({ valid: false, message: "This dinner gift has already been claimed." });
  if (data.status === "cancelled") return NextResponse.json({ valid: false, message: "This dinner gift has been cancelled." });

  return NextResponse.json({ valid: true, ...data });
}

// POST /api/gift-claim — recipient submits their delivery details
export async function POST(req: NextRequest) {
  try {
    const { code, deliveryDate, deliveryAddress, deliveryCityZip, recipientName, recipientPhone } = await req.json();
    const cleanCode = (code || "").toUpperCase().trim();
    if (!cleanCode) return NextResponse.json({ error: "Code required" }, { status: 400 });

    const { data, error } = await supabase
      .from("dinner_gifts")
      .select("*")
      .eq("claim_code", cleanCode)
      .maybeSingle();

    if (error || !data) return NextResponse.json({ success: false, message: "Gift not found." });
    if (data.status !== "pending") return NextResponse.json({ success: false, message: "This gift has already been claimed." });

    await supabase
      .from("dinner_gifts")
      .update({
        status: "claimed",
        claimed_at: new Date().toISOString(),
        claim_delivery_date: deliveryDate || null,
        claim_delivery_address: deliveryAddress || null,
        claim_delivery_city_zip: deliveryCityZip || null,
      })
      .eq("id", data.id);

    // Write to orders table so it appears in admin Orders Log
    try {
      const priceDollars = data.package_price_cents / 100;
      const taxAmount = parseFloat((priceDollars * 0.0825).toFixed(2));
      await supabase.from("orders").insert({
        order_type: "gift_dinner",
        customer_name: data.recipient_name || recipientName,
        customer_email: data.recipient_email || null,
        customer_phone: data.recipient_phone || recipientPhone || null,
        customer_address: `${deliveryAddress}, ${deliveryCityZip}`,
        items: [{ name: data.package_name, qty: 1, serves: data.serves, note: "Claimed Gift Coupon" }],
        subtotal: priceDollars,
        tax: taxAmount,
        total: parseFloat((priceDollars + taxAmount).toFixed(2)),
        status: "paid",
        fulfillment_type: "delivery",
        special_requests: `🎁 GIFT CLAIM — Deliver on ${deliveryDate}. Originally purchased by ${data.purchaser_name}. Claim code: ${cleanCode}.${data.message ? ` Message: "${data.message}"` : ""}`,
      });
    } catch (err) { console.error("Gift claim order insert error:", err); }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Gift claim error:", err);
    return NextResponse.json({ error: "Failed to claim gift" }, { status: 500 });
  }
}
