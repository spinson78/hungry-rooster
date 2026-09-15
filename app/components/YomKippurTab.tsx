"use client";
import { useState, useEffect, useCallback } from "react";

type YKOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  quantity: number;
  subtotal: number;
  tax_amount: number;
  tip_amount: number;
  total: number;
  special_requests: string;
  status: string;
  created_at: string;
};

export default function YomKippurTab() {
  const [orders, setOrders] = useState<YKOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/yom-kippur/orders");
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const confirmed = orders.filter(o => o.status === "confirmed");
  const pending = orders.filter(o => o.status === "pending_payment");
  const totalBoxes = confirmed.reduce((s, o) => s + (o.quantity || 1), 0);
  const totalRevenue = confirmed.reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div className="max-w-4xl space-y-6">
      {/* STATS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-yellow-400">{confirmed.length}</p>
          <p className="text-zinc-400 text-xs uppercase tracking-widest mt-1">Orders</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-yellow-400">{totalBoxes}</p>
          <p className="text-zinc-400 text-xs uppercase tracking-widest mt-1">Total Boxes</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-yellow-400">${totalRevenue.toFixed(0)}</p>
          <p className="text-zinc-400 text-xs uppercase tracking-widest mt-1">Revenue</p>
        </div>
      </div>

      {/* EXPORT */}
      {confirmed.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-black mb-3">Delivery List — Sep 20</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 text-xs uppercase tracking-widest border-b border-zinc-800">
                  <th className="pb-2 text-left">Order #</th>
                  <th className="pb-2 text-left">Name</th>
                  <th className="pb-2 text-left">Phone</th>
                  <th className="pb-2 text-left">Address</th>
                  <th className="pb-2 text-center">Boxes</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {confirmed.map(o => (
                  <tr key={o.id} className="border-b border-zinc-800/50">
                    <td className="py-2 text-zinc-400 text-xs">{o.order_number}</td>
                    <td className="py-2 font-bold">{o.customer_name}</td>
                    <td className="py-2 text-zinc-300">{o.customer_phone}</td>
                    <td className="py-2 text-zinc-300 max-w-[200px] truncate">{o.customer_address}</td>
                    <td className="py-2 text-center font-black text-yellow-400">{o.quantity || 1}</td>
                    <td className="py-2 text-right font-bold">${o.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDERS LIST */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black">All Orders</h3>
          <button onClick={fetchOrders} className="text-xs text-zinc-400 hover:text-white transition-colors">↻ Refresh</button>
        </div>

        {loading ? (
          <p className="text-zinc-500 text-sm">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="text-zinc-500 text-sm">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o.id} className={`rounded-xl border p-4 ${o.status === "confirmed" ? "border-green-500/30 bg-green-500/5" : "border-zinc-700 bg-zinc-800/30"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-black">{o.customer_name}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${o.status === "confirmed" ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-400"}`}>
                        {o.status === "confirmed" ? "✓ Confirmed" : "Pending"}
                      </span>
                      <span className="text-zinc-500 text-xs">{o.order_number}</span>
                    </div>
                    <p className="text-zinc-400 text-sm">{o.customer_phone} {o.customer_email && `· ${o.customer_email}`}</p>
                    <p className="text-zinc-300 text-sm mt-1">{o.customer_address}</p>
                    {o.special_requests && (
                      <p className="text-zinc-500 text-xs mt-1 italic">{o.special_requests}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-yellow-400 font-black">{o.quantity || 1} box{(o.quantity || 1) > 1 ? "es" : ""}</p>
                    <p className="font-bold">${o.total.toFixed(2)}</p>
                    <p className="text-zinc-500 text-xs mt-1">
                      {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pending.length > 0 && (
        <p className="text-zinc-500 text-xs">{pending.length} pending payment order{pending.length > 1 ? "s" : ""} not shown in revenue totals.</p>
      )}
    </div>
  );
}
