"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("orders").select("*").eq("id", id).single();
      if (data) setOrder(data as Order);
    };
    if (id) load();
  }, [id]);

  const doPrint = () => {
    setPrinted(true);
    window.print();
  };

  useEffect(() => {
    if (order && !printed) {
      const t = setTimeout(() => doPrint(), 600);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  if (!order) return (
    <div style={{ fontFamily: "monospace", padding: "20px", textAlign: "center", background: "#fff", minHeight: "100vh" }}>
      <p style={{ fontSize: "18px" }}>Loading ticket...</p>
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
        html, body { background: #fff; color: #000; }
        body { font-family: 'Courier New', monospace; font-size: 12px; }
        .ticket { width: 80mm; max-width: 80mm; margin: 0 auto; padding: 4mm; }
        .divider { border: none; border-top: 1px dashed #000; margin: 6px 0; }
        .hdr { text-align: center; padding: 6px 0 8px; }
        .row { display: flex; justify-content: space-between; align-items: baseline; }
        .item-name { font-weight: bold; font-size: 13px; }
        .item-detail { font-size: 11px; padding-left: 10px; }
        .warning { font-weight: bold; }
        .note { font-size: 11px; font-style: italic; }
        .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
        .footer { text-align: center; font-size: 11px; padding-top: 6px; padding-bottom: 8px; }
        .controls {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: #1a1a1a; padding: 16px;
          display: flex; gap: 12px; justify-content: center; z-index: 999;
        }
        .btn-print {
          background: #14b8a6; color: #000; font-weight: 900;
          font-size: 18px; padding: 14px 40px; border: none;
          border-radius: 999px; cursor: pointer; font-family: sans-serif;
        }
        .btn-back {
          background: #3f3f46; color: #fff; font-weight: 700;
          font-size: 16px; padding: 14px 28px; border: none;
          border-radius: 999px; cursor: pointer; font-family: sans-serif;
        }
        .ticket-wrap { padding-bottom: 100px; }
        @media print {
          .controls { display: none !important; }
          .ticket-wrap { padding-bottom: 0; }
          body { width: 80mm; }
          @page { margin: 2mm; size: 80mm auto; }
        }
      `}</style>

      <div className="ticket-wrap">
        <div className="ticket">

          <div className="hdr">
            <p style={{ fontWeight: "bold", fontSize: "16px", letterSpacing: "1px" }}>THE HUNGRY ROOSTER</p>
            <p style={{ fontSize: "10px", marginTop: "2px" }}>1499 Regal Row, Suite 206 · Dallas TX</p>
          </div>

          <hr className="divider" />

          <div className="row" style={{ marginBottom: "3px" }}>
            <span style={{ fontWeight: "bold", fontSize: "15px" }}>
              #{order.order_number || order.id.slice(-6).toUpperCase()}
            </span>
            <span style={{ fontSize: "11px" }}>{date} {time}</span>
          </div>
          <div className="row" style={{ marginBottom: "2px" }}>
            <span style={{ fontWeight: "bold", fontSize: "13px" }}>{order.customer_name}</span>
            <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>
              {order.order_type === "menu" ? "Walk-in" : order.order_type}
            </span>
          </div>
          {order.customer_phone && (
            <p style={{ fontSize: "10px" }}>{order.customer_phone}</p>
          )}

          <hr className="divider" />

          <div style={{ marginBottom: "4px" }}>
            {order.items.map((item, i) => (
              <div key={i} style={{ marginBottom: "7px" }}>
                <p className="item-name">
                  {item.qty > 1 ? `${item.qty}x ` : ""}{item.name}
                  {item.size ? ` (${item.size})` : ""}
                </p>
                {item.addons && item.addons.length > 0 && (
                  <p className="item-detail">+ {item.addons.join(", ")}</p>
                )}
                {item.mods && (
                  <p className="item-detail warning">** MOD: {item.mods}</p>
                )}
                {item.protein && (
                  <p className="item-detail">
                    {[item.protein, item.side1, item.side2, item.extra].filter(Boolean).join(" / ")}
                  </p>
                )}
              </div>
            ))}
          </div>

          {order.special_requests && (
            <>
              <hr className="divider" />
              <p className="warning" style={{ fontSize: "12px", marginBottom: "3px" }}>*** ORDER NOTE ***</p>
              <p className="note">{order.special_requests}</p>
            </>
          )}

          <hr className="divider" />

          <div className="total-row">
            <span>TOTAL</span>
            <span>${Number(order.total).toFixed(2)}</span>
          </div>

          <hr className="divider" />

          <p className="footer">Thank you! Fred Approved</p>

        </div>
      </div>

      <div className="controls">
        <button className="btn-back" onClick={() => router.push("/kds")}>
          Back to Kitchen
        </button>
        <button className="btn-print" onClick={doPrint}>
          Print Ticket
        </button>
      </div>
    </>
  );
}
