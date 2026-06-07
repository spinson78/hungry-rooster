"use client";
import { useState, useEffect, useCallback } from "react";
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

function OrderCard({ order, onUpdate }: { order: Order; onUpdate: () => void }) {
  const [updating, setUpdating] = useState(false);
  const isNew = order.status === "pending";
  const isStarted = order.status === "in_progress";
  const mins = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
  const urgent = mins >= 15;

  const updateStatus = async (status: string) => {
    setUpdating(true);
    await supabase.from("orders").update({ status }).eq("id", order.id);
    onUpdate();
    setUpdating(false);
  };

  const handlePrint = () => {
    window.open(`/kds/print/${order.id}`, "_blank", "width=400,height=700");
  };

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

      {/* Status badge */}
      <div className="flex items-center gap-3">
        <span className={`text-sm font-black uppercase tracking-widest px-3 py-1 rounded-full border ${TYPE_COLOR[order.order_type] || TYPE_COLOR.menu}`}>
          {order.order_type === "menu" ? "Walk-in" : order.order_type}
        </span>
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [showDone, setShowDone] = useState(false);
  const [now, setNow] = useState(Date.now());

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .in("status", showDone ? ["pending", "in_progress", "complete"] : ["pending", "in_progress"])
      .order("created_at", { ascending: true });
    setOrders((data as Order[]) || []);
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

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
            <OrderCard key={order.id} order={order} onUpdate={fetchOrders} />
          ))}
          {showDone && done.map(order => (
            <OrderCard key={order.id} order={order} onUpdate={fetchOrders} />
          ))}
        </div>
      )}
    </div>
  );
}
