"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

const KDS_PASSWORD = "kitchen";

type OrderItem = {
  name: string;
  qty: number;
  size?: string | null;
  addons?: string[];
  mods?: string | null;
  price: number;
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
  customer_address?: string;
  fulfillment_type?: string;
  items: OrderItem[];
  total: number;
  special_requests: string;
  order_type: string;
  status: string;
  created_at: string;
};

const TYPE_COLOR: Record<string, string> = {
  menu:    "bg-teal-400/20 text-teal-400 border-teal-400/30",
  dinner:  "bg-teal-400/20 text-teal-400 border-teal-400/30",
  shabbat: "bg-yellow-400/20 text-yellow-400 border-yellow-400/30",
  bakery:  "bg-orange-400/20 text-orange-400 border-orange-400/30",
};

function elapsed(created: string) {
  const mins = Math.floor((Date.now() - new Date(created).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

let sharedCtx: AudioContext | null = null;

function getAudioContext() {
  if (!sharedCtx) sharedCtx = new AudioContext();
  if (sharedCtx.state === "suspended") sharedCtx.resume();
  return sharedCtx;
}

function playAlarm(muted: boolean) {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    [0, 0.22, 0.44].forEach(offset => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(880, ctx.currentTime + offset);
      gain.gain.setValueAtTime(0.4, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.18);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.2);
    });
  } catch {
    // Audio not available
  }
}

