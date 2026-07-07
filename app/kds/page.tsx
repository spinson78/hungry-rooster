"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

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
  scheduled_for?: string | null;
  item_statuses?: Record<string, boolean>;
};

const TYPE_COLOR: Record<string, string> = {
  menu:     "bg-teal-400/20 text-teal-400 border-teal-400/30",
  dinner:   "bg-teal-400/20 text-teal-400 border-teal-400/30",
  shabbat:  "bg-yellow-400/20 text-yellow-400 border-yellow-400/30",
  bakery:   "bg-orange-400/20 text-orange-400 border-orange-400/30",
  doordash: "bg-red-500/20 text-red-400 border-red-400/30",
  ubereats: "bg-green-500/20 text-green-400 border-green-400/30",
  phone:    "bg-purple-400/20 text-purple-400 border-purple-400/30",
};

const SOURCE_LABELS: Record<string, string> = {
  doordash: "🚗 DoorDash",
  ubereats: "🟢 Uber Eats",
  phone:    "📞 Phone",
  menu:     "🛒 Online",
  dinner:   "🍽 Dinner",
};

function elapsed(created: string) {
  const mins = Math.floor((Date.now() - new Date(created).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function scheduledCountdown(scheduledFor: string) {
  const minsUntil = Math.floor((new Date(scheduledFor).getTime() - Date.now()) / 60000);
  if (minsUntil <= 0) return `${Math.abs(minsUntil)}m overdue`;
  if (minsUntil < 60) return `in ${minsUntil}m`;
  return `in ${Math.floor(minsUntil / 60)}h ${minsUntil % 60}m`;
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
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(880, ctx.currentTime + offset);
      gain.gain.setValueAtTime(0.4, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.18);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.2);
    });
  } catch { /* Audio not available */ }
}

