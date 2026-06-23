"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type OrderLogItem = {
  id: string;
  order_number?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  fulfillment_type?: string;
  items: Array<{
    name: string;
    qty: number;
    size?: string;
    addons?: string[];
    mods?: string;
    unit_price?: number;
    price?: number;
  }>;
  subtotal?: number;
  tax_amount?: number;
  delivery_fee?: number;
  delivery_distance_miles?: number;
  tip_amount?: number;
  total: number;
  special_requests?: string;
  order_type: string;
  status: string;
  created_at: string;
  scheduled_for?: string | null;
};

const ORDER_TYPES = ["all", "menu", "dinner", "shabbat", "bakery", "catering"];
const STATUSES = ["all", "pending", "in_progress", "complete", "cancelled", "paid", "pending_payment"];

const TYPE_LABELS: Record<string, string> = {
  menu: "Walk-in / Delivery",
  dinner: "Dinner Drop",
  shabbat: "Shabbat",
  bakery: "Bakery",
  catering: "Catering",
};

const STATUS_COLORS: Record<string, string> = {
  pending:         "bg-yellow-400/20 text-yellow-400",
  in_progress:     "bg-teal-400/20 text-teal-400",
  complete:        "bg-green-500/20 text-green-400",
  cancelled:       "bg-red-500/20 text-red-400",
  paid:            "bg-blue-400/20 text-blue-400",
  pending_payment: "bg-zinc-500/20 text-zinc-400",
};

