"use client";
import { useState, useEffect } from "react";

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

type OrderItem = { name: string; qty: number; unit_price: number };

type TGOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_address: string;
  items: OrderItem[];
  subtotal: number;
  tax_amount: number;
  total: number;
  special_requests?: string;
  created_at: string;
};

export default function ThanksgivingTab() {
  const [orders, setOrders] = useState<TGOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"orders" | "manifest" | "labels">("orders");

  useEffect(() => {
    fetch("/api/thanksgiving/orders")
      .then(r => r.json())
      .then(d => { setOrders(d.orders || []); setLoading(false); });
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);

  // Item totals across all orders
  const itemTotals: Record<string, number> = {};
  MENU_ITEMS.forEach(name => { itemTotals[name] = 0; });
  orders.forEach(o => {
    (o.items || []).forEach(i => {
      itemTotals[i.name] = (itemTotals[i.name] || 0) + i.qty;
    });
  });

  const printLabels = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const labelHtml = orders.map(o => {
      const itemLines = (o.items || [])
        .map(i => `<div style="font-size:13px;margin:3px 0;">${i.qty}× ${i.name}</div>`)
        .join("");
      return `
        <div style="border:2px solid #000;padding:16px;margin:12px 0;page-break-inside:avoid;font-family:sans-serif;max-width:380px;">
          <div style="font-size:11px;color:#666;margin-bottom:4px;">#${o.order_number} · Nov 26 Delivery</div>
          <div style="font-size:18px;font-weight:900;margin-bottom:8px;">🦃 ${o.customer_name}</div>
          <div style="font-size:12px;color:#333;margin-bottom:10px;">${o.customer_address}</div>
          <div style="border-top:1px solid #ccc;padding-top:8px;">
            ${itemLines}
          </div>
          ${o.special_requests ? `<div style="margin-top:8px;font-size:11px;color:#666;border-top:1px solid #eee;padding-top:6px;">Note: ${o.special_requests}</div>` : ""}
          <div style="margin-top:8px;font-size:11px;color:#999;">Total: $${Number(o.total).toFixed(2)} · ${o.customer_email}</div>
        </div>`;
    }).join("");

    win.document.write(`
      <!DOCTYPE html><html><head>
        <title>Thanksgiving Delivery Labels</title>
        <style>
          body { margin: 20px; }
          @media print { body { margin: 0; } }
        </style>
      </head><body>
        <h2 style="font-family:sans-serif;margin-bottom:16px;">🦃 Thanksgiving Delivery Labels — Nov 26, 2026</h2>
        ${labelHtml}
        <script>window.onload=()=>window.print();</script>
      </body></html>`);
    win.document.close();
  };

  const printManifest = () => {
    const win = window.open("", "_blank");
    if (!win) return;

    const orderRows = orders.map(o => {
      const itemSummary = (o.items || []).map(i => `${i.qty}× ${i.name}`).join(", ");
      return `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${o.order_number}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${o.customer_name}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:11px;">${o.customer_address}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:11px;">${itemSummary}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">$${Number(o.total).toFixed(2)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">☐</td>
      </tr>`;
    }).join("");

    const totalsRows = MENU_ITEMS
      .filter(name => itemTotals[name] > 0)
      .map(name => `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${name}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-weight:900;font-size:18px;">${itemTotals[name]}</td>
      </tr>`).join("");

    win.document.write(`
      <!DOCTYPE html><html><head>
        <title>Thanksgiving Order Manifest</title>
        <style>body{font-family:sans-serif;margin:24px;} table{border-collapse:collapse;width:100%;} th{text-align:left;padding:8px;background:#f5f5f5;border-bottom:2px solid #ccc;}</style>
      </head><body>
        <h1>🦃 Thanksgiving Order Manifest</h1>
        <p style="color:#666;">Delivery: Wednesday, November 26, 2026 · ${orders.length} orders · $${totalRevenue.toFixed(2)} total</p>

        <h2 style="margin-top:28px;">📦 Item Totals — Production Sheet</h2>
        <table style="max-width:400px;margin-bottom:32px;">
          <tr><th>Item</th><th>Total Qty Needed</th></tr>
          ${totalsRows}
        </table>

        <h2>🚚 Delivery Orders</h2>
        <table>
          <tr><th>#</th><th>Name</th><th>Address</th><th>Items</th><th>Total</th><th>✓</th></tr>
          ${orderRows}
        </table>
        <p style="color:#999;font-size:11px;margin-top:24px;">Printed ${new Date().toLocaleString()}</p>
        <script>window.onload=()=>window.print();</script>
      </body></html>`);
    win.document.close();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div>
          <h2 className="text-xl font-black">🦃 Thanksgiving Pre-Orders</h2>
          <p className="text-zinc-500 text-xs">Delivery: Wednesday, November 26, 2026</p>
        </div>
        <div className="flex gap-2 ml-auto flex-wrap">
          {([["orders","Orders"], ["manifest","Item Totals"], ["labels","Labels"]] as const).map(([v, label]) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 rounded-full text-sm font-black transition-colors ${view === v ? "bg-orange-500 text-black" : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Orders", value: orders.length, color: "text-white" },
          { label: "Revenue", value: `$${totalRevenue.toFixed(2)}`, color: "text-orange-400" },
          { label: "Cutoff", value: "Nov 23 Midnight", color: "text-zinc-400" },
          { label: "Delivery", value: "Nov 26", color: "text-green-400" },
        ].map(c => (
          <div key={c.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">{c.label}</p>
            <p className={`font-black text-xl ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {loading && <p className="text-zinc-500 text-sm">Loading orders…</p>}
      {!loading && orders.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center">
          <p className="text-4xl mb-3">🦃</p>
          <p className="text-zinc-400">No confirmed orders yet. Share the order page at <strong className="text-white">thehungryroostertx.com/thanksgiving</strong></p>
        </div>
      )}

      {/* ── ORDERS VIEW ── */}
      {view === "orders" && !loading && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-black text-white">{o.customer_name}</p>
                  <p className="text-zinc-500 text-xs">{o.order_number} · {new Date(o.created_at).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "short", timeStyle: "short" })}</p>
                  <p className="text-zinc-400 text-xs mt-1">{o.customer_address}</p>
                  <p className="text-zinc-500 text-xs">{o.customer_email}</p>
                </div>
                <p className="font-black text-orange-400 shrink-0">${Number(o.total).toFixed(2)}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(o.items || []).map(i => (
                  <span key={i.name} className="bg-zinc-800 text-zinc-300 text-xs px-2.5 py-1 rounded-full font-bold">
                    {i.qty}× {i.name}
                  </span>
                ))}
              </div>
              {o.special_requests && (
                <p className="text-zinc-500 text-xs mt-2 italic">📝 {o.special_requests}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── ITEM TOTALS / MANIFEST VIEW ── */}
      {view === "manifest" && !loading && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={printManifest}
              className="bg-orange-500 hover:bg-orange-400 text-black font-black px-6 py-2.5 rounded-full text-sm transition-colors">
              🖨️ Print Full Manifest
            </button>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-6">
            <div className="p-4 border-b border-zinc-800">
              <p className="font-black text-sm uppercase tracking-widest text-orange-400">Production Sheet — Total Items Needed</p>
            </div>
            <div className="divide-y divide-zinc-800">
              {MENU_ITEMS.map(name => (
                <div key={name} className={`flex items-center justify-between px-5 py-3 ${itemTotals[name] === 0 ? "opacity-30" : ""}`}>
                  <span className="text-sm font-bold">{name}</span>
                  <span className={`font-black text-2xl ${itemTotals[name] > 0 ? "text-orange-400" : "text-zinc-600"}`}>{itemTotals[name]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <p className="font-black text-sm uppercase tracking-widest text-zinc-400">Order Summary by Customer</p>
            </div>
            <div className="divide-y divide-zinc-800">
              {orders.map(o => (
                <div key={o.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{o.customer_name}</p>
                    <p className="text-zinc-500 text-xs truncate">{(o.items || []).map(i => `${i.qty}× ${i.name}`).join(" · ")}</p>
                  </div>
                  <p className="font-black text-orange-400 shrink-0">${Number(o.total).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── LABELS VIEW ── */}
      {view === "labels" && !loading && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={printLabels}
              className="bg-orange-500 hover:bg-orange-400 text-black font-black px-6 py-2.5 rounded-full text-sm transition-colors">
              🖨️ Print All Labels
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {orders.map(o => (
              <div key={o.id} className="bg-zinc-900 border-2 border-zinc-700 rounded-xl p-5 font-mono">
                <p className="text-zinc-500 text-xs mb-1">{o.order_number} · 🦃 Nov 26 Delivery</p>
                <p className="font-black text-lg mb-1">{o.customer_name}</p>
                <p className="text-zinc-400 text-sm mb-3">{o.customer_address}</p>
                <div className="border-t border-zinc-700 pt-3 space-y-1">
                  {(o.items || []).map(i => (
                    <p key={i.name} className="text-sm">{i.qty}× {i.name}</p>
                  ))}
                </div>
                {o.special_requests && (
                  <p className="text-zinc-500 text-xs mt-2 border-t border-zinc-700 pt-2">📝 {o.special_requests}</p>
                )}
                <p className="text-zinc-600 text-xs mt-2">{o.customer_email}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
