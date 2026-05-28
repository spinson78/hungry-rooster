import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Use service role key server-side to bypass RLS (falls back to anon key if not set)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

    // Idempotency — if webhook fires twice or success page already wrote, skip
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    if (existing) {
      console.log(`Order already recorded for session ${session.id} — skipping`);
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";

    if (order_type === "group_order") {
      // Write to group_orders table
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
      // Write to orders table (dinner / shabbat)
      const { error: insertError } = await supabase.from("orders").insert({
        order_type,
        menu_id: meta.menu_id || null,
        customer_name: meta.customer_name || "",
        customer_email: meta.customer_email || "",
        customer_phone: meta.customer_phone || "",
        customer_address: meta.customer_address || "",
        special_requests: meta.special_requests || "",
        items,
        total,
        status: "paid",
        stripe_session_id: session.id,
      });

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
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
