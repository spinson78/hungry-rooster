"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Order = {
  id: string;
  order_number: string;
  order_type: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  special_requests: string;
  items: Item[] | string;
  total: number;
  status: string;
  created_at: string;
};

type Item = {
  name?: string;
  qty?: number;
  quantity?: number;
  unit_price?: number;
  size?: string;
  mods?: string;
  description?: string;
  [key: string]: unknown;
};

function parseItems(raw: Item[] | string): Item[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return raw;
}

function formatPhone(p: string): string {
  const d = (p || "").replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  if (d.length === 11 && d[0] === "1") return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
  return p;
}

function itemLabel(item: Item): string {
  const qty = item.qty || item.quantity || 1;
  const name = item.name || item.description || "Item";
  const extras = [item.size, item.mods].filter(Boolean).join(", ");
  return `${qty > 1 ? `${qty}× ` : ""}${name}${extras ? ` (${extras})` : ""}`;
}

export default function LabelsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<"shabbat" | "bakery">("shabbat");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("type");
    if (t === "bakery") setType("bakery");
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("order_type", type === "bakery" ? "bakery" : "shabbat")
        .not("status", "in", '("archived","cancelled","pending_payment")')
        .order("created_at", { ascending: true });
      setOrders((data as Order[]) || []);
      setLoading(false);
    };
    fetch();
  }, [type]);

  useEffect(() => {
    if (!loading && orders.length > 0) {
      setTimeout(() => window.print(), 400);
    }
  }, [loading, orders]);

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
        No active {type === "bakery" ? "Fred's Fixins'" : "Shabbat"} orders found.
      </div>
    );
  }

  const typeLabel = type === "bakery" ? "Fred's Fixins'" : "Shabbat Box";

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        body { margin: 0; background: #fff; }

        /* Screen: show controls + preview */
        .no-print {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background: #111;
          color: #fff;
          font-family: Arial, sans-serif;
        }
        .no-print button {
          background: #14b8a6;
          color: #000;
          font-weight: 900;
          border: none;
          padding: 0.5rem 1.25rem;
          border-radius: 999px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        /* Each label */
        .label {
          width: 4in;
          min-height: 3in;
          padding: 0.2in 0.2in 0.15in;
          font-family: Arial, sans-serif;
          border: 1px solid #ccc;
          page-break-after: always;
          break-after: page;
          display: flex;
          flex-direction: column;
          background: #fff;
        }
        .label:last-child {
          page-break-after: avoid;
          break-after: avoid;
        }

        .label-header {
          font-size: 7pt;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #555;
          border-bottom: 1.5px solid #000;
          padding-bottom: 0.06in;
          margin-bottom: 0.1in;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .label-brand { font-size: 8pt; color: #000; }

        .label-name {
          font-size: 14pt;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 0.05in;
          line-height: 1.15;
        }
        .label-contact {
          font-size: 8.5pt;
          color: #222;
          margin-bottom: 0.04in;
          line-height: 1.4;
        }
        .label-address {
          font-size: 8.5pt;
          color: #222;
          margin-bottom: 0.1in;
          line-height: 1.4;
        }

        .label-divider {
          border: none;
          border-top: 1px dashed #999;
          margin: 0.08in 0;
        }

        .label-items-title {
          font-size: 7pt;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #555;
          margin-bottom: 0.06in;
        }
        .label-item {
          font-size: 9pt;
          color: #000;
          line-height: 1.5;
          padding-left: 0.1in;
        }
        .label-item::before {
          content: "• ";
          color: #555;
        }

        .label-notes {
          font-size: 7.5pt;
          color: #333;
          font-style: italic;
          margin-top: 0.08in;
          padding: 0.05in 0.08in;
          border: 1px solid #ccc;
          border-radius: 3px;
          background: #f9f9f9;
        }

        .label-footer {
          margin-top: auto;
          padding-top: 0.1in;
          border-top: 1px solid #eee;
          font-size: 7pt;
          color: #888;
          display: flex;
          justify-content: space-between;
        }

        /* Print: hide controls, full page per label */
        @media print {
          @page {
            size: 4in 3in;
            margin: 0;
          }
          .no-print { display: none !important; }
          .label {
            border: none;
            width: 4in;
            min-height: 3in;
            padding: 0.18in 0.18in 0.12in;
          }
        }

        /* Screen preview wrapper */
        .preview {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          padding: 1.5rem;
          background: #e5e7eb;
        }
      `}</style>

      <div className="no-print">
        <span style={{ fontWeight: 900, fontSize: "1rem" }}>
          🖨 {orders.length} {typeLabel} Label{orders.length !== 1 ? "s" : ""}
        </span>
        <button onClick={() => window.print()}>Print Labels</button>
        <button
          onClick={() => window.close()}
          style={{ background: "#3f3f46", color: "#fff" }}
        >
          Close
        </button>
        <span style={{ fontSize: "0.8rem", color: "#aaa", marginLeft: "auto" }}>
          Labels auto-print on load · 4″ × 3″
        </span>
      </div>

      <div className="preview">
        {orders.map((order) => {
          const items = parseItems(order.items);
          return (
            <div key={order.id} className="label">
              <div className="label-header">
                <span className="label-brand">The Hungry Rooster</span>
                <span>{typeLabel}</span>
              </div>

              <div className="label-name">{order.customer_name}</div>
              <div className="label-contact">📞 {formatPhone(order.customer_phone)}</div>
              {order.customer_address && order.customer_address !== "Pickup" && (
                <div className="label-address">📍 {order.customer_address}</div>
              )}
              {(!order.customer_address || order.customer_address === "Pickup") && (
                <div className="label-address" style={{ color: "#c00", fontWeight: "bold" }}>⚑ PICKUP</div>
              )}

              <hr className="label-divider" />

              <div className="label-items-title">Order</div>
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <div key={idx} className="label-item">{itemLabel(item)}</div>
                ))
              ) : (
                <div className="label-item" style={{ color: "#888" }}>See order #{order.order_number}</div>
              )}

              {order.special_requests && (
                <div className="label-notes">
                  ⚠ {order.special_requests}
                </div>
              )}

              <div className="label-footer">
                <span>#{order.order_number}</span>
                <span>${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