function itemsSummary(items: OrderLogItem["items"]): string {
  if (!items || items.length === 0) return "—";
  return items.map(i => `${i.qty > 1 ? `${i.qty}× ` : ""}${i.name}`).join(", ");
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function toCSV(orders: OrderLogItem[]): string {
  const header = [
    "Order #", "Date", "Customer", "Phone", "Type", "Fulfillment",
    "Address", "Items", "Subtotal", "Tax", "Delivery Fee", "Miles",
    "Tip", "Total", "Status", "Notes"
  ];
  const rows = orders.map(o => [
    o.order_number || o.id.slice(-6).toUpperCase(),
    new Date(o.created_at).toLocaleString("en-US"),
    o.customer_name,
    o.customer_phone || "",
    TYPE_LABELS[o.order_type] || o.order_type,
    o.fulfillment_type || "pickup",
    o.customer_address || "",
    itemsSummary(o.items),
    (o.subtotal ?? 0).toFixed(2),
    (o.tax_amount ?? 0).toFixed(2),
    (o.delivery_fee ?? 0).toFixed(2),
    (o.delivery_distance_miles ?? 0).toFixed(1),
    (o.tip_amount ?? 0).toFixed(2),
    Number(o.total).toFixed(2),
    o.status,
    (o.special_requests || "").replace(/,/g, ";"),
  ]);
  return [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OrdersLogTab() {
  const [orders, setOrders] = useState<OrderLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (typeFilter !== "all") q = q.eq("order_type", typeFilter);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (dateFrom) q = q.gte("created_at", dateFrom + "T00:00:00");
    if (dateTo)   q = q.lte("created_at", dateTo   + "T23:59:59");

    const { data } = await q.limit(500);
    setOrders((data as OrderLogItem[]) || []);
    setLoading(false);
  }, [typeFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter(o => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o.customer_name.toLowerCase().includes(s) ||
      (o.customer_phone || "").includes(s) ||
      (o.order_number || "").toLowerCase().includes(s)
    );
  });

  const totalRevenue = filtered.reduce((sum, o) => sum + Number(o.total), 0);
  const totalDeliveryFees = filtered.reduce((sum, o) => sum + Number(o.delivery_fee ?? 0), 0);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await supabase.from("orders").delete().eq("id", id);
    setOrders(prev => prev.filter(o => o.id !== id));
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "cancelled" } : o));
    setCancellingId(null);
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const now = new Date().toISOString().slice(0, 10);
    downloadCSV(toCSV(filtered), `thr-orders-${now}.csv`);
  };

  const handleExportAndReset = async () => {
    setResetting(true);
    setResetMsg("Fetching all orders…");

    // Fetch ALL orders (not just filtered) for full archive
    const { data: allOrders } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: true });

    if (!allOrders || allOrders.length === 0) {
      setResetMsg("No orders to archive.");
      setResetting(false);
      return;
    }

    setResetMsg(`Exporting ${allOrders.length} orders…`);
    const now = new Date().toISOString().slice(0, 10);
    downloadCSV(toCSV(allOrders as OrderLogItem[]), `thr-orders-archive-${now}.csv`);

    setResetMsg("Deleting orders from database…");
    const ids = allOrders.map((o: { id: string }) => o.id);
    // Delete in batches of 50
    for (let i = 0; i < ids.length; i += 50) {
      await supabase.from("orders").delete().in("id", ids.slice(i, i + 50));
    }

    setOrders([]);
    setResetMsg(`✅ Done! ${allOrders.length} orders exported and cleared.`);
    setResetting(false);
  };

  const inputCls = "bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-teal-500";
  const selectCls = `${inputCls} cursor-pointer`;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-white">Orders Log</h2>
          <p className="text-zinc-500 text-sm mt-1">All online orders. Delete cancellations. Export & clear weekly.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="px-5 py-2.5 rounded-full font-black text-sm bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 disabled:opacity-40 transition-colors"
          >
            ⬇ Export CSV ({filtered.length})
          </button>
          <button
            onClick={() => { setShowResetModal(true); setResetMsg(""); }}
            className="px-5 py-2.5 rounded-full font-black text-sm bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            🗂 Export & Reset Week
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">Search</label>
          <input
            className={inputCls + " w-full"}
            placeholder="Name, phone, order #"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">From</label>
          <input type="date" className={inputCls} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">To</label>
          <input type="date" className={inputCls} value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">Type</label>
          <select className={selectCls} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            {ORDER_TYPES.map(t => (
              <option key={t} value={t}>{t === "all" ? "All Types" : TYPE_LABELS[t] || t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">Status</label>
          <select className={selectCls} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s === "all" ? "All Statuses" : s.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 rounded-xl font-black text-sm bg-teal-500 text-black hover:bg-teal-400 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Orders", value: filtered.length.toString() },
          { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}` },
          { label: "Delivery Fees", value: `$${totalDeliveryFees.toFixed(2)}` },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-center">
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-4xl mb-3">⏳</p>
          <p className="font-black">Loading orders…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-black text-xl">No orders found</p>
          <p className="text-sm mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => {
            const isExpanded = expandedId === order.id;
            return (
              <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">

                {/* Summary row — click to expand */}
                <div
                  className="px-5 py-4 flex items-start gap-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <span className="font-black text-white text-base">{order.customer_name}</span>
                      {order.order_number && <span className="font-mono text-xs text-zinc-500">{order.order_number}</span>}
                      <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || "bg-zinc-700 text-zinc-400"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                      {order.fulfillment_type === "delivery" && (
                        <span className="text-xs font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">🚗 Delivery</span>
                      )}
                      {order.scheduled_for && (
                        <span className="text-xs font-black px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300">
                          📅 {new Date(order.scheduled_for).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-zinc-500">
                      {order.customer_phone && <span>📞 {order.customer_phone}</span>}
                      <span>{TYPE_LABELS[order.order_type] || order.order_type}</span>
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                    <p className="text-sm text-zinc-500 mt-1 truncate">{itemsSummary(order.items)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-white text-lg">${Number(order.total).toFixed(2)}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{isExpanded ? "▲ collapse" : "▼ details"}</p>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 px-5 py-5 space-y-5">

                    {/* Items */}
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Items</p>
                      <div className="space-y-2">
                        {(order.items || []).map((item, i) => (
                          <div key={i} className="flex justify-between items-start text-sm">
                            <div>
                              <span className="font-bold text-white">{item.qty > 1 ? `${item.qty}× ` : ""}{item.name}</span>
                              {item.size && <span className="text-zinc-500 ml-2 text-xs">{item.size}</span>}
                              {item.addons && item.addons.length > 0 && (
                                <p className="text-zinc-500 text-xs mt-0.5">+ {item.addons.join(", ")}</p>
                              )}
                              {item.mods && <p className="text-orange-400 text-xs mt-0.5">⚠ {item.mods}</p>}
                            </div>
                            <span className="font-black text-white ml-4 shrink-0">${(item.unit_price ? item.unit_price * item.qty : item.price ?? 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Totals */}
                    <div className="bg-zinc-800 rounded-xl p-4 space-y-1 text-sm">
                      <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>${Number(order.subtotal ?? 0).toFixed(2)}</span></div>
                      <div className="flex justify-between text-zinc-400"><span>Tax</span><span>${Number(order.tax_amount ?? 0).toFixed(2)}</span></div>
                      {(order.delivery_fee ?? 0) > 0 && (
                        <div className="flex justify-between text-blue-300">
                          <span>Delivery{(order.delivery_distance_miles ?? 0) > 0 ? ` (${Number(order.delivery_distance_miles).toFixed(1)}mi)` : ""}</span>
                          <span>${Number(order.delivery_fee).toFixed(2)}</span>
                        </div>
                      )}
                      {(order.tip_amount ?? 0) > 0 && (
                        <div className="flex justify-between text-teal-400"><span>Tip</span><span>${Number(order.tip_amount).toFixed(2)}</span></div>
                      )}
                      <div className="flex justify-between font-black text-white border-t border-zinc-700 pt-2 mt-1"><span>Total</span><span>${Number(order.total).toFixed(2)}</span></div>
                    </div>

                    {/* Customer info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {order.customer_phone && <div><p className="text-zinc-500 text-xs uppercase tracking-wide mb-0.5">Phone</p><p className="text-white">{order.customer_phone}</p></div>}
                      {order.customer_email && <div><p className="text-zinc-500 text-xs uppercase tracking-wide mb-0.5">Email</p><p className="text-white">{order.customer_email}</p></div>}
                      {order.customer_address && order.customer_address !== "Pickup" && (
                        <div className="col-span-2"><p className="text-zinc-500 text-xs uppercase tracking-wide mb-0.5">Delivery Address</p><p className="text-blue-300">{order.customer_address}</p></div>
                      )}
                    </div>

                    {order.special_requests && (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                        <p className="text-xs font-black text-orange-400 uppercase tracking-wide mb-1">Special Requests</p>
                        <p className="text-orange-300 text-sm">{order.special_requests}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      {order.status !== "cancelled" && (
                        <button onClick={e => { e.stopPropagation(); handleCancel(order.id); }} disabled={cancellingId === order.id}
                          className="text-xs font-black px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-orange-400 hover:border-orange-400 disabled:opacity-50 transition-colors">
                          {cancellingId === order.id ? "…" : "Cancel Order"}
                        </button>
                      )}
                      {confirmDeleteId === order.id ? (
                        <div className="flex gap-2">
                          <button onClick={e => { e.stopPropagation(); handleDelete(order.id); }} disabled={deletingId === order.id}
                            className="text-xs font-black px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-400 disabled:opacity-50 transition-colors">
                            {deletingId === order.id ? "…" : "Yes, delete"}
                          </button>
                          <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(null); }}
                            className="text-xs font-black px-4 py-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                            Keep
                          </button>
                        </div>
                      ) : (
                        <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(order.id); }}
                          className="text-xs font-black px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-600 hover:text-red-400 hover:border-red-400 transition-colors">
                          🗑 Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Export & Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-xl font-black text-white mb-2">Export & Reset Week</h3>
            <p className="text-zinc-400 text-sm mb-6">
              This will download <strong className="text-white">all orders</strong> in the database as a CSV file,
              then <strong className="text-red-400">permanently delete them</strong> to start fresh.
              Run this at the end of each week after reviewing.
            </p>

            {resetMsg && (
              <div className={`rounded-xl px-4 py-3 mb-6 text-sm font-black ${resetMsg.startsWith("✅") ? "bg-green-500/20 text-green-400" : "bg-teal-500/10 text-teal-400"}`}>
                {resetMsg}
              </div>
            )}

            <div className="flex gap-3">
              {!resetMsg.startsWith("✅") && (
                <button
                  onClick={handleExportAndReset}
                  disabled={resetting}
                  className="flex-1 py-3 rounded-full font-black bg-red-500 text-white hover:bg-red-400 disabled:opacity-50 transition-colors"
                >
                  {resetting ? "Working…" : "⬇ Export & Clear All"}
                </button>
              )}
              <button
                onClick={() => { setShowResetModal(false); setResetMsg(""); }}
                className="flex-1 py-3 rounded-full font-black bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
              >
                {resetMsg.startsWith("✅") ? "Close" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
