"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export default function ThanksgivingPrintPage() {
  const [orders, setOrders] = useState<TGOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [printType, setPrintType] = useState<"labels" | "manifest">("labels");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("type") === "manifest") setPrintType("manifest");
  }, []);

  useEffect(() => {
    supabase
      .from("thanksgiving_orders")
      .select("*")
      .eq("status", "confirmed")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setOrders((data as TGOrder[]) || []);
        setLoading(false);
      });
  }, []);

  // Auto-print once loaded
  useEffect(() => {
    if (!loading && orders.length > 0) {
      setTimeout(() => window.print(), 400);
    }
  }, [loading, orders]);

  const itemTotals: Record<string, number> = {};
  MENU_ITEMS.forEach(n => { itemTotals[n] = 0; });
  orders.forEach(o => {
    (o.items || []).forEach(i => {
      itemTotals[i.name] = (itemTotals[i.name] || 0) + i.qty;
    });
  });
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);

  if (loading) {
    return (
      <div style={{ fontFamily: "Arial, sans-serif", padding: "2rem", textAlign: "center" }}>
        Loading orders…
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ fontFamily: "Arial, sans-serif", padding: "2rem", textAlign: "center" }}>
        No paid Thanksgiving orders found.
      </div>
    );
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; color: #000; font-family: Arial, sans-serif; }

        /* ── Screen toolbar ── */
        .no-print {
          display: flex; align-items: center; gap: 1rem;
          padding: 1rem 1.5rem; background: #111; color: #fff;
        }
        .no-print button {
          background: #f97316; color: #000; font-weight: 900;
          border: none; padding: 0.5rem 1.25rem;
          border-radius: 999px; cursor: pointer; font-size: 0.9rem;
        }
        .no-print button.sec { background: #3f3f46; color: #fff; }

        /* ── LABELS ── */
        .label {
          width: 4in; min-height: 3in;
          padding: 0.18in 0.2in 0.14in;
          border: 1px solid #ccc;
          page-break-after: always; break-after: page;
          display: flex; flex-direction: column;
          background: #fff;
        }
        .label:last-child { page-break-after: avoid; break-after: avoid; }

        .label-header {
          font-size: 7pt; font-weight: bold;
          text-transform: uppercase; letter-spacing: 0.08em; color: #555;
          border-bottom: 1.5px solid #000; padding-bottom: 0.06in; margin-bottom: 0.1in;
          display: flex; justify-content: space-between; align-items: baseline;
        }
        .label-brand { font-size: 8pt; color: #000; }
        .label-name { font-size: 14pt; font-weight: 900; text-transform: uppercase; margin-bottom: 0.04in; line-height: 1.15; }
        .label-addr { font-size: 8.5pt; color: #222; margin-bottom: 0.1in; line-height: 1.4; }
        .label-divider { border: none; border-top: 1px dashed #999; margin: 0.08in 0; }
        .label-items-title { font-size: 7pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; color: #555; margin-bottom: 0.06in; }
        .label-item { font-size: 9pt; color: #000; line-height: 1.5; padding-left: 0.1in; }
        .label-item::before { content: "• "; color: #555; }
        .label-notes { font-size: 7.5pt; color: #333; font-style: italic; margin-top: 0.08in; padding: 0.05in 0.08in; border: 1px solid #ccc; border-radius: 3px; background: #f9f9f9; }
        .label-footer { margin-top: auto; padding-top: 0.1in; border-top: 1px solid #eee; font-size: 7pt; color: #888; display: flex; justify-content: space-between; }

        /* ── MANIFEST ── */
        .manifest { padding: 0.3in; }
        .manifest h1 { font-size: 18pt; margin-bottom: 4px; }
        .manifest .sub { font-size: 10pt; color: #555; margin-bottom: 0.3in; }
        .manifest h2 { font-size: 12pt; margin: 0.2in 0 0.1in; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
        table { border-collapse: collapse; width: 100%; font-size: 10pt; margin-bottom: 0.2in; }
        th { text-align: left; padding: 6px 8px; background: #f0f0f0; border-bottom: 2px solid #ccc; }
        td { padding: 5px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
        .prod-table { max-width: 3.5in; }
        .qty-cell { font-size: 18pt; font-weight: 900; }
        .sm { font-size: 8.5pt; }
        .footer-note { font-size: 8pt; color: #999; margin-top: 0.3in; }

        /* Screen preview wrapper */
        .preview { display: flex; flex-wrap: wrap; gap: 1rem; padding: 1.5rem; background: #e5e7eb; }

        /* ── Print ── */
        @media print {
          .no-print { display: none !important; }
          .preview { display: block; padding: 0; background: none; gap: 0; }
          @page { margin: 0; }
        }
        @media print and (max-width: 4.1in) {
          /* label printing */
          @page { size: 4in 3in; margin: 0; }
          .label { border: none; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print">
        <span style={{ fontWeight: 900, fontSize: "1rem" }}>
          🦃 {orders.length} order{orders.length !== 1 ? "s" : ""} —{" "}
          {printType === "labels" ? "Delivery Labels (4″×3″)" : "Order Manifest"}
        </span>
        <button onClick={() => window.print()}>🖨️ Print</button>
        <button className="sec" onClick={() => window.close()}>Close</button>
        <span style={{ fontSize: "0.75rem", color: "#aaa", marginLeft: "auto" }}>
          Auto-prints on load
        </span>
      </div>

      {/* ── LABELS ── */}
      {printType === "labels" && (
        <div className="preview">
          {orders.map(order => (
            <div key={order.id} className="label">
              <div className="label-header">
                <span className="label-brand">The Hungry Rooster</span>
                <span>🦃 Thanksgiving 2026</span>
              </div>

              <div className="label-name">{order.customer_name}</div>
              <div className="label-addr">📍 {order.customer_address}</div>

              <hr className="label-divider" />

              <div className="label-items-title">Order</div>
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="label-item">
                  {item.qty}× {item.name}
                </div>
              ))}

              {order.special_requests && (
                <div className="label-notes">⚠ {order.special_requests}</div>
              )}

              <div className="label-footer">
                <span>#{order.order_number}</span>
                <span>Nov 26 Delivery</span>
                <span>${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MANIFEST ── */}
      {printType === "manifest" && (
        <div className="manifest">
          <h1>🦃 Thanksgiving Order Manifest</h1>
          <p className="sub">
            {orders.length} orders · ${totalRevenue.toFixed(2)} total · Delivery: Nov 26, 2026
          </p>

          <h2>📦 Production Sheet — Items Needed</h2>
          <table className="prod-table">
            <thead><tr><th>Item</th><th>Qty</th></tr></thead>
            <tbody>
              {MENU_ITEMS.filter(n => itemTotals[n] > 0).map(n => (
                <tr key={n}>
                  <td>{n}</td>
                  <td className="qty-cell">{itemTotals[n]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>🚚 Delivery Orders</h2>
          <table>
            <thead>
              <tr><th>#</th><th>Name</th><th>Address</th><th>Items</th><th>Total</th><th>✓</th></tr>
            </thead>
            <tbody>
              {orders.map((o, idx) => (
                <tr key={o.id}>
                  <td>{idx + 1}</td>
                  <td><strong>{o.customer_name}</strong></td>
                  <td className="sm">{o.customer_address}</td>
                  <td className="sm">{(o.items || []).map(i => `${i.qty}× ${i.name}`).join(", ")}</td>
                  <td style={{ textAlign: "right" }}>${Number(o.total).toFixed(2)}</td>
                  <td style={{ textAlign: "center" }}>☐</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="footer-note">
            Printed {new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })}
          </p>
        </div>
      )}
    </>
  );
}
