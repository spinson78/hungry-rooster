import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TYPE_LABELS: Record<string, string> = {
  menu:        "Menu (Walk-in)",
  dinner:      "Dinner Drop",
  shabbat:     "Shabbat Box",
  bakery:      "Fred's Fixins'",
  catering:    "Catering",
  group_order: "Group Order",
  gift_dinner: "Gift — Dinner",
};

function fmt(n: number) {
  return `$${Number(n).toFixed(2)}`;
}

function getPreviousWeekRange(): { from: Date; to: Date; label: string } {
  const now = new Date();
  // Find last Monday
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - daysToLastMonday - 7);
  lastMonday.setHours(0, 0, 0, 0);

  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  lastSunday.setHours(23, 59, 59, 999);

  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const label = `${lastMonday.toLocaleDateString("en-US", opts)} – ${lastSunday.toLocaleDateString("en-US", opts)}, ${lastSunday.getFullYear()}`;

  return { from: lastMonday, to: lastSunday, label };
}

export async function GET(req: NextRequest) {
  // Verify cron secret — Vercel sends this automatically, or you can call manually
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { from, to, label } = getPreviousWeekRange();

  // Fetch all orders from last week
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Weekly report fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  const rows = orders || [];

  // Compute summary
  const summary = rows.reduce(
    (acc, o) => ({
      count:   acc.count + 1,
      revenue: acc.revenue + Math.max(0, (Number(o.total) || 0) - (Number(o.tax_amount) || 0) - (Number(o.tip_amount) || 0)),
      tax:     acc.tax    + (Number(o.tax_amount) || 0),
      tips:    acc.tips   + (Number(o.tip_amount) || 0),
      total:   acc.total  + (Number(o.total) || 0),
    }),
    { count: 0, revenue: 0, tax: 0, tips: 0, total: 0 }
  );

  // Breakdown by type
  const byType: Record<string, { count: number; revenue: number; tax: number; tips: number; total: number }> = {};
  rows.forEach(o => {
    const t = o.order_type || "unknown";
    if (!byType[t]) byType[t] = { count: 0, revenue: 0, tax: 0, tips: 0, total: 0 };
    byType[t].count++;
    byType[t].tax     += Number(o.tax_amount) || 0;
    byType[t].tips    += Number(o.tip_amount) || 0;
    byType[t].total   += Number(o.total) || 0;
    byType[t].revenue += Math.max(0, (Number(o.total) || 0) - (Number(o.tax_amount) || 0) - (Number(o.tip_amount) || 0));
  });

  const byTypeSorted = Object.entries(byType).sort((a, b) => b[1].total - a[1].total);

  // Build HTML email
  const summaryCards = `
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:28px;">
      ${[
        { label: "Orders",       value: String(summary.count),       color: "#ffffff" },
        { label: "Revenue",      value: fmt(summary.revenue),        color: "#2dd4bf" },
        { label: "Tax Collected",value: fmt(summary.tax),            color: "#e9c46a" },
        { label: "Tips",         value: fmt(summary.tips),           color: "#fb923c" },
        { label: "Gross Total",  value: fmt(summary.total),          color: "#ffffff" },
      ].map(c => `
        <div style="background:#1c1c1e;border:1px solid #2d2d2f;border-radius:10px;padding:16px 20px;min-width:120px;">
          <p style="margin:0 0 4px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;">${c.label}</p>
          <p style="margin:0;color:${c.color};font-size:22px;font-weight:900;">${c.value}</p>
        </div>
      `).join("")}
    </div>
  `;

  const typeTable = `
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;font-size:13px;">
      <thead>
        <tr style="border-bottom:2px solid #2d2d2f;">
          <th style="text-align:left;padding:8px 12px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Type</th>
          <th style="text-align:right;padding:8px 12px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Orders</th>
          <th style="text-align:right;padding:8px 12px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Revenue</th>
          <th style="text-align:right;padding:8px 12px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Tax</th>
          <th style="text-align:right;padding:8px 12px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${byTypeSorted.map(([type, d]) => `
          <tr style="border-bottom:1px solid #1c1c1e;">
            <td style="padding:9px 12px;color:#d4d4d8;font-weight:bold;">${TYPE_LABELS[type] || type}</td>
            <td style="padding:9px 12px;text-align:right;color:#71717a;">${d.count}</td>
            <td style="padding:9px 12px;text-align:right;color:#2dd4bf;font-weight:bold;">${fmt(d.revenue)}</td>
            <td style="padding:9px 12px;text-align:right;color:#e9c46a;">${fmt(d.tax)}</td>
            <td style="padding:9px 12px;text-align:right;color:#ffffff;font-weight:900;">${fmt(d.total)}</td>
          </tr>
        `).join("")}
        <tr style="border-top:2px solid #2d2d2f;background:#1c1c1e;">
          <td style="padding:10px 12px;color:#ffffff;font-weight:900;">TOTAL</td>
          <td style="padding:10px 12px;text-align:right;color:#ffffff;font-weight:900;">${summary.count}</td>
          <td style="padding:10px 12px;text-align:right;color:#2dd4bf;font-weight:900;">${fmt(summary.revenue)}</td>
          <td style="padding:10px 12px;text-align:right;color:#e9c46a;font-weight:900;">${fmt(summary.tax)}</td>
          <td style="padding:10px 12px;text-align:right;color:#ffffff;font-weight:900;">${fmt(summary.total)}</td>
        </tr>
      </tbody>
    </table>
  `;

  const orderRows = rows.map(o => {
    const itemList = Array.isArray(o.items)
      ? o.items.map((i: { name?: string; qty?: number; quantity?: number }) =>
          `${i.qty || i.quantity || 1}x ${i.name || "Item"}`
        ).join(", ")
      : "—";
    return `
      <tr style="border-bottom:1px solid #1c1c1e;">
        <td style="padding:8px 12px;color:#a1a1aa;font-size:12px;">${new Date(o.created_at).toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}</td>
        <td style="padding:8px 12px;color:#d4d4d8;font-size:12px;">${o.customer_name || "—"}</td>
        <td style="padding:8px 12px;color:#71717a;font-size:12px;">${TYPE_LABELS[o.order_type] || o.order_type}</td>
        <td style="padding:8px 12px;color:#a1a1aa;font-size:12px;">${itemList}</td>
        <td style="padding:8px 12px;text-align:right;color:#ffffff;font-weight:bold;font-size:12px;">${fmt(Number(o.total) || 0)}</td>
      </tr>
    `;
  }).join("");

  const orderTable = rows.length > 0 ? `
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr style="border-bottom:2px solid #2d2d2f;">
          <th style="text-align:left;padding:8px 12px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Date</th>
          <th style="text-align:left;padding:8px 12px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Customer</th>
          <th style="text-align:left;padding:8px 12px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Type</th>
          <th style="text-align:left;padding:8px 12px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Items</th>
          <th style="text-align:right;padding:8px 12px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Total</th>
        </tr>
      </thead>
      <tbody>${orderRows}</tbody>
    </table>
  ` : `<p style="color:#71717a;text-align:center;padding:24px 0;">No orders this week.</p>`;

  const html = `
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto;background:#0a0a0a;color:#ffffff;padding:36px;border-radius:12px;">
      <img src="https://thehungryroostertx.com/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" style="height:44px;margin-bottom:24px;" />
      <h1 style="font-size:22px;font-weight:900;margin:0 0 4px;">Weekly Orders Report</h1>
      <p style="color:#71717a;font-size:14px;margin:0 0 28px;">${label}</p>

      ${summaryCards}

      <h2 style="font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#71717a;margin:0 0 10px;">By Order Type</h2>
      <div style="background:#111;border:1px solid #2d2d2f;border-radius:10px;overflow:hidden;margin-bottom:28px;">
        ${typeTable}
      </div>

      <h2 style="font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#71717a;margin:0 0 10px;">All Orders (${rows.length})</h2>
      <div style="background:#111;border:1px solid #2d2d2f;border-radius:10px;overflow:hidden;">
        ${orderTable}
      </div>

      <p style="color:#3f3f46;font-size:11px;text-align:center;margin-top:28px;">
        Orders for ${label} have been cleared from the database. · The Hungry Rooster
      </p>
    </div>
  `;

  // Send email
  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Hungry Rooster <sales@thehungryroostertx.com>",
        to: ["sales@thehungryroostertx.com"],
        subject: `📊 Weekly Report — ${label} — ${fmt(summary.total)} gross`,
        html,
      }),
    });
  }

  // Delete last week's orders
  if (rows.length > 0) {
    const ids = rows.map((o: { id: string }) => o.id);
    for (let i = 0; i < ids.length; i += 50) {
      await supabase.from("orders").delete().in("id", ids.slice(i, i + 50));
    }
  }

  return NextResponse.json({
    success: true,
    week: label,
    orders_reported: rows.length,
    orders_deleted: rows.length,
    gross_total: summary.total,
  });
}
