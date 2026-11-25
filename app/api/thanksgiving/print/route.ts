import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "labels"; // "labels" | "manifest"

  const { data: orders } = await supabase
    .from("thanksgiving_orders")
    .select("*")
    .eq("status", "paid")
    .order("created_at", { ascending: true });

  const list = orders || [];

  const MENU_ITEMS = [
    "Dinner Rolls (1 dozen)",
    "Garlicky Green Beans",
    "Herbed Stuffing",
    "Candied Sweet Potatoes",
    "Creamy Mashed Potatoes",
    "Cranberry Sauce",
    "Apple Pie",
    "Bourbon Pecan Pie",
    "Chocolate Pecan Pie",
    "Pumpkin Streusel Pie",
  ];

  const totalRevenue = list.reduce((s: number, o: any) => s + Number(o.total), 0);

  const itemTotals: Record<string, number> = {};
  MENU_ITEMS.forEach(n => { itemTotals[n] = 0; });
  list.forEach((o: any) => {
    (o.items || []).forEach((i: any) => {
      itemTotals[i.name] = (itemTotals[i.name] || 0) + i.qty;
    });
  });

  let body = "";

  if (type === "labels") {
    body = list.map((o: any) => {
      const itemLines = (o.items || []).map((i: any) =>
        `<div>${i.qty}× ${i.name}</div>`
      ).join("");
      return `
        <div class="label">
          <div class="meta">#${o.order_number} &nbsp;·&nbsp; 🦃 Nov 26 Delivery</div>
          <div class="name">${o.customer_name}</div>
          <div class="addr">${o.customer_address}</div>
          <div class="items">${itemLines}</div>
          ${o.special_requests ? `<div class="note">📝 ${o.special_requests}</div>` : ""}
          <div class="footer">$${Number(o.total).toFixed(2)} &nbsp;·&nbsp; ${o.customer_email}</div>
        </div>`;
    }).join("\n");
  } else {
    // manifest
    const orderRows = list.map((o: any, idx: number) => {
      const itemSummary = (o.items || []).map((i: any) => `${i.qty}× ${i.name}`).join(", ");
      return `<tr>
        <td>${idx + 1}</td>
        <td><strong>${o.customer_name}</strong></td>
        <td class="sm">${o.customer_address}</td>
        <td class="sm">${itemSummary}</td>
        <td style="text-align:right;">$${Number(o.total).toFixed(2)}</td>
        <td style="text-align:center;">☐</td>
      </tr>`;
    }).join("");

    const totalsRows = MENU_ITEMS
      .filter(n => itemTotals[n] > 0)
      .map(n => `<tr><td>${n}</td><td class="qty">${itemTotals[n]}</td></tr>`)
      .join("");

    body = `
      <h1>🦃 Thanksgiving Order Manifest</h1>
      <p class="sub">${list.length} orders &nbsp;·&nbsp; $${totalRevenue.toFixed(2)} total &nbsp;·&nbsp; Delivery: Nov 26, 2026</p>

      <h2>📦 Production Sheet</h2>
      <table class="prod">
        <tr><th>Item</th><th>Qty Needed</th></tr>
        ${totalsRows}
      </table>

      <h2>🚚 Delivery Orders</h2>
      <table>
        <tr><th>#</th><th>Name</th><th>Address</th><th>Items</th><th>Total</th><th>✓</th></tr>
        ${orderRows}
      </table>
      <p class="footer-note">Printed ${new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })}</p>
    `;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${type === "labels" ? "Delivery Labels" : "Order Manifest"} — Thanksgiving 2026</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: sans-serif; padding: 16px; background: #fff; color: #000; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    h2 { font-size: 15px; margin: 20px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    .sub { font-size: 12px; color: #666; margin-bottom: 16px; }
    .footer-note { font-size: 10px; color: #999; margin-top: 16px; }

    /* Labels */
    .label { border: 2px solid #000; padding: 14px; margin: 10px 0; page-break-inside: avoid; max-width: 400px; }
    .meta { font-size: 10px; color: #666; margin-bottom: 4px; }
    .name { font-size: 20px; font-weight: 900; margin-bottom: 4px; }
    .addr { font-size: 12px; color: #333; margin-bottom: 10px; }
    .items { border-top: 1px solid #ccc; padding-top: 8px; font-size: 13px; line-height: 1.7; }
    .note { margin-top: 6px; font-size: 11px; color: #555; border-top: 1px solid #eee; padding-top: 5px; }
    .footer { margin-top: 6px; font-size: 10px; color: #999; }

    /* Tables */
    table { border-collapse: collapse; width: 100%; font-size: 12px; margin-bottom: 12px; }
    th { text-align: left; padding: 6px 8px; background: #f0f0f0; border-bottom: 2px solid #ccc; }
    td { padding: 5px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
    .sm { font-size: 11px; }
    .prod { max-width: 320px; }
    .qty { font-size: 20px; font-weight: 900; }

    /* Print button — hidden when printing */
    .print-btn { display: block; margin: 0 auto 20px; padding: 12px 32px; background: #f97316; color: #000; font-size: 16px; font-weight: 900; border: none; border-radius: 999px; cursor: pointer; }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Print This Page</button>
  ${body}
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