function OrderCard({
  order, onUpdate, onPrint, isCompleted,
}: {
  order: Order; onUpdate: () => void; onPrint: (o: Order) => void; isCompleted?: boolean;
}) {
  const [updating, setUpdating] = useState(false);
  const [itemStatuses, setItemStatuses] = useState<Record<string, boolean>>(
    order.item_statuses || {}
  );

  // Sync item statuses when order prop updates (real-time from other kitchen)
  useEffect(() => {
    setItemStatuses(order.item_statuses || {});
  }, [order.item_statuses]);

  const isNew = order.status === "pending";
  const scheduledLabel = order.scheduled_for
    ? new Date(order.scheduled_for).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;
  const isStarted = order.status === "in_progress";
  // For scheduled orders: urgent when ≤10 min until scheduled time (or overdue)
  // For ASAP orders: urgent when waiting 10+ min since created
  const minsUntilScheduled = order.scheduled_for
    ? Math.floor((new Date(order.scheduled_for).getTime() - Date.now()) / 60000)
    : null;
  const minsElapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
  const urgent = !isCompleted && (
    minsUntilScheduled !== null ? minsUntilScheduled <= 10 : minsElapsed >= 10
  );

  const updateStatus = async (status: string) => {
    setUpdating(true);
    await supabase.from("orders").update({ status }).eq("id", order.id);
    onUpdate();
    setUpdating(false);
  };

  const toggleItem = async (index: number) => {
    if (isCompleted) return;
    const key = String(index);
    const newStatuses = { ...itemStatuses, [key]: !itemStatuses[key] };
    setItemStatuses(newStatuses); // Optimistic update
    await supabase.from("orders").update({ item_statuses: newStatuses }).eq("id", order.id);
  };

  const allItemsDone = order.items.length > 0 &&
    order.items.every((_, i) => itemStatuses[String(i)]);

  return (
    <div className={`rounded-2xl border-2 p-3 flex flex-col gap-2 transition-all ${
      isCompleted ? "border-zinc-700 bg-zinc-900/60 opacity-70" :
      order.fulfillment_type === "delivery" && !isCompleted ? (urgent ? "border-red-500 bg-red-500/10" : "border-blue-500 bg-blue-500/5") :
      isNew ? (urgent ? "border-red-500 bg-red-500/10" : "border-yellow-400 bg-yellow-400/5") :
      isStarted ? (allItemsDone ? "border-green-500 bg-green-500/10" : "border-teal-500 bg-teal-500/5") :
      "border-zinc-700 bg-zinc-900"
    }`}>

      {/* Delivery banner — top of card so it's impossible to miss */}
      {order.fulfillment_type === "delivery" && !isCompleted && order.customer_address && order.customer_address !== "Pickup" && (
        <div className="bg-blue-600 rounded-xl px-3 py-2 -mx-0 flex items-center gap-2">
          <span className="text-white font-black text-sm">🚗 DELIVERY</span>
          <span className="text-blue-100 text-xs font-bold truncate">{order.customer_address}</span>
        </div>
      )}

      {scheduledLabel && (
        <div className="bg-yellow-400/20 text-yellow-300 text-xs font-black px-2 py-0.5 rounded-full inline-block self-start">
          📅 {scheduledLabel}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white font-black text-lg leading-tight">{order.customer_name}</p>
          {order.customer_phone && <p className="text-zinc-400 text-xs mt-0.5">{order.customer_phone}</p>}
        </div>
        <div className="text-right shrink-0">
          {order.order_number && <p className="text-zinc-400 font-mono text-sm">{order.order_number}</p>}
          <p className={`text-sm font-black mt-0.5 ${urgent ? "text-red-400" : isCompleted ? "text-zinc-500" : isStarted ? "text-teal-400" : "text-yellow-400"}`}>
            {order.scheduled_for ? scheduledCountdown(order.scheduled_for) : elapsed(order.created_at)}
          </p>
        </div>
      </div>

      {/* Delivery address */}
      {order.fulfillment_type === "delivery" && order.customer_address && order.customer_address !== "Pickup" && (
        <div className="bg-blue-500/20 border border-blue-400/40 rounded-xl px-3 py-2">
          <p className="text-blue-300 font-black text-xs uppercase tracking-widest mb-1">🚗 Deliver to</p>
          <p className="text-white font-black text-sm leading-snug">{order.customer_address}</p>
        </div>
      )}

      {/* Status badges */}
      <div className="flex items-center gap-3 flex-wrap">
        {order.order_type === "menu" ? (
          order.fulfillment_type === "delivery" ? (
            <span className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full border bg-blue-500/20 text-blue-300 border-blue-400/30">🚗 Delivery</span>
          ) : (
            <span className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${TYPE_COLOR.menu}`}>🥡 Pickup</span>
          )
        ) : (
          <span className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${TYPE_COLOR[order.order_type] || TYPE_COLOR.menu}`}>
            {order.order_type}
          </span>
        )}
        {isNew && <span className="text-xs font-black text-yellow-400 animate-pulse">● NEW</span>}
        {isStarted && !allItemsDone && <span className="text-xs font-black text-teal-400">● IN PROGRESS</span>}
        {isStarted && allItemsDone && <span className="text-xs font-black text-green-400">✓ READY</span>}
        {isCompleted && <span className="text-xs font-black text-zinc-500">✓ DONE</span>}
        {urgent && <span className="text-xs font-black text-red-400">⚠ URGENT</span>}
      </div>

      {/* Items — tappable for per-item completion */}
      <div className="border-t border-zinc-700 pt-2 space-y-1">
        {!isCompleted && (
          <p className="text-zinc-600 text-xs uppercase tracking-widest mb-1">Tap to mark done</p>
        )}
        {order.items.map((item, i) => {
          const done = itemStatuses[String(i)];
          return (
            <div
              key={i}
              onClick={() => toggleItem(i)}
              className={`rounded-lg px-2 py-1 transition-all select-none ${
                !isCompleted ? "cursor-pointer hover:bg-zinc-800 active:scale-95" : ""
              } ${done ? "bg-green-500/15 border border-green-500/30" : "border border-transparent"}`}
            >
              <p className={`text-sm font-black transition-colors ${done ? "text-green-400 line-through" : "text-white"}`}>
                {item.qty > 1 && <span className={done ? "text-green-400" : "text-yellow-400"}>{item.qty}× </span>}
                {item.name}
                {item.size && <span className="text-zinc-400 text-xs font-normal"> — {item.size}</span>}
                {done && <span className="text-green-400 text-base ml-2">✓</span>}
              </p>
              {item.addons && item.addons.length > 0 && (
                <p className={`text-xs mt-0 ml-3 ${done ? "text-green-600 line-through" : "text-zinc-400"}`}>+ {item.addons.join(", ")}</p>
              )}
              {item.mods && (
                <p className={`text-xs font-bold mt-0 ml-3 ${done ? "text-green-600" : "text-orange-300"}`}>⚠ {item.mods}</p>
              )}
              {item.protein && (
                <p className={`text-xs mt-0 ml-3 ${done ? "text-green-600 line-through" : "text-zinc-400"}`}>
                  {[item.protein, item.side1, item.side2, item.extra].filter(Boolean).join(" / ")}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Special requests */}
      {order.special_requests && (
        <div className="bg-orange-400/15 border border-orange-400/40 rounded-xl px-3 py-2">
          <p className="text-orange-300 font-black text-xs">⚠ NOTE: {order.special_requests}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1">
        <button
          onClick={() => onPrint(order)}
          className="text-xs font-black text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-2 rounded-full transition-colors"
        >
          🖨
        </button>
        {isNew && (
          <button
            onClick={() => updateStatus("in_progress")}
            disabled={updating}
            className="flex-1 text-sm font-black bg-teal-500 hover:bg-teal-400 text-black py-2 rounded-full transition-colors disabled:opacity-50"
          >
            Start ▶
          </button>
        )}
        {isStarted && (
          <button
            onClick={() => updateStatus("complete")}
            disabled={updating}
            className={`flex-1 text-sm font-black py-2 rounded-full transition-colors disabled:opacity-50 ${
              allItemsDone
                ? "bg-green-500 hover:bg-green-400 text-black"
                : "bg-yellow-400 hover:bg-yellow-300 text-black"
            }`}
          >
            Done ✓
          </button>
        )}
        {isCompleted && (
          <button
            onClick={() => updateStatus("in_progress")}
            disabled={updating}
            className="flex-1 text-sm font-black bg-zinc-700 hover:bg-zinc-600 text-white py-2 rounded-full transition-colors disabled:opacity-50"
          >
            ↩ Recall
          </button>
        )}
      </div>
    </div>
  );
}

export default function KDSPage() {
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const [qSource, setQSource] = useState<"doordash"|"ubereats"|"phone">("doordash");
  const [qName, setQName] = useState("");
  const [qItems, setQItems] = useState([{ name: "", qty: 1 }]);
  const [qNotes, setQNotes] = useState("");
  const [qSubmitting, setQSubmitting] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [connectionError, setConnectionError] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [muted, setMuted] = useState(false);
  const knownOrderIds = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  const isWithinWindow = (order: Order) => {
    if (!order.scheduled_for) return true; // ASAP order — always show
    const scheduledMs = new Date(order.scheduled_for).getTime();
    return scheduledMs <= Date.now() + 20 * 60 * 1000; // within 20 minutes
  };

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["pending", "in_progress", "complete"])
      .in("order_type", ["menu", "doordash", "ubereats", "phone"])
      .order("created_at", { ascending: true });
    // If Supabase returns an error (outage, network issue), don't update display
    if (error) {
      console.error("KDS fetch error:", error.message);
      setConnectionError(true);
      return;
    }
    setConnectionError(false);
    const all = (data as Order[]) || [];

    // Only surface orders that are ASAP or within 20 min of their scheduled time
    const visible = all.filter(isWithinWindow);

    if (initialLoadDone.current) {
      const newPending = visible.filter(
        o => o.status === "pending" && !knownOrderIds.current.has(o.id)
      );
      if (newPending.length > 0) playAlarm(muted);
    }

    visible.forEach(o => knownOrderIds.current.add(o.id));
    initialLoadDone.current = true;
    setOrders(visible);
  }, [muted]);

  useEffect(() => {
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
  }, [fetchOrders]);

  void now;

  const active = orders.filter(o => o.status === "pending" || o.status === "in_progress");
  // Completed: today only — auto-clears at midnight
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const completed = orders
    .filter(o => o.status === "complete" && new Date(o.created_at) >= todayMidnight)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 15);

  const handlePrint = (o: Order) => { setPrintOrder(o); setTimeout(() => window.print(), 100); };

  const handleQuickOrder = async () => {
    const validItems = qItems.filter(i => i.name.trim());
    if (!qName.trim() || validItems.length === 0) return;
    setQSubmitting(true);
    const orderNum = `3P-${Date.now().toString().slice(-6)}`;
    const items = validItems.map(i => ({ name: i.name.trim(), qty: i.qty, price: 0 }));
    const { error } = await supabase.from("orders").insert({
      order_number: orderNum,
      order_type: qSource,
      customer_name: qName.trim(),
      customer_email: "",
      customer_phone: "",
      customer_address: "Pickup",
      fulfillment_type: "pickup",
      sms_opted_in: false,
      items,
      subtotal: 0, tax_amount: 0, tip_amount: 0, total: 0,
      special_requests: qNotes.trim(),
      status: "pending",
    });
    if (error) { alert("Error: " + error.message); setQSubmitting(false); return; }
    setQName(""); setQItems([{ name: "", qty: 1 }]); setQNotes("");
    setShowQuickOrder(false);
    setQSubmitting(false);
    fetchOrders();
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6">

      {/* Header */}
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
            onClick={fetchOrders}
            className="text-base font-black text-zinc-400 hover:text-white border border-zinc-700 px-5 py-2.5 rounded-full transition-colors"
          >
            ↻ Refresh
          </button>
          <button
            onClick={() => setShowQuickOrder(true)}
            className="text-base font-black bg-yellow-400 hover:bg-yellow-300 text-black px-5 py-2.5 rounded-full transition-colors"
          >
            + New Order
          </button>
        </div>
      </div>

      {/* Connection error banner */}
      {connectionError && (
        <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
          <span className="text-yellow-400 text-xl">⚠️</span>
          <div>
            <p className="text-yellow-400 font-black text-sm">Database connection issue — retrying…</p>
            <p className="text-yellow-300/70 text-xs">Orders shown are your last known state. New orders may be delayed.</p>
          </div>
          <button onClick={fetchOrders} className="ml-auto text-xs font-black text-yellow-400 hover:text-yellow-300 border border-yellow-500/40 px-3 py-1.5 rounded-full transition-colors">
            Retry Now
          </button>
        </div>
      )}

      {/* Active Orders */}
      {active.length === 0 && completed.length === 0 ? (
        <div className="flex items-center justify-center h-72 text-zinc-600">
          <div className="text-center">
            <p className="text-7xl mb-4">🐓</p>
            <p className="font-black text-2xl">No active orders</p>
            <p className="text-lg mt-2">New orders will appear here automatically</p>
          </div>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
              {active.map(order => (
                <OrderCard key={order.id} order={order} onUpdate={fetchOrders} onPrint={handlePrint} />
              ))}
            </div>
          )}

          {/* Completed Backlog */}
          {completed.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <p className="text-zinc-500 font-black text-sm uppercase tracking-widest">Completed — tap Recall if needed</p>
                <span className="bg-zinc-800 text-zinc-500 font-black text-xs px-3 py-1 rounded-full">{completed.length}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {completed.map(order => (
                  <OrderCard key={order.id} order={order} onUpdate={fetchOrders} onPrint={handlePrint} isCompleted />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick Order Modal */}
      {showQuickOrder && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-black text-white">New Order</h2>
              <button onClick={() => setShowQuickOrder(false)} className="text-zinc-400 hover:text-white text-2xl leading-none">×</button>
            </div>

            {/* Source */}
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Order Source</p>
              <div className="flex gap-2">
                {(["doordash","ubereats","phone"] as const).map(s => (
                  <button key={s} onClick={() => setQSource(s)}
                    className={`flex-1 py-2.5 rounded-full font-black text-sm transition-colors ${qSource === s ? (s === "doordash" ? "bg-red-500 text-white" : s === "ubereats" ? "bg-green-500 text-black" : "bg-purple-500 text-white") : "bg-zinc-800 text-zinc-400 hover:text-white"}`}>
                    {s === "doordash" ? "🚗 DoorDash" : s === "ubereats" ? "🟢 Uber Eats" : "📞 Phone"}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer name */}
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Customer Name *</p>
              <input
                value={qName}
                onChange={e => setQName(e.target.value)}
                placeholder="e.g. John D."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400"
              />
            </div>

            {/* Items */}
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Items *</p>
              <div className="space-y-2">
                {qItems.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      value={item.name}
                      onChange={e => setQItems(prev => prev.map((it, idx) => idx === i ? { ...it, name: e.target.value } : it))}
                      placeholder="Item name"
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400"
                    />
                    <div className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2">
                      <button onClick={() => setQItems(prev => prev.map((it, idx) => idx === i ? { ...it, qty: Math.max(1, it.qty - 1) } : it))} className="text-zinc-400 hover:text-white font-black w-6 text-center">−</button>
                      <span className="text-white font-black w-5 text-center text-sm">{item.qty}</span>
                      <button onClick={() => setQItems(prev => prev.map((it, idx) => idx === i ? { ...it, qty: it.qty + 1 } : it))} className="text-zinc-400 hover:text-white font-black w-6 text-center">+</button>
                    </div>
                    {qItems.length > 1 && (
                      <button onClick={() => setQItems(prev => prev.filter((_, idx) => idx !== i))} className="text-zinc-600 hover:text-red-400 text-lg leading-none">✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setQItems(prev => [...prev, { name: "", qty: 1 }])}
                className="mt-3 text-xs font-black text-teal-400 hover:text-teal-300 transition-colors">
                + Add another item
              </button>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Special Requests</p>
              <textarea
                value={qNotes}
                onChange={e => setQNotes(e.target.value)}
                rows={2}
                placeholder="Allergies, mods, notes..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400 resize-none"
              />
            </div>

            <button
              onClick={handleQuickOrder}
              disabled={qSubmitting || !qName.trim() || qItems.every(i => !i.name.trim())}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black font-black py-4 rounded-full text-lg transition-colors"
            >
              {qSubmitting ? "Sending to Kitchen…" : "Fire Order 🔥"}
            </button>
          </div>
        </div>
      )}

      {/* Print ticket */}
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
            <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: "bold", color: printOrder.fulfillment_type === "delivery" ? "#1d4ed8" : "#000" }}>
              {printOrder.fulfillment_type === "delivery" ? "🚗 DELIVERY" : (printOrder.order_type === "menu" ? "Walk-in" : printOrder.order_type)}
            </span>
          </div>
          {printOrder.customer_phone && <p style={{ fontSize: "10px" }}>{printOrder.customer_phone}</p>}
          {printOrder.fulfillment_type === "delivery" && printOrder.customer_address && printOrder.customer_address !== "Pickup" && (
            <>
              <p style={{ fontWeight: "bold", fontSize: "12px", marginTop: "4px", borderTop: "2px solid #1d4ed8", paddingTop: "4px" }}>🚗 DELIVER TO:</p>
              <p style={{ fontSize: "12px", fontWeight: "bold" }}>{printOrder.customer_address}</p>
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
        #kds-print-ticket { display: none; font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; background: white; color: black; padding: 4mm; }
        @media print { body > * { display: none !important; } #kds-print-ticket { display: block !important; } @page { margin: 2mm; size: 80mm auto; } }
      `}</style>
    </div>
  );
}
