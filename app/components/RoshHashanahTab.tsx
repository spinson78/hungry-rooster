"use client";
import { useEffect, useState } from "react";

type RHOrder = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  boxes_summary: string;
  addons_summary: string;
  special_requests: string;
  total: number;
  status: string;
  delivery_date: string;
  created_at: string;
};

export default function RoshHashanahTab() {
  const [orders, setOrders] = useState<RHOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    fetch("/api/rosh-hashanah/orders")
      .then(r => r.json())
      .then(d => { setOrders(d.orders || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black">🍎 Rosh Hashanah Orders</h2>
          <p className="text-zinc-500 text-sm mt-0.5">Delivery: Friday, September 11, 2026</p>
        </div>
        <button onClick={fetchOrders} className="text-xs text-zinc-500 hover:text-white font-bold border border-zinc-700 px-4 py-2 rounded-full">
          ↺ Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Total Orders</p>
          <p className="font-black text-2xl text-white">{orders.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="font-black text-2xl text-yellow-400">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Delivery Date</p>
          <p className="font-black text-sm text-green-400">Sep 11, 2026</p>
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500 animate-pulse text-center py-12">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 border border-zinc-800 rounded-2xl">
          <p className="text-4xl mb-3">🍎</p>
          <p className="text-zinc-500 font-bold">No orders yet</p>
          <p className="text-zinc-700 text-sm mt-1">Share the link: /rosh-hashanah</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-black text-lg">{order.customer_name}</p>
                  <p className="text-zinc-500 text-sm">{order.customer_phone} · {order.customer_email}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">{order.customer_address}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-yellow-400 text-xl">${Number(order.total).toFixed(2)}</p>
                  <p className="text-zinc-600 text-xs">{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                </div>
              </div>

              {order.boxes_summary && (
                <div className="bg-zinc-800 rounded-xl px-4 py-2 mb-2">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">Boxes</p>
                  <p className="text-sm font-bold">{order.boxes_summary}</p>
                </div>
              )}
              {order.addons_summary && (
                <div className="bg-zinc-800 rounded-xl px-4 py-2 mb-2">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">Add-Ons</p>
                  <p className="text-sm font-bold">{order.addons_summary}</p>
                </div>
              )}
              {order.special_requests && (
                <p className="text-zinc-400 text-xs mt-2 italic">📝 {order.special_requests}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
