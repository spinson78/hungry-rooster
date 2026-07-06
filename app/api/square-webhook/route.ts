import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Square HMAC-SHA256 signature verification
function verifySignature(body: string, signature: string, key: string, url: string): boolean {
  try {
    const hmac = crypto.createHmac("sha256", key);
    hmac.update(url + body);
    const expected = hmac.digest("base64");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature") || "";
  const webhookKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || "";

  // Verify signature if key is configured
  if (webhookKey && signature) {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL || "https://thehungryroostertx.com"}/api/square-webhook`;
    if (!verifySignature(body, signature, webhookKey, url)) {
      console.error("Square webhook: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only handle order.created events
  if (event.type !== "order.created") {
    return NextResponse.json({ received: true });
  }

  const eventData = event.data as Record<string, unknown> | undefined;
  const orderObj = (eventData?.object as Record<string, unknown> | undefined)?.order as Record<string, unknown> | undefined;

  if (!orderObj) {
    return NextResponse.json({ received: true });
  }

  // Determine if this is a DoorDash or Uber Eats order
  const sourceName = ((orderObj.source as Record<string, string> | undefined)?.name || "").toLowerCase();
  let orderType: string;

  if (sourceName.includes("doordash") || sourceName.includes("door dash")) {
    orderType = "doordash";
  } else if (sourceName.includes("uber")) {
    orderType = "ubereats";
  } else {
    // Not a delivery app order — ignore (Square POS orders go through existing flow)
    return NextResponse.json({ received: true });
  }

  const squareOrderId = orderObj.id as string;

  // Idempotency — use stripe_session_id field to store Square order ID
  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_session_id", `square_${squareOrderId}`)
    .maybeSingle();

  if (existing) {
    console.log(`Square order ${squareOrderId} already recorded — skipping`);
    return NextResponse.json({ received: true });
  }

  // Parse line items
  const lineItems = (orderObj.line_items as Array<Record<string, unknown>> | undefined) || [];
  const items = lineItems.map((item) => ({
    name: (item.name as string) || (item.variation_name as string) || "Item",
    qty: parseInt((item.quantity as string) || "1", 10),
    price: ((item.base_price_money as Record<string, number> | undefined)?.amount || 0) / 100,
  }));

  // Parse totals
  const total    = ((orderObj.total_money    as Record<string, number> | undefined)?.amount || 0) / 100;
  const subtotal = ((orderObj.total_money    as Record<string, number> | undefined)?.amount || 0) / 100;
  const taxAmt   = ((orderObj.total_tax_money as Record<string, number> | undefined)?.amount || 0) / 100;
  const tipAmt   = ((orderObj.total_tip_money as Record<string, number> | undefined)?.amount || 0) / 100;

  // Get customer name from fulfillment details
  const fulfillments = (orderObj.fulfillments as Array<Record<string, unknown>> | undefined) || [];
  const fulfillment  = fulfillments[0] as Record<string, unknown> | undefined;
  const pickupRecipient   = (fulfillment?.pickup_details   as Record<string, unknown> | undefined)?.recipient   as Record<string, string> | undefined;
  const deliveryRecipient = (fulfillment?.delivery_details as Record<string, unknown> | undefined)?.recipient as Record<string, string> | undefined;
  const customerName = pickupRecipient?.display_name || deliveryRecipient?.display_name
    || (orderType === "doordash" ? "DoorDash Order" : "Uber Eats Order");

  // Pull any order-level note
  const note = (orderObj.metadata as Record<string, string> | undefined)?.note || "";

  const orderNum = `THR-${Date.now().toString().slice(-6)}`;

  const { error: insertError } = await supabase.from("orders").insert({
    order_number:      orderNum,
    order_type:        orderType,
    menu_id:           null,
    customer_name:     customerName,
    customer_email:    "",
    customer_phone:    "",
    customer_address:  "Via Delivery App",
    special_requests:  note,
    sms_opted_in:      false,
    items,
    subtotal,
    tax_amount:        taxAmt,
    tip_amount:        tipAmt,
    total,
    fulfillment_type:  "delivery",
    status:            "pending",
    stripe_session_id: `square_${squareOrderId}`,
  });

  if (insertError) {
    console.error("Square webhook: Supabase insert error", insertError);
    return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
  }

  console.log(`Square ${orderType} order ${squareOrderId} → KDS (${customerName}, $${total})`);
  return NextResponse.json({ received: true });
}
