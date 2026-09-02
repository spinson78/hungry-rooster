import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { order_type, customer_name, customer_phone, customer_email, customer_address, items, total, special_requests } = body;

  const typeLabel =
    order_type === "shabbat" ? "🕍 Shabbat Order" :
    order_type === "dinner" ? "🍽️ Dinner Drop Order" :
    order_type === "catering" ? "🍽️ Catering Package Order" :
    order_type === "catering_inquiry" ? "📋 Catering Inquiry" :
    order_type === "group_inquiry" ? "👥 Group Order Inquiry" :
    order_type === "bakery" ? "🥐 Fred's Fixins' Order" :
    "📦 New Order";

  const itemsList = Array.isArray(items)
    ? items.map((i: { name: string; protein?: string; side1?: string; side2?: string; extra?: string; description?: string }) => {
        let line = `• ${i.name}`;
        if (i.protein) line += ` — Protein: ${i.protein}`;
        if (i.side1) line += `, Side 1: ${i.side1}`;
        if (i.side2) line += `, Side 2: ${i.side2}`;
        if (i.extra) line += `, Side 3: ${i.extra}`;
        if (i.description) line += ` (${i.description})`;
        return line;
      }).join("\n")
    : "No items";

  const emailBody = `
${typeLabel} — NEW ORDER

Customer: ${customer_name}
Phone: ${customer_phone}
Email: ${customer_email || "Not provided"}
Delivery Address: ${customer_address}

ORDER:
${itemsList}

Total: $${total}
${special_requests ? `\nSpecial Requests: ${special_requests}` : ""}

---
Sent automatically by The Hungry Rooster ordering system.
  `.trim();

  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 32px; border-radius: 12px;">
      <img src="https://thehungryroostertx.com/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" style="height: 48px; margin-bottom: 24px;" />
      <h1 style="color: #2dd4bf; font-size: 24px; margin-bottom: 4px;">${typeLabel}</h1>
      <p style="color: #71717a; font-size: 14px; margin-bottom: 24px;">New order received — review and confirm with the customer.</p>

      <div style="background: #18181b; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
        <h2 style="color: #e9c46a; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Customer</h2>
        <p style="margin: 4px 0;"><strong>${customer_name}</strong></p>
        <p style="margin: 4px 0; color: #a1a1aa;">📞 ${customer_phone}</p>
        ${customer_email ? `<p style="margin: 4px 0; color: #a1a1aa;">✉️ ${customer_email}</p>` : ""}
        <p style="margin: 4px 0; color: #a1a1aa;">📍 ${customer_address}</p>
      </div>

      <div style="background: #18181b; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
        <h2 style="color: #e9c46a; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Order</h2>
        ${Array.isArray(items) ? items.map((i: { name: string; protein?: string; side1?: string; side2?: string; extra?: string; description?: string }) => `
          <div style="border-bottom: 1px solid #27272a; padding: 8px 0;">
            <p style="margin: 0; font-weight: bold;">${i.name}</p>
            ${i.protein ? `<p style="margin: 2px 0; color: #a1a1aa; font-size: 13px;">Protein: ${i.protein}</p>` : ""}
            ${i.side1 ? `<p style="margin: 2px 0; color: #a1a1aa; font-size: 13px;">Side 1: ${i.side1}</p>` : ""}
            ${i.side2 ? `<p style="margin: 2px 0; color: #a1a1aa; font-size: 13px;">Side 2: ${i.side2}</p>` : ""}
            ${i.extra ? `<p style="margin: 2px 0; color: #a1a1aa; font-size: 13px;">Side 3: ${i.extra}</p>` : ""}
            ${i.description ? `<p style="margin: 2px 0; color: #a1a1aa; font-size: 13px;">${i.description}</p>` : ""}
          </div>
        `).join("") : "<p>No items</p>"}
      </div>

      ${special_requests ? `
      <div style="background: #18181b; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
        <h2 style="color: #e9c46a; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Special Requests</h2>
        <p style="margin: 0; color: #d4d4d8;">${special_requests}</p>
      </div>
      ` : ""}

      <div style="background: #2dd4bf; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="margin: 0; color: #000000; font-weight: 900; font-size: 20px;">Total: $${total}</p>
        <p style="margin: 4px 0 0; color: #00403a; font-size: 12px;">${order_type === "group_order" || order_type === "catering" ? "Paid online via Stripe" : "Payment collected on delivery"}</p>
      </div>

      <p style="color: #3f3f46; font-size: 12px; text-align: center; margin-top: 24px;">The Hungry Rooster · 1499 Regal Row, Suite 206, Dallas TX</p>
    </div>
  `;

  // Internal notification to THR team — all order types
  const needsInternalNotify = true;
  if (needsInternalNotify) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Hungry Rooster <sales@thehungryroostertx.com>",
        to: ["sales@thehungryroostertx.com"],
        subject: `${typeLabel} — ${customer_name} — $${total}`,
        text: emailBody,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return NextResponse.json({ error: err }, { status: 500 });
    }
  }

  // Customer confirmation email (only if we have their email)
  if (customer_email) {
    const isShabbat  = order_type === "shabbat";
    const isDinner   = order_type === "dinner";
    const isBakery   = order_type === "bakery";
    const isGroup    = order_type === "group_order";
    const isInquiry  = order_type === "catering_inquiry";

    const confirmSubject = isShabbat
      ? "Shabbat Shalom! Your order is confirmed 🕯️"
      : isDinner
      ? "Order confirmed — Fred's on it 🐓"
      : isBakery
      ? "Your Fred's Fixins' order is confirmed 🥐"
      : isGroup
      ? "You're in! Group order confirmed 🐓"
      : isInquiry
      ? "We got your catering inquiry — The Hungry Rooster 🍽️"
      : "Your order is confirmed — The Hungry Rooster";

    const confirmHeadline = isShabbat
      ? "Shabbat Shalom!"
      : isBakery
      ? "Fresh from Fred's!"
      : isGroup
      ? `You're in, ${customer_name.split(" ")[0]}!`
      : isInquiry
      ? `Got it, ${customer_name.split(" ")[0]}!`
      : `You're confirmed, ${customer_name.split(" ")[0]}!`;

    const confirmSubline = isShabbat
      ? "Your Shabbat box is locked in. Fred will have it ready for Friday delivery."
      : isDinner
      ? "Your Dinner Drop is confirmed. Fred's already thinking about it."
      : isBakery
      ? "Your Fred's Fixins' order is confirmed. We'll have it fresh and ready for you."
      : isInquiry
      ? "We received your catering inquiry and our team will be in touch within 24 hours to talk through your event."
      : isGroup
      ? `Your order is paid and locked in for delivery to ${customer_address || "your office"}. Fred's crew will have it fresh and bagged with your name on it.`
      : "Your order is confirmed and paid. We'll be in touch with details.";

    const confirmHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 32px; border-radius: 12px;">
        <img src="https://thehungryroostertx.com/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" style="height: 48px; margin-bottom: 24px;" />
        <h1 style="color: #2dd4bf; font-size: 28px; margin-bottom: 8px;">${confirmHeadline}</h1>
        <p style="color: #a1a1aa; font-size: 16px; margin-bottom: 28px;">${confirmSubline}</p>

        <div style="background: #18181b; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h2 style="color: #e9c46a; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Your Order</h2>
          ${Array.isArray(items) ? items.map((i: { name: string; protein?: string; side1?: string; side2?: string; extra?: string; description?: string; qty?: number }) => `
            <div style="border-bottom: 1px solid #27272a; padding: 8px 0;">
              <p style="margin: 0; font-weight: bold;">${i.qty ? `${i.qty}x ` : ""}${i.name}</p>
              ${i.protein ? `<p style="margin: 2px 0; color: #a1a1aa; font-size: 13px;">Protein: ${i.protein}</p>` : ""}
              ${i.side1 ? `<p style="margin: 2px 0; color: #a1a1aa; font-size: 13px;">Side 1: ${i.side1}</p>` : ""}
              ${i.side2 ? `<p style="margin: 2px 0; color: #a1a1aa; font-size: 13px;">Side 2: ${i.side2}</p>` : ""}
              ${i.extra ? `<p style="margin: 2px 0; color: #a1a1aa; font-size: 13px;">Side 3: ${i.extra}</p>` : ""}
              ${i.description ? `<p style="margin: 2px 0; color: #a1a1aa; font-size: 13px;">${i.description}</p>` : ""}
            </div>
          `).join("") : ""}
        </div>

        ${customer_address ? `
        <div style="background: #18181b; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h2 style="color: #e9c46a; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Delivery Address</h2>
          <p style="margin: 0; color: #d4d4d8;">${customer_address}</p>
        </div>
        ` : ""}

        ${special_requests ? `
        <div style="background: #18181b; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h2 style="color: #e9c46a; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Special Requests</h2>
          <p style="margin: 0; color: #d4d4d8;">${special_requests}</p>
        </div>
        ` : ""}

        <div style="background: #2dd4bf; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <p style="margin: 0; color: #000000; font-weight: 900; font-size: 20px;">Total Paid: $${total}</p>
        </div>

        <p style="color: #71717a; font-size: 13px; margin-bottom: 4px;">Questions? Reply to this email or text us.</p>
        <p style="color: #3f3f46; font-size: 12px; margin-top: 24px;">The Hungry Rooster · 1499 Regal Row, Suite 206, Dallas TX · Mon–Fri 9am–2pm CST</p>
      </div>
    `;

    const confirmRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Hungry Rooster <sales@thehungryroostertx.com>",
        to: [customer_email],
        subject: confirmSubject,
        html: confirmHtml,
      }),
    });

    if (!confirmRes.ok) {
      const err = await confirmRes.text();
      console.error("Customer confirmation email failed:", err);
    }
  }

  return NextResponse.json({ success: true });
}
