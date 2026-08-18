"use client";
import { useState, useEffect, useCallback } from "react";

type ChallahOrder = {
  id: string;
  name: string;
  phone: string;
  order_type: string;
  package: string;
  babka_flavor: string | null;
  amount_total: number;
  is_installment: boolean;
  installments_paid: number;
  installments_total: number;
  status: string;
  created_at: string;
};

type Installment = {
  id: string;
  order_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: string;
};

const TYPE_LABEL: Record<string, string> = {
  weekly: "Weekly",
  semester1: "Semester 1",
  semester2: "Semester 2",
  fullyear: "Full Year",
};

const PKG_LABEL: Record<string, string> = {
  weekly_challah: "1 Challah",
  weekly_babka: "1 Babka",
  s1_1challah: "1 Challah/wk",
  s1_2challah: "2 Challah/wk",
  s1_1challah_1babka: "1 Challah + 1 Babka",
  s1_2challah_1babka: "2 Challah + 1 Babka",
  s2_1challah: "1 Challah/wk",
  s2_2challah: "2 Challah/wk",
  s2_1challah_1babka: "1 Challah + 1 Babka",
  s2_2challah_1babka: "2 Challah + 1 Babka",
  fy_1challah: "1 Challah/wk",
  fy_2challah: "2 Challah/wk",
  fy_1challah_1babka: "1 Challah + 1 Babka",
  fy_2challah_1babka: "2 Challah + 1 Babka",
};

function getNextFriday(): string {
  const d = new Date();
  const daysUntil = (5 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntil);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function ChallahTab() {
  const [orders, setOrders] = useState<ChallahOrder[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "weekly" | "semester1" | "semester2" | "fullyear">("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/coopchallah/orders");
    const data = await res.json();
    setOrders(data.orders || []);
    setInstallments(data.installments || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = filter === "all" ? orders : orders.filter(o => o.order_type === filter);

  // This Friday's pickup = weekly orders + all active subscriptions
  const fridayPickup = orders.filter(o => o.status === "active");

  const totalRevenue = orders.reduce((s, o) => {
    if (o.is_installment) return s + (o.amount_total / 4) * o.installments_paid;
    return s + o.amount_total;
  }, 0);

  const pendingInstallments = installments.filter(i => i.status === "pending");
  const nextInstallment = pendingInstallments.sort((a, b) => a.due_date.localeCompare(b.due_date))[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black">🍞 Challah & Babka</h2>
          <p className="text-zinc-500 text-xs">Pre-orders · Next pickup: {getNextFriday()}</p>
        </div>
        <button onClick={fetchData} className="text-xs text-zinc-500 hover:text-white">↺ Refresh</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Active Orders",     value: orders.length,              color: "text-white" },
          { label: "Revenue Collected", value: `$${totalRevenue.toFixed(2)}`, color: "text-yellow-400" },
          { label: "Installment Plans", value: orders.filter(o => o.is_installment).length, color: "text-teal-400" },
          { label: "Next Auto-Draft",   value: nextInstallment ? new Date(nextInstallment.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "None", color: "text-zinc-400" },
        ].map(c => (
          <div key={c.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">{c.label}</p>
            <p className={`font-black text-xl ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* This Friday's pickup list */}
      <div className="mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">This Friday&apos;s Pickup List</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {loading ? (
            <p className="text-center text-zinc-600 py-6 text-sm animate-pulse">Loading…</p>
          ) : fridayPickup.length === 0 ? (
            <p className="text-center text-zinc-600 py-6 text-sm">No active orders yet</p>
          ) : fridayPickup.map(o => (
            <div key={o.id} className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 last:border-0">
              <div>
                <p className="font-black text-sm">{o.name}</p>
                <p className="text-zinc-500 text-xs">{PKG_LABEL[o.package] || o.package}{o.babka_flavor ? ` · ${o.babka_flavor} babka` : ""}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                  o.order_type === "weekly" ? "bg-zinc-700 text-zinc-300"
                  : o.order_type === "fullyear" ? "bg-yellow-400/20 text-yellow-400"
                  : "bg-teal-500/20 text-teal-400"
                }`}>
                  {TYPE_LABEL[o.order_type]}
                </span>
                {o.is_installment && (
                  <p className="text-zinc-600 text-xs mt-0.5">{o.installments_paid}/{o.installments_total} paid</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter + full list */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "weekly", "semester1", "semester2", "fullyear"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-black transition-colors ${filter === f ? "bg-teal-500 text-black" : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white"}`}>
            {f === "all" ? "All" : TYPE_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="text-center text-zinc-600 py-8 text-sm animate-pulse">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-zinc-600 py-8 text-sm">No orders in this category</p>
        ) : filtered.map(o => {
          const orderInstallments = installments.filter(i => i.order_id === o.id);
          return (
            <div key={o.id} className="px-4 py-4 border-b border-zinc-800 last:border-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-black text-sm">{o.name}</p>
                  <p className="text-zinc-500 text-xs">{o.phone}</p>
                  <p className="text-zinc-400 text-xs mt-1">{PKG_LABEL[o.package] || o.package}{o.babka_flavor ? ` · ${o.babka_flavor} babka` : ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-black text-sm">${Number(o.amount_total).toFixed(2)}</p>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    o.order_type === "fullyear" ? "bg-yellow-400/20 text-yellow-400"
                    : o.order_type === "weekly" ? "bg-zinc-700 text-zinc-400"
                    : "bg-teal-500/20 text-teal-400"
                  }`}>
                    {TYPE_LABEL[o.order_type]}
                  </span>
                  <p className="text-zinc-600 text-xs mt-1">{new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                </div>
              </div>

              {/* Installment progress */}
              {o.is_installment && orderInstallments.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  {orderInstallments.map(inst => (
                    <div key={inst.id} className={`text-center py-1.5 rounded-lg text-xs font-black ${
                      inst.status === "paid" ? "bg-green-500/20 text-green-400"
                      : inst.status === "failed" ? "bg-red-500/20 text-red-400"
                      : "bg-zinc-800 text-zinc-600"
                    }`}>
                      {inst.status === "paid" ? "✓" : inst.status === "failed" ? "✕" : new Date(inst.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