function OrderCard({ order, onUpdate, onPrint }: { order: Order; onUpdate: () => void; onPrint: (o: Order) => void }) {
  const [updating, setUpdating] = useState(false);
  const isNew = order.status === "pending";
  const isStarted = order.status === "in_progress";
  const mins = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
  const urgent = mins >= 10;

  const updateStatus = async (status: string) => {
    setUpdating(true);
    await supabase.from("orders").update({ status }).eq("id", order.id);
    onUpdate();
    setUpdating(false);
  };

  const handlePrint = () => onPrint(order);

  return (
    <div className={`rounded-3xl border-4 p-6 flex flex-col gap-4 transition-all ${
      isNew ? (urgent ? "border-red-500 bg-red-500/10" : "border-yellow-400 bg-yellow-400/5") :
      isStarted ? "border-teal-500 bg-teal-500/5" :
      "border-zinc-700 bg-zinc-900 opacity-50"
    }`}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white font-black text-3xl leading-tight">{order.customer_name}</p>
          {order.customer_phone && <p className="text-zinc-400 text-base mt-1">{order.customer_phone}</p>}
        </div>
        <div className="text-right shrink-0">
          {order.order_number && <p className="text-zinc-400 font-mono text-sm">{order.order_number}</p>}
          <p className={`text-xl font-black mt-1 ${urgent ? "text-red-400" : isStarted ? "text-teal-400" : "text-yellow-400"}`}>
            {elapsed(order.created_at)}
          </p>
        </div>
      </div>

      {/* Delivery address — shown prominently for delivery orders */}
      {order.fulfillment_type === "delivery" && order.customer_address && order.customer_address !== "Pickup" && (
        <div className="bg-blue-500/20 border-2 border-blue-400/40 rounded-2xl px-4 py-3">
          <p className="text-blue-300 font-black text-xs uppercase tracking-widest mb-1">🚗 Deliver to</p>
          <p className="text-white font-black text-lg leading-snug">{order.customer_address}</p>
        </div>
      )}

      {/* Status badge */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`text-sm font-black uppercase tracking-widest px-3 py-1 rounded-full border ${TYPE_COLOR[order.order_type] || TYPE_COLOR.menu}`}>
          {order.order_type === "menu" ? "Walk-in" : order.order_type}
        </span>
        {order.fulfillment_type === "delivery" && (
          <span className="text-sm font-black uppercase tracking-widest px-3 py-1 rounded-full border bg-blue-500/20 text-blue-300 border-blue-400/30">
            🚗 Delivery
          </span>
        )}
        {isNew && <span className="text-base font-black text-yellow-400 animate-pulse">● NEW</span>}
        {isStarted && <span className="text-base font-black text-teal-400">● IN PROGRESS</span>}
        {urgent && <span className="text-base font-black text-red-400">⚠ URGENT</span>}
      </div>

      {/* Items */}
      <div className="border-t-2 border-zinc-700 pt-4 space-y-3">
        {order.items.map((item, i) => (
          <div key={i}>
            <p className="text-xl font-black">
              {item.qty > 1 && <span className="text-yellow-400">{item.qty}× </span>}
              <span className="text-white">{item.name}</span>
              {item.size && <span className="text-zinc-400 text-base font-normal"> — {item.size}</span>}
            </p>
            {item.addons && item.addons.length > 0 && (
              <p className="text-zinc-400 text-base mt-1 ml-4">+ {item.addons.join(", ")}</p>
            )}
            {item.mods && (
              <p className="text-orange-300 text-base font-bold mt-1 ml-4">⚠ {item.mods}</p>
            )}
            {item.protein && (
              <p className="text-zinc-400 text-base mt-1 ml-4">
                {[item.protein, item.side1, item.side2, item.extra].filter(Boolean).join(" / ")}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Special requests */}
      {order.special_requests && (
        <div className="bg-orange-400/15 border-2 border-orange-400/40 rounded-2xl px-4 py-3">
          <p className="text-orange-300 font-black text-base">⚠ NOTE: {order.special_requests}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-auto pt-2">
        <button
          onClick={handlePrint}
          className="text-base font-black text-zinc-400 hover:text-white border-2 border-zinc-700 hover:border-zinc-500 px-4 py-3 rounded-full transition-colors"
        >
          🖨 Print
        </button>
        {isNew && (
          <button
            onClick={() => updateStatus("in_progress")}
            disabled={updating}
            className="flex-1 text-xl font-black bg-teal-500 hover:bg-teal-400 text-black py-3 rounded-full transition-colors disabled:opacity-50"
          >
            Start ▶
          </button>
        )}
        {isStarted && (
          <button
            onClick={() => updateStatus("complete")}
            disabled={updating}
            className="flex-1 text-xl font-black bg-yellow-400 hover:bg-yellow-300 text-black py-3 rounded-full transition-colors disabled:opacity-50"
          >
            Done ✓
          </button>
        )}
      </div>
    </div>
  );
}

export default function KDSPage() {
  const [authed, setAuthed] = useState(true);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showDone, setShowDone] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [muted, setMuted] = useState(false);
  const knownOrderIds = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .in("status", showDone ? ["pending", "in_progress", "complete"] : ["pending", "in_progress"])
      .not("order_type", "in", '("shabbat","bakery")')
      .order("created_at", { ascending: true });
    const fetched = (data as Order[]) || [];

    // Detect brand-new pending orders and play alarm
    if (initialLoadDone.current) {
      const newPending = fetched.filter(
        o => o.status === "pending" && !knownOrderIds.current.has(o.id)
      );
      if (newPending.length > 0) {
        playAlarm(muted);
      }
    }

    // Track all seen order IDs
    fetched.forEach(o => knownOrderIds.current.add(o.id));
    initialLoadDone.current = true;

    setOrders(fetched);
  }, [showDone]);

  useEffect(() => {
    if (!authed) return;
    fetchOrders();

    const channel = supabase
      .channel("kds-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    const poll = setInterval(fetchOrders, 10000);
    const tick = setInterval(() => setNow(Date.now()), 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [authed, fetchOrders]);

  void now;

  const active = orders.filter(o => o.status === "pending" || o.status === "in_progress");
  const done = orders.filter(o => o.status === "complete");

  return (
    <div className="min-h-screen bg-zinc-950 p-6">

      {/* Header — tap anywhere to unlock audio */}
      <div className="flex items-center justify-between mb-6" onClick={() => getAudioContext()}>
        <div className="flex items-center gap-4">
          <span className="text-white font-black text-2xl">🍳 Kitchen</span>
          {active.length > 0 && (
            <span className="bg-yellow-400 text-black font-black text-lg px-4 py-1.5 rounded-full">
              {active.length} active
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setMuted(m => !m)}
            className={`text-base font-black px-5 py-2.5 rounded-full border transition-colors ${muted ? "border-red-500 text-red-400" : "border-zinc-700 text-zinc-400 hover:text-white"}`}
          >
            {muted ? "🔇 Muted" : "🔔 Sound"}
          </button>
          <button
            onClick={() => setShowDone(s => !s)}
            className={`text-base font-black px-5 py-2.5 rounded-full border transition-colors ${showDone ? "bg-zinc-700 border-zinc-600 text-white" : "border-zinc-700 text-zinc-500 hover:text-white"}`}
          >
            {showDone ? "Hide Done" : "Show Done"}
          </button>
          <button
            onClick={fetchOrders}
            className="text-base font-black text-zinc-400 hover:text-white border border-zinc-700 px-5 py-2.5 rounded-full transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Order Grid */}
      {orders.length === 0 ? (
        <div className="flex items-center justify-center h-72 text-zinc-600">
          <div className="text-center">
            <p className="text-7xl mb-4">🐓</p>
            <p className="font-black text-2xl">No active orders</p>
            <p className="text-lg mt-2">New orders will appear here automatically</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {active.map(order => (
            <OrderCard key={order.id} order={order} onUpdate={fetchOrders} onPrint={o => { setPrintOrder(o); setTimeout(() => window.print(), 100); }} />
          ))}
          {showDone && done.map(order => (
            <OrderCard key={order.id} order={order} onUpdate={fetchOrders} onPrint={o => { setPrintOrder(o); setTimeout(() => window.print(), 100); }} />
          ))}
        </div>
      )}

      {/* Hidden print ticket — rendered offscreen, shown only on print */}
      {printOrder && (
        <div id="kds-print-ticket">
          <div style={{ textAlign: "center", paddingBottom: "6px" }}>
            <p style={{ fontWeight: "bold", fontSize: "16px", letterSpacing: "1px" }}>THE HUNGRY ROOSTER</p>
            <p style={{ fontSize: "10px", marginTop: "2px" }}>1499 Regal Row, Suite 206 · Dallas TX</p>
          </div>
          <hr style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span style={{ fontWeight: "bold", fontSize: "15px" }}>#{printOrder.order_number || printOrder.id.slice(-6).toUpperCase()}</span>
            <span style={{ fontSize: "11px" }}>{new Date(printOrder.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})} {new Date(printOrder.created_at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true})}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span style={{ fontWeight: "bold", fontSize: "13px" }}>{printOrder.customer_name}</span>
            <span style={{ fontSize: "10px", textTransform: "uppercase" }}>{printOrder.order_type === "menu" ? "Walk-in" : printOrder.order_type}</span>
          </div>
          {printOrder.customer_phone && <p style={{ fontSize: "10px" }}>{printOrder.customer_phone}</p>}
          {printOrder.fulfillment_type === "delivery" && printOrder.customer_address && printOrder.customer_address !== "Pickup" && (
            <>
              <p style={{ fontWeight: "bold", fontSize: "11px", marginTop: "3px" }}>🚗 DELIVER TO:</p>
              <p style={{ fontSize: "11px" }}>{printOrder.customer_address}</p>
            </>
          )}
          <hr style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
          {printOrder.items.map((item, i) => (
            <div key={i} style={{ marginBottom: "7px" }}>
              <p style={{ fontWeight: "bold", fontSize: "13px" }}>{item.qty > 1 ? `${item.qty}x ` : ""}{item.name}{item.size ? ` (${item.size})` : ""}</p>
              {item.addons && item.addons.length > 0 && <p style={{ fontSize: "11px", paddingLeft: "10px" }}>+ {item.addons.join(", ")}</p>}
              {item.mods && <p style={{ fontSize: "11px", fontWeight: "bold", paddingLeft: "10px" }}>** MOD: {item.mods}</p>}
              {item.protein && <p style={{ fontSize: "11px", paddingLeft: "10px" }}>{[item.protein, item.side1, item.side2, item.extra].filter(Boolean).join(" / ")}</p>}
            </div>
          ))}
          {printOrder.special_requests && (
            <>
              <hr style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
              <p style={{ fontWeight: "bold", fontSize: "12px" }}>*** ORDER NOTE ***</p>
              <p style={{ fontSize: "11px", fontStyle: "italic" }}>{printOrder.special_requests}</p>
            </>
          )}
          <hr style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px" }}>
            <span>TOTAL</span><span>${Number(printOrder.total).toFixed(2)}</span>
          </div>
          <hr style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
          <p style={{ textAlign: "center", fontSize: "11px", paddingBottom: "8px" }}>Thank you! Fred Approved</p>
        </div>
      )}

      <style>{`
        #kds-print-ticket {
          display: none;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          width: 80mm;
          background: white;
          color: black;
          padding: 4mm;
        }
        @media print {
          body > * { display: none !important; }
          #kds-print-ticket { display: block !important; }
          @page { margin: 2mm; size: 80mm auto; }
        }
      `}</style>
    </div>
  );
}
