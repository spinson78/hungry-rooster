"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  name: string;
  qty: number;
  size?: string | null;
  addons?: string[];
  mods?: string | null;
  protein?: string;
  side1?: string;
  side2?: string;
  extra?: string;
};

type Order = {
  id: string;
  order_number?: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  total: number;
  special_requests: string;
  order_type: string;
  created_at: string;
};

export default function PrintTicketPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("orders").select("*").eq("id", id).single();
      if (data) {
        setOrder(data as Order);
        // Auto-print after data loads
        setTimeout(() => window.print(), 500);
      }
    };
    if (id) load();
  }, [id]);

  if (!order) return (
    <div style={{ fontFamily: "monospace", padding: "20px", textAlign: "center" }}>
      Loading ticket...
    </div>
  );

  const time = new Date(order.created_at).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
  const date = new Date(order.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; background: white; color: black; }
        @media print {
          body { width: 80mm; }
          .no-print { display: none !important; }
          @page { margin: 4mm; size: 80mm auto; }
        }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        .header { text-align: center; padding: 8px 0; }
        .row { display: flex; justify-content: space-between; }
        .item-name { font-weight: bold; font-size: 13px; }
        .item-detail { font-size: 11px; padding-left: 10px; color: #333; }
        .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
        .note { font-size: 11px; font-style: italic; }
        .warning { font-weight: bold; font-size: 12px; }
      `}</style>

      {/* Print button — hidden on print */}
      <div className="no-print" style={{ padding: "10px", background: "#f4f4f4", marginBottom: "10px" }}>
        <button onClick={() => window.print()} style={{ padding: "6px 16px", fontWeight: "bold", cursor: "pointer" }}>
          🖨 Print Again
        </button>
        <button onClick={() => window.close()} style={{ marginLeft: "8px", padding: "6px 16px", cursor: "pointer" }}>
          Close
        </button>
      </div>

      <div style={{ padding: "0 4mm" }}>

        {/* Header */}
        <div className="header">
          <p style={{ fontWeight: "bold", fontSize: "16px" }}>THE HUNGRY ROOSTER</p>
          <p style={{ fontSize: "11px" }}>1499 Regal Row, Suite 206 · Dallas TX</p>
        </div>

        <div className="divider" />

        {/* Order info */}
        <div className="row" style={{ marginBottom: "4px" }}>
          <span style={{ fontWeight: "bold", fontSize: "14px" }}>
            {order.order_number || order.id.slice(-6).toUpperCase()}
          </span>
          <span>{date} {time}</span>
        </div>
        <div className="row">
          <span style={{ fontWeight: "bold" }}>{order.customer_name}</span>
          <span style={{ fontSize: "11px", textTransform: "uppercase" }}>
            {order.order_type === "menu" ? "Walk-in" : order.order_type}
          </span>
        </div>
        {order.customer_phone && (
          <p style={{ fontSize: "11px", color: "#555" }}>{order.customer_phone}</p>
        )}

        <div className="divider" />

        {/* Items */}
        <div style={{ marginBottom: "6px" }}>
          {order.items.map((item, i) => (
            <div key={i} style={{ marginBottom: "6px" }}>
              <p className="item-name">
                {item.qty > 1 ? `${item.qty}x ` : ""}{item.name}
              </p>
              {item.size && <p className="item-detail">Size: {item.size}</p>}
              {item.addons && item.addons.length > 0 && (
                <p className="item-detail">+ {item.addons.join(", ")}</p>
              )}
              {item.mods && (
                <p className="item-detail warning">** {item.mods}</p>
              )}
              {item.protein && (
                <p className="item-detail">
                  {[item.protein, item.side1, item.side2, item.extra].filter(Boolean).join(" / ")}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Special requests */}
        {order.special_requests && (
          <>
            <div className="divider" />
            <p className="warning">*** ORDER NOTE ***</p>
            <p className="note">{order.special_requests}</p>
          </>
        )}

        <div className="divider" />

        {/* Total */}
        <div className="total-row">
          <span>TOTAL</span>
          <span>${Number(order.total).toFixed(2)}</span>
        </div>

        <div className="divider" />
        <p style={{ textAlign: "center", fontSize: "11px", paddingBottom: "8px" }}>
          Thank you! Fred Approved 🐓
        </p>

      </div>
    </>
  );
}
