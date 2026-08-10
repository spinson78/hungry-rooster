import { NextRequest, NextResponse } from "next/server";
// NextRequest used for type annotation on _req
import { createClient } from "@supabase/supabase-js";

const REVIEW_LINK = "https://g.page/r/CelZGPN-7w0SEBE/review";

export async function GET(_req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Find orders that:
  // - have a customer email
  // - haven't had a review email sent yet
  // - are at least 6 hours old (delivery happened) but no more than 36 hours old
  // - are not Uber Eats / DoorDash (no email available for those)
  const now = Date.now();
  const sixHoursAgo  = new Date(now - 6  * 3600 * 1000).toISOString();
  const thirtySixHoursAgo = new Date(now - 36 * 3600 * 1000).toISOString();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, customer_name, customer_email, order_type, total")
    .not("customer_email", "is", null)
    .neq("customer_email", "")
    .eq("review_email_sent", false)
    .not("order_type", "in", '("ubereats","doordash")')
    .lte("created_at", sixHoursAgo)
    .gte("created_at", thirtySixHoursAgo);

  if (error) {
    console.error("review-email cron: DB error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ sent: 0, message: "No eligible orders" });
  }

  let sent = 0;
  const failures: string[] = [];

  for (const order of orders) {
    const firstName = order.customer_name?.split(" ")[0] || "there";

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 32px; border-radius: 12px;">
        <img src="https://thehungryroostertx.com/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" style="height: 48px; margin-bottom: 28px;" />

        <h1 style="color: #2dd4bf; font-size: 26px; margin-bottom: 8px;">How was your order, ${firstName}?</h1>
        <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin-bottom: 28px;">
          We hope Fred came through for you. We read every review — good or bad — and it means the world to a small business like ours.
        </p>

        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${REVIEW_LINK}" style="display: inline-block; background: #e9c46a; color: #000000; font-weight: 900; font-size: 18px; padding: 16px 40px; border-radius: 50px; text-decoration: none;">
            ⭐ Leave Us a Google Review
          </a>
          <p style="color: #52525b; font-size: 13px; margin-top: 12px;">Takes less than a minute. Every star helps.</p>
        </div>

        <div style="background: #18181b; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <p style="color: #71717a; font-size: 13px; margin: 0 0 4px;">Your recent order</p>
          <p style="margin: 0; font-weight: 700; font-size: 16px; color: #ffffff;">
            ${order.order_type === "shabbat" ? "Shabbat Box" :
              order.order_type === "dinner" ? "Dinner Drop" :
              order.order_type === "catering" ? "Catering Package" :
              order.order_type === "group_order" ? "Group Order" :
              order.order_type === "menu" ? "Menu Order" :
              "Order"} — $${order.total}
          </p>
        </div>

        <p style="color: #52525b; font-size: 13px; margin-bottom: 4px;">
          Questions or something wasn't right? Reply directly to this email — we'll make it right.
        </p>
        <p style="color: #3f3f46; font-size: 12px; margin-top: 24px;">
          The Hungry Rooster · 1499 Regal Row, Suite 206, Dallas TX · Mon–Fri 9am–2pm CST
        </p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Hungry Rooster <sales@thehungryroostertx.com>",
        to: [order.customer_email],
        subject: `How was your order, ${firstName}? 🐓`,
        html,
      }),
    });

    if (res.ok) {
      await supabase
        .from("orders")
        .update({ review_email_sent: true })
        .eq("id", order.id);
      sent++;
    } else {
      const err = await res.text();
      console.error(`review-email: failed for order ${order.id}:`, err);
      failures.push(order.id);
    }
  }

  console.log(`review-email cron: sent ${sent}, failed ${failures.length}`);
  return NextResponse.json({ sent, failed: failures.length });
}
