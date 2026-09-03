"use client";
import { useEffect, useState } from "react";

type CelebOrder = {
  id: string; order_type: string; purchaser_name: string; classroom: string;
  kids_name: string; delivery_date: string; delivery_time: string;
  student_count: number; quantity: number; cupcake_flavor: string;
  toppings: string[]; special_requests: string; source: string;
  payment_method: string; total: number; status: string; created_at: string;
};

const TYPE_LABEL: Record<string, string> = {
  froyo: "🍦 Froyo Party",
  cupcakes: "🧁 Cupcakes",
  celebration_pack: "🎉 Celebration Pack",
};

export default function CelebrationTab() {
  const [orders, setOrders] = useState<CelebOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "all">("upcoming");

  const fetchOrders = () => {
    setLoading(true);
    fetch("/api/coopcelebrate/orders")
      .then(r => r.json())
      .then(d => { setOrders(d.orders || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const today = new Date().toISOString().split("T")[0];
  const displayed = filter === "upcoming"
    ? orders.filter(o => o.delivery_date >= today)
    : orders;

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const upcoming = orders.filter(o => o.delivery_date >= today).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black">🎉 Celebration Orders</h2>
          <p className="text-zinc-500 text-sm mt-0.5">Froyo parties, cupcakes & celebration packs</p>
        </div>
        <button onClick={fetchOrders} className="text-xs text-zinc-500 hover:text-white font-bold border border-zinc-700 px-4 py-2 rounded-full">↺ Refresh</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Total Orders</p>
          <p className="font-black text-2xl text-white">{orders.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Upcoming</p>
          <p className="font-black text-2xl text-teal-400">{upcoming}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="font-black text-2xl text-yellow-400">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">48hr Notice</p>
          <p className="font-black text-sm text-zinc-400">Required</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(["upcoming", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-black transition-colors ${filter === f ? "bg-yellow-400 text-black" : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white"}`}>
            {f === "upcoming" ? "Upcoming" : "All Orders"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-zinc-500 animate-pulse text-center py-12">Loading orders…</p>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 border border-zinc-800 rounded-2xl">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-zinc-500 font-bold">{filter === "upcoming" ? "No upcoming orders" : "No orders yet"}</p>
          <p className="text-zinc-700 text-sm mt-1">Share: /coopcelebrate</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(order => (
            <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-lg">{TYPE_LABEL[order.order_type] || order.order_type}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${order.source === "pos" ? "bg-teal-400/20 text-teal-400" : "bg-zinc-700 text-zinc-400"}`}>
                      {order.source === "pos" ? "POS" : "Online"}
                    </span>
                  </div>
                  <p className="font-bold">{order.purchaser_name}</p>
                  <p className="text-zinc-500 text-sm">Classroom: {order.classroom}</p>
                  {order.kids_name && <p className="text-zinc-500 text-sm">Kid: {order.kids_name}</p>}
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-black text-xl">${Number(order.total || 0).toFixed(2)}</p>
                  <p className="text-zinc-500 text-sm font-bold mt-1">{order.delivery_date}</p>
                  <p className="text-zinc-600 text-xs">{order.delivery_time}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                {order.student_count && (
                  <div className="bg-zinc-800 rounded-xl px-3 py-2">
                    <p className="text-zinc-500 text-xs uppercase tracking-widest mb-0.5">Students</p>
                    <p className="font-bold">{order.student_count}</p>
                  </div>
                )}
                {order.quantity > 1 || order.order_type !== "froyo" ? (
                  <div className="bg-zinc-800 rounded-xl px-3 py-2">
                    <p className="text-zinc-500 text-xs uppercase tracking-widest mb-0.5">Qty</p>
                    <p className="font-bold">{order.quantity} {order.order_type === "cupcakes" ? "dozen" : order.order_type === "celebration_pack" ? "pack" : ""}</p>
                  </div>
                ) : null}
                {order.cupcake_flavor && (
                  <div className="bg-zinc-800 rounded-xl px-3 py-2">
                    <p className="text-zinc-500 text-xs uppercase tracking-widest mb-0.5">Flavor</p>
                    <p className="font-bold capitalize">{order.cupcake_flavor}</p>
                  </div>
                )}
                {order.toppings?.length > 0 && (
                  <div className="bg-zinc-800 rounded-xl px-3 py-2 col-span-2">
                    <p className="text-zinc-500 text-xs uppercase tracking-widest mb-0.5">Toppings</p>
                    <p className="font-bold">{order.toppings.join(", ")}</p>
                  </div>
                )}
                {order.payment_method && (
                  <div className="bg-zinc-800 rounded-xl px-3 py-2">
                    <p className="text-zinc-500 text-xs uppercase tracking-widest mb-0.5">Payment</p>
                    <p className="font-bold capitalize">{order.payment_method}</p>
                  </div>
                )}
              </div>

              {order.special_requests && (
                <p className="text-zinc-400 text-xs mt-2 italic">📝 {order.special_requests}</p>
              )}
              <p className="text-zinc-700 text-xs mt-2">Ordered {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
