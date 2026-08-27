import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Use service role key server-side to bypass RLS (falls back to anon key if not set)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Send SMS opt-in confirmation via Twilio
async function sendOptInConfirmation(toE164: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !fromNumber) return;
  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        To:   toE164,
        From: fromNumber,
        Body: "The Hungry Rooster: You're subscribed! Expect weekly specials & updates from us. Reply STOP to unsubscribe. Msg & data rates may apply.",
      }).toString(),
    });
  } catch (err) {
    console.error("Opt-in confirmation SMS failed:", err);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    // ── Pre-saved menu / catering orders ──────────────────────────────────────
    const earlyOrderType = (session.metadata ?? {}).order_type || "";
    if ((earlyOrderType === "menu" || earlyOrderType === "catering") && (session.metadata ?? {}).order_id) {
      const preOrderId = (session.metadata ?? {}).order_id;
      const { data: presaved } = await supabase
        .from("orders")
        .select("id, status")
        .eq("id", preOrderId)
        .single();
      if (!presaved || presaved.status !== "pending_payment") {
        return NextResponse.json({ received: true });
      }
      await supabase
        .from("orders")
        .update({ status: "pending", stripe_session_id: session.id })
        .eq("id", preOrderId);
      // Add to SMS subscribers if opted in
      if ((session.metadata ?? {}).sms_opted_in === "true" && (session.metadata ?? {}).customer_phone) {
        const digits = ((session.metadata ?? {}).customer_phone || "").replace(/\D/g, "");
        const e164 = "+" + (digits.length === 10 ? "1" + digits : digits);
        const { data: existingSub } = await supabase.from("sms_subscribers").select("phone").eq("phone", e164).maybeSingle();
        await supabase.from("sms_subscribers").upsert(
          { phone: e164, name: (session.metadata ?? {}).customer_name || "", source: "order", opted_in_at: new Date().toISOString(), active: true },
          { onConflict: "phone" }
        );
        // Only send confirmation to new subscribers (not existing ones re-opting in)
        if (!existingSub) await sendOptInConfirmation(e164);
      }
      // Fire internal + customer notification for pre-saved orders (menu & catering)
      const { data: savedOrder } = await supabase
        .from("orders")
        .select("customer_name, customer_phone, customer_email, customer_address, special_requests, items, total")
        .eq("id", preOrderId)
        .single();
      if (savedOrder) {
        const notifyBase = process.env.NEXT_PUBLIC_BASE_URL || "https://www.thehungryroostertx.com";
        try {
          await fetch(`${notifyBase}/api/notify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_type: earlyOrderType,
              customer_name: savedOrder.customer_name,
              customer_phone: savedOrder.customer_phone,
              customer_email: savedOrder.customer_email,
              customer_address: savedOrder.customer_address,
              special_requests: savedOrder.special_requests,
              items: savedOrder.items,
              total: savedOrder.total,
            }),
          });
        } catch (notifyErr) {
          console.error(`${earlyOrderType} notify failed:`, notifyErr);
        }
      }
      console.log(`Pre-saved ${earlyOrderType} order ${preOrderId} marked paid`);
      return NextResponse.json({ received: true });
    }

    // Idempotency — check processed_sessions table (survives order deletion)
    const { data: processedSession } = await supabase
      .from("processed_sessions")
      .select("id")
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    if (processedSession) {
      console.log(`Session ${session.id} already processed — skipping`);
      return NextResponse.json({ received: true });
    }

    // Also check orders table as fallback for existing records
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    if (existing) {
      // Backfill processed_sessions so future retries are caught
      await supabase.from("processed_sessions").insert({ stripe_session_id: session.id, order_type: meta.order_type }).then(() => {});
      console.log(`Order already recorded for session ${session.id} — skipping`);
      return NextResponse.json({ received: true });
    }

    // Mark session as processed immediately before inserting order
    await supabase.from("processed_sessions").insert({ stripe_session_id: session.id, order_type: meta.order_type });

    // ── Gift card / dinner gift purchase ─────────────────────────
    // Handled entirely by /gift/success page — nothing to write to orders table
    if (meta.gift_type) {
      console.log(`Gift purchase (${meta.gift_type}) session ${session.id} — no order record needed`);
      return NextResponse.json({ received: true });
    }

    // ── Invoice payment ──────────────────────────────────────────
    if (meta.invoice_id) {
      const total = (session.amount_total || 0) / 100;
      await supabase
        .from("invoices")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_method: "stripe",
          stripe_session_id: session.id,
          total, // update total in case gratuity was added
        })
        .eq("id", meta.invoice_id);
      console.log(`Invoice ${meta.invoice_number} marked as paid via Stripe`);
      return NextResponse.json({ received: true });
    }

    // ── Fred's Bucks — handled by /api/coop/fredbucks/success ────────────────
    if (meta.teacher_name && meta.coupons_total) {
      console.log(`Fred's Bucks session ${session.id} — skipping regular order insert`);
      return NextResponse.json({ received: true });
    }

    // ── School account setup sessions — handled by /api/school/setup-confirm ──
    if (meta.student_pin || meta.billing_preference) {
      console.log(`School setup session ${session.id} — skipping regular order insert`);
      return NextResponse.json({ received: true });
    }

    // ── Akiba Lunch orders — handled by /api/akiba-lunch/success ─────────────
    if (meta.student_name && meta.cart) {
      console.log(`Akiba Lunch session ${session.id} — skipping regular order insert`);
      return NextResponse.json({ received: true });
    }

    // ── CoopChallah orders — handled by /api/coopchallah/success ─────────────
    if (meta.package && meta.name) {
      console.log(`CoopChallah session ${session.id} — skipping regular order insert`);
      return NextResponse.json({ received: true });
    }

    const order_type = meta.order_type || "dinner";
    const total = (session.amount_total || 0) / 100;

    let items: unknown[] = [];
    try {
      items = JSON.parse(meta.items || "[]");
    } catch {
      items = [];
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.thehungryroostertx.com";

    if (order_type === "group_order") {
      // Try to update the existing pending order created at checkout time
      const { data: existing } = await supabase
        .from("group_orders")
        .select("id")
        .eq("stripe_session_id", session.id)
        .single();

      if (existing) {
        // Update the pending row to paid — items/details already stored correctly
        const { error: updateError } = await supabase
          .from("group_orders")
          .update({ status: "paid", total })
          .eq("stripe_session_id", session.id);
        if (updateError) console.error("group_orders update error:", updateError);
      } else {
        // Fallback: insert (items will be empty since they're not in Stripe metadata)
        const { error: insertError } = await supabase.from("group_orders").insert({
          location_id: meta.location_id || null,
          location_slug: meta.location_slug || "",
          person_name: meta.person_name || "",
          items,
          total,
          special_requests: meta.special_requests || "",
          delivery_date: meta.delivery_date || null,
          status: "paid",
          stripe_session_id: session.id,
        });
        if (insertError) {
          console.error("Supabase group_orders insert error:", insertError);
          return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
        }
      }

      try {
        await fetch(`${baseUrl}/api/notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_type: "group_order",
            customer_name: meta.person_name || "",
            customer_phone: "",
            customer_email: "",
            customer_address: meta.location_name || "",
            special_requests: meta.special_requests || "",
            items,
            total,
          }),
        });
      } catch (notifyErr) {
        console.error("Notify call failed:", notifyErr);
      }
    } else {
      // Write to orders table (dinner / shabbat / bakery)
      const subtotal    = meta.subtotal   ? parseFloat(meta.subtotal)   : total;
      const taxAmount   = meta.tax_amount ? parseFloat(meta.tax_amount) : 0;
      const tipAmount   = meta.tip_amount ? parseFloat(meta.tip_amount) : 0;
      const orderNum    = `THR-${Date.now().toString().slice(-6)}`;
      const fulfillment = order_type === "dinner" ? "delivery" : "pickup";

      const { error: insertError } = await supabase.from("orders").insert({
        order_number:      orderNum,
        order_type,
        menu_id:           meta.menu_id || null,
        customer_name:     meta.customer_name || "",
        customer_email:    meta.customer_email || "",
        customer_phone:    meta.customer_phone || "",
        customer_address:  meta.customer_address || "",
        special_requests:  meta.special_requests || "",
        sms_opted_in:      meta.sms_opted_in === "true",
        items,
        subtotal,
        tax_amount:        taxAmount,
        tip_amount:        tipAmount,
        total,
        fulfillment_type:  fulfillment,
        status:            "pending",
        stripe_session_id: session.id,
      });

      if (insertError) {
        console.error("Supabase orders insert error:", JSON.stringify(insertError));
        return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
      }

      // Add to SMS subscribers if opted in
      if (meta.sms_opted_in === "true" && meta.customer_phone) {
        const digits = meta.customer_phone.replace(/\D/g, "");
        const e164 = "+" + (digits.length === 10 ? "1" + digits : digits);
        const { data: existingSub } = await supabase.from("sms_subscribers").select("phone").eq("phone", e164).maybeSingle();
        await supabase.from("sms_subscribers").upsert(
          { phone: e164, name: meta.customer_name || "", source: "order", opted_in_at: new Date().toISOString(), active: true },
          { onConflict: "phone" }
        );
        // Only send confirmation to new subscribers (not existing ones re-opting in)
        if (!existingSub) await sendOptInConfirmation(e164);
      }

      // Decrement quantity remaining
      if (meta.menu_id) {
        if (order_type === "dinner") {
          const { data: menuData } = await supabase
            .from("dinner_menus")
            .select("quantity_remaining")
            .eq("id", meta.menu_id)
            .single();
          if (menuData && menuData.quantity_remaining > 0) {
            await supabase
              .from("dinner_menus")
              .update({ quantity_remaining: menuData.quantity_remaining - 1 })
              .eq("id", meta.menu_id);
          }
        } else if (order_type === "shabbat" || order_type === "snackpack") {
          const { data: menuData } = await supabase
            .from("shabbat_menus")
            .select("quantity_remaining")
            .eq("id", meta.menu_id)
            .single();
          if (menuData && menuData.quantity_remaining > 0) {
            await supabase
              .from("shabbat_menus")
              .update({ quantity_remaining: menuData.quantity_remaining - 1 })
              .eq("id", meta.menu_id);
          }
        } else if (order_type === "bakery") {
          const { data: menuData } = await supabase
            .from("bakery_menus")
            .select("quantity_remaining")
            .eq("id", meta.menu_id)
            .single();
          if (menuData && menuData.quantity_remaining > 0) {
            await supabase
              .from("bakery_menus")
              .update({ quantity_remaining: menuData.quantity_remaining - 1 })
              .eq("id", meta.menu_id);
          }
        }
      }

      // Fire internal notification + customer confirmation
      try {
        await fetch(`${baseUrl}/api/notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_type,
            customer_name: meta.customer_name || "",
            customer_phone: meta.customer_phone || "",
            customer_email: meta.customer_email || "",
            customer_address: meta.customer_address || "",
            special_requests: meta.special_requests || "",
            items,
            total,
          }),
        });
      } catch (notifyErr) {
        console.error("Notify call failed:", notifyErr);
      }
    }
  }

  return NextResponse.json({ received: true });
}
