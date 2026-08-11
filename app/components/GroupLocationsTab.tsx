"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Location = {
  id: string;
  name: string;
  address: string;
  slug: string;
  is_active: boolean;
  delivery_date: string | null;
  order_cutoff: string | null;
  created_at: string;
};

type GroupOrder = {
  id: string;
  location_slug: string;
  person_name: string;
  customer_email?: string;
  items: { name: string; qty?: number; price?: number; description?: string }[];
  total: number;
  special_requests: string;
  delivery_date: string | null;
  status: string;
  stripe_session_id?: string;
  created_at: string;
};

const BASE_URL = "https://www.thehungryroostertx.com";

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function GroupLocationsTab() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [orders, setOrders] = useState<GroupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", slug: "", delivery_date: "", order_cutoff: "" });
  const [slugManual, setSlugManual] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [manifestSlug, setManifestSlug] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: locs }, { data: ords }] = await Promise.all([
      supabase.from("group_locations").select("*").order("created_at", { ascending: false }),
      supabase.from("group_orders").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setLocations((locs as Location[]) || []);
    setOrders((ords as GroupOrder[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: slugManual ? f.slug : toSlug(name) }));
  };

  const handleSlugChange = (slug: string) => {
    setSlugManual(true);
    setForm(f => ({ ...f, slug: toSlug(slug) }));
  };

  const handleCreate = async () => {
    setError("");
    setSuccess("");
    if (!form.name.trim() || !form.address.trim() || !form.slug.trim()) {
      setError("All fields are required.");
      return;
    }
    setSaving(true);
    const { error: dbErr } = await supabase.from("group_locations").insert({
      name: form.name.trim(),
      address: form.address.trim(),
      slug: form.slug.trim(),
      is_active: true,
      delivery_date: form.delivery_date || null,
      order_cutoff: form.order_cutoff ? new Date(form.order_cutoff).toISOString() : null,
    });
    if (dbErr) {
      setError(dbErr.message.includes("unique") ? "That URL slug is already taken — try a different one." : dbErr.message);
      setSaving(false);
      return;
    }
    setSuccess(`✅ Created! Link: ${BASE_URL}/group/${form.slug.trim()}`);
    setForm({ name: "", address: "", slug: "", delivery_date: "", order_cutoff: "" });
    setSlugManual(false);
    setShowForm(false);
    setSaving(false);
    fetchAll();
  };

  const handleToggleActive = async (loc: Location) => {
    await supabase.from("group_locations").update({ is_active: !loc.is_active }).eq("id", loc.id);
    setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, is_active: !l.is_active } : l));
  };

  const copyLink = (slug: string, id: string) => {
    navigator.clipboard.writeText(`${BASE_URL}/group/${slug}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const markOrderComplete = async (id: string) => {
    await supabase.from("group_orders").update({ status: "complete" }).eq("id", id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "complete" } : o));
  };

  const inputCls = "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-400 text-sm";
  const labelCls = "text-xs text-zinc-500 uppercase tracking-widest block mb-1.5";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">🏢 Group Orders</h2>
          <p className="text-zinc-500 text-sm mt-1">Manage client locations and view incoming orders.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchAll} className="text-sm font-black text-zinc-400 hover:text-white border border-zinc-700 px-4 py-2 rounded-full transition-colors">
            ↻ Refresh
          </button>
          <button
            onClick={() => { setShowForm(true); setError(""); setSuccess(""); }}
            className="text-sm font-black bg-orange-500 hover:bg-orange-400 text-white px-5 py-2 rounded-full transition-colors"
          >
            + New Client Link
          </button>
        </div>
      </div>

      {/* Success banner */}
      {success && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-xl px-5 py-3 text-green-400 text-sm font-bold mb-6">
          {success}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-zinc-900 border border-orange-500/30 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-black text-white mb-5">New Client Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Company / Client Name *</label>
              <input
                className={inputCls}
                placeholder="Acme Corporation"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Delivery Address *</label>
              <input
                className={inputCls}
                placeholder="123 Business Blvd, Dallas, TX 75201"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className={labelCls}>URL Slug * — auto-generated, or customize</label>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-sm shrink-0">{BASE_URL}/group/</span>
              <input
                className={inputCls}
                placeholder="acme-corporation"
                value={form.slug}
                onChange={e => handleSlugChange(e.target.value)}
              />
            </div>
            {form.slug && (
              <p className="text-teal-400 text-xs mt-1.5 font-mono">{BASE_URL}/group/{form.slug}</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Delivery Date — all orders on this link deliver on this day</label>
              <input
                type="date"
                className={inputCls}
                value={form.delivery_date}
                onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>Order Cutoff (date & time) — orders close at this time</label>
              <input
                type="datetime-local"
                className={inputCls}
                value={form.order_cutoff}
                onChange={e => setForm(f => ({ ...f, order_cutoff: e.target.value }))}
              />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mb-4 font-bold">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="font-black bg-orange-500 hover:bg-orange-400 text-white px-6 py-2.5 rounded-full text-sm transition-colors disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create & Get Link"}
            </button>
            <button
              onClick={() => { setShowForm(false); setError(""); setForm({ name: "", address: "", slug: "", delivery_date: "", order_cutoff: "" }); setSlugManual(false); }}
              className="font-black text-zinc-400 hover:text-white px-6 py-2.5 rounded-full text-sm border border-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500 py-8 text-center">Loading…</p>
      ) : (
        <>
          {/* Locations list */}
          <div className="mb-10">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Client Links</h3>
            {locations.length === 0 ? (
              <p className="text-zinc-600 text-sm py-6 text-center">No locations yet — create one above.</p>
            ) : (
              <div className="space-y-3">
                {locations.map(loc => (
                  <div key={loc.id} className={`bg-zinc-900 border rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap ${loc.is_active ? "border-zinc-800" : "border-zinc-800 opacity-50"}`}>
                    <div>
                      <p className="font-black text-white">{loc.name}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{loc.address}</p>
                      <p className="text-teal-400 text-xs font-mono mt-1">{BASE_URL}/group/{loc.slug}</p>
                      {loc.delivery_date && (
                        <p className="text-yellow-400 text-xs mt-1 font-bold">
                          📅 Delivery: {new Date(loc.delivery_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </p>
                      )}
                      {loc.order_cutoff && (
                        <p className="text-zinc-500 text-xs mt-0.5">
                          ⏰ Cutoff: {new Date(loc.order_cutoff).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => copyLink(loc.slug, loc.id)}
                        className="text-xs font-black px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:border-teal-500 transition-colors"
                      >
                        {copiedId === loc.id ? "✓ Copied!" : "📋 Copy Link"}
                      </button>
                      <button
                        onClick={() => setManifestSlug(loc.slug)}
                        className="text-xs font-black px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-colors"
                      >
                        📋 Manifest
                      </button>
                      <button
                        onClick={() => handleToggleActive(loc)}
                        className={`text-xs font-black px-4 py-2 rounded-full border transition-colors ${loc.is_active ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-orange-400 hover:border-orange-400" : "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"}`}
                      >
                        {loc.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Orders */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Incoming Orders</h3>
              <div className="flex gap-3 text-xs text-zinc-600">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500 inline-block" /> Paid</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-600 inline-block" /> Pending/Abandoned</span>
              </div>
            </div>
            {orders.length === 0 ? (
              <p className="text-zinc-600 text-sm py-6 text-center">No group orders yet.</p>
            ) : (
              <div className="space-y-3">
                {orders.map(o => {
                  const isPaid = o.status === "paid" || o.status === "complete";
                  const hasItems = Array.isArray(o.items) && o.items.length > 0;
                  const isAbandoned = o.status === "pending" && !hasItems && !o.stripe_session_id;
                  const isExpanded = expandedOrderId === o.id;
                  const deliveryLabel = o.delivery_date
                    ? new Date(o.delivery_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                    : null;

                  return (
                    <div
                      key={o.id}
                      className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-all ${
                        o.status === "complete" ? "border-zinc-800 opacity-40" :
                        isPaid ? "border-teal-500/40" :
                        "border-zinc-700 opacity-60"
                      }`}
                    >
                      {/* Clickable header row */}
                      <button
                        onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                        className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isPaid ? "bg-teal-500" : "bg-zinc-600"}`} />
                          <div className="min-w-0">
                            <p className="font-black text-white leading-none">{o.person_name}</p>
                            <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mt-0.5">{o.location_slug.replace(/-/g, " ")}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {deliveryLabel && <span className="text-zinc-400 text-xs">📅 {deliveryLabel}</span>}
                              <span className="text-zinc-600 text-xs">{new Date(o.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                              {isAbandoned && <span className="text-xs text-zinc-500 italic">abandoned</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-3">
                          <div>
                            <p className={`font-black text-lg ${isPaid ? "text-teal-400" : "text-zinc-500"}`}>${Number(o.total).toFixed(2)}</p>
                            <p className={`text-xs font-bold uppercase ${isPaid ? "text-teal-500" : "text-zinc-600"}`}>{o.status}</p>
                          </div>
                          <span className="text-zinc-600 text-sm">{isExpanded ? "▲" : "▼"}</span>
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="px-5 pb-5 border-t border-zinc-800 pt-4">
                          {o.customer_email && (
                            <p className="text-zinc-400 text-xs mb-3">✉️ {o.customer_email}</p>
                          )}
                          {hasItems ? (
                            <div className="bg-zinc-800 rounded-xl p-3 mb-3 space-y-1">
                              {o.items.map((item, i) => (
                                <div key={i} className="py-1 border-b border-zinc-700 last:border-0">
                                  <div className="flex justify-between items-baseline gap-2">
                                    <p className="text-zinc-200 text-sm font-bold">{item.qty && item.qty > 1 ? `${item.qty}× ` : ""}{item.name}</p>
                                    {item.price != null && <p className="text-zinc-400 text-xs shrink-0">${(item.price * (item.qty || 1)).toFixed(2)}</p>}
                                  </div>
                                  {item.description && <p className="text-zinc-500 text-xs mt-0.5">{item.description}</p>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-zinc-600 text-xs italic mb-3">No items — customer abandoned checkout before paying.</p>
                          )}
                          {o.special_requests && (
                            <p className="text-yellow-400 text-xs mb-3">📝 {o.special_requests}</p>
                          )}
                          {o.stripe_session_id && (
                            <p className="text-zinc-600 text-xs font-mono mb-3 truncate">Stripe: {o.stripe_session_id}</p>
                          )}
                          <div className="flex gap-2">
                            {o.status !== "complete" && isPaid && (
                              <button
                                onClick={() => markOrderComplete(o.id)}
                                className="text-xs font-black text-zinc-400 hover:text-teal-400 border border-zinc-700 hover:border-teal-500 px-4 py-2 rounded-full transition-colors"
                              >
                                ✓ Mark Complete
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
          </div>
        </>
      )}

      {/* Order Manifest Modal */}
      {manifestSlug && (() => {
        const loc = locations.find(l => l.slug === manifestSlug);
        const paidOrders = orders.filter(o =>
          o.location_slug === manifestSlug &&
          (o.status === "paid" || o.status === "complete") &&
          Array.isArray(o.items) && o.items.length > 0
        );

        // Aggregate items across all paid orders
        const itemMap: Record<string, { name: string; qty: number; price: number }> = {};
        for (const order of paidOrders) {
          for (const item of order.items) {
            const key = item.name;
            if (!itemMap[key]) itemMap[key] = { name: item.name, qty: 0, price: item.price || 0 };
            itemMap[key].qty += item.qty || 1;
          }
        }
        const aggregated = Object.values(itemMap).sort((a, b) => b.qty - a.qty);
        const grandTotal = paidOrders.reduce((s, o) => s + (o.total || 0), 0);

        const printManifest = () => {
          const deliveryLabel = loc?.delivery_date
            ? new Date(loc.delivery_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
            : "";

          const prepRows = aggregated.map(item =>
            `<tr><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:700;font-size:15px">${item.name}</td><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:22px;font-weight:900;color:#f97316">${item.qty}</td></tr>`
          ).join("");

          const orderRows = paidOrders.map(o =>
            `<div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:8px">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <strong>${o.person_name}</strong>
                <span style="color:#059669">$${Number(o.total).toFixed(2)}</span>
              </div>
              <div style="color:#6b7280;font-size:13px">${o.items.map(i => `${i.qty && i.qty > 1 ? i.qty + "× " : ""}${i.name}`).join(", ")}</div>
              ${o.special_requests ? `<div style="color:#d97706;font-size:12px;margin-top:4px">📝 ${o.special_requests}</div>` : ""}
            </div>`
          ).join("");

          const html = `<!DOCTYPE html><html><head><title>${loc?.name} — Order Manifest</title>
            <style>body{font-family:sans-serif;max-width:700px;margin:0 auto;padding:24px;color:#111}h1{font-size:22px;font-weight:900;margin:0 0 4px}h2{font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin:20px 0 8px}table{width:100%;border-collapse:collapse}@media print{@page{margin:12mm}}</style>
            </head><body>
            <h1>${loc?.name} — Order Manifest</h1>
            <div style="color:#6b7280;font-size:14px;margin-bottom:20px">${deliveryLabel ? `📅 ${deliveryLabel} · ` : ""}${paidOrders.length} orders · $${grandTotal.toFixed(2)}</div>
            <h2>What to Prepare</h2>
            <table><tbody>${prepRows}</tbody></table>
            <h2>Individual Orders</h2>
            ${orderRows}
            <div style="border-top:2px solid #111;margin-top:20px;padding-top:12px;display:flex;justify-content:space-between;font-weight:900;font-size:18px">
              <span>${paidOrders.length} orders · ${aggregated.reduce((s, i) => s + i.qty, 0)} items</span>
              <span>$${grandTotal.toFixed(2)}</span>
            </div>
          </body></html>`;

          const w = window.open("", "_blank", "width=800,height=900");
          if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
        };

        return (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-zinc-900 border border-orange-500/30 rounded-2xl w-full max-w-2xl my-8">
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-zinc-800">
                <div>
                  <h2 className="text-xl font-black text-white">{loc?.name} — Order Manifest</h2>
                  <div className="flex gap-3 mt-1 flex-wrap">
                    {loc?.delivery_date && (
                      <span className="text-yellow-400 text-xs font-bold">
                        📅 {new Date(loc.delivery_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                      </span>
                    )}
                    <span className="text-zinc-400 text-xs">{paidOrders.length} paid order{paidOrders.length !== 1 ? "s" : ""}</span>
                    <span className="text-teal-400 text-xs font-bold">${grandTotal.toFixed(2)} total</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={printManifest}
                    title="Opens print dialog — choose 'Save as PDF' to download"
                    className="text-xs font-black text-zinc-400 hover:text-white border border-zinc-700 px-3 py-1.5 rounded-full transition-colors"
                  >
                    💾 Save as PDF
                  </button>
                  <button
                    onClick={() => setManifestSlug(null)}
                    className="text-zinc-500 hover:text-white text-xl leading-none px-2"
                  >
                    ×
                  </button>
                </div>
              </div>

              {paidOrders.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-zinc-500 text-lg">No paid orders yet for this location.</p>
                  <p className="text-zinc-600 text-sm mt-2">Orders will appear here once payment is completed.</p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Aggregated prep list */}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-orange-400 mb-3">What to Prepare</h3>
                    <div className="bg-zinc-800 rounded-xl overflow-hidden">
                      {aggregated.map((item, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 last:border-0">
                          <p className="text-white font-bold">{item.name}</p>
                          <div className="flex items-center gap-4">
                            {item.price > 0 && <p className="text-zinc-500 text-sm">${(item.price * item.qty).toFixed(2)}</p>}
                            <span className="bg-orange-500 text-white font-black text-lg w-10 h-10 rounded-full flex items-center justify-center">{item.qty}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Individual order breakdown */}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Individual Orders</h3>
                    <div className="space-y-2">
                      {paidOrders.map(o => (
                        <div key={o.id} className="bg-zinc-800 rounded-xl px-4 py-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-white font-black">{o.person_name}</p>
                            <p className="text-teal-400 font-bold text-sm">${Number(o.total).toFixed(2)}</p>
                          </div>
                          <p className="text-zinc-400 text-xs">
                            {o.items.map(item => `${item.qty && item.qty > 1 ? item.qty + "× " : ""}${item.name}`).join(", ")}
                          </p>
                          {o.special_requests && (
                            <p className="text-yellow-400 text-xs mt-1">📝 {o.special_requests}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary footer */}
                  <div className="border-t border-zinc-700 pt-4 flex justify-between items-center">
                    <p className="text-zinc-500 text-sm">{paidOrders.length} orders · {aggregated.reduce((s, i) => s + i.qty, 0)} total items</p>
                    <p className="text-white font-black text-xl">${grandTotal.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
