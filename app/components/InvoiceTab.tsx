"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type LineItem = { id: string; description: string; qty: number; rate: number };

type Invoice = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_company: string;
  line_items: LineItem[];
  notes: string;
  total: number;
  tax_amount: number;
  tax_exempt: boolean;
  delivery_fee: number;
  service_fee: number;
  gratuity: number;
  delivery_type: string;
  delivery_address: string;
  status: string;
  payment_method: string;
  stripe_checkout_url: string;
  stripe_session_id: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  sales_rep: string;
  commission_rate: number;
  commission_amount: number;
};

const REPS = [
  { value: "house", label: "House Account", rate: 0 },
  { value: "abigayle", label: "Abigayle Pinson", rate: 10 },
  { value: "jordona", label: "Jordona Kohn", rate: 10 },
];

const TAX_RATE = 0.0825;

const STATUS_STYLE: Record<string, string> = {
  draft:   "text-zinc-400 bg-zinc-800 border border-zinc-700",
  sent:    "text-blue-400 bg-blue-500/10 border border-blue-500/30",
  paid:    "text-teal-400 bg-teal-500/10 border border-teal-500/30",
  overdue: "text-red-400 bg-red-500/10 border border-red-500/30",
};

const fmt = (n: number | string) => `$${Number(n).toFixed(2)}`;
const newItem = (): LineItem => ({ id: Math.random().toString(36).slice(2), description: "", qty: 1, rate: 0 });

const emptyForm = {
  customer_name: "", customer_email: "", customer_phone: "", customer_company: "",
  line_items: [newItem()],
  notes: "", due_date: "", sales_rep: "house",
  delivery_type: "pickup", delivery_address: "",
  delivery_fee: 0, service_fee: 0, tax_exempt: false,
};

export default function InvoiceTab() {
  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [payMethod, setPayMethod] = useState("cash");
  const [actionMsg, setActionMsg] = useState("");

  const fetchInvoices = async () => {
    setLoading(true);
    const { data } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
    setInvoices((data as Invoice[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, []);

  // ── Calculations ──────────────────────────────────────────────
  const lineTotal = (item: LineItem) => Number(item.qty) * Number(item.rate);
  const subtotal = form.line_items.reduce((s, i) => s + lineTotal(i), 0);  // lineTotal uses Number() internally
  const taxExempt = !!form.tax_exempt;
  const tax = taxExempt ? 0 : subtotal * TAX_RATE;
  const deliveryFee = Number(form.delivery_fee) || 0;
  const serviceFee = Number(form.service_fee) || 0;
  // commission base is subtotal only
  const grandTotal = subtotal + tax + deliveryFee + serviceFee;
  const rep = REPS.find(r => r.value === form.sales_rep) || REPS[0];
  const commission = subtotal * (rep.rate / 100);

  const updateItem = (id: string, field: keyof LineItem, val: string | number) => {
    setForm(f => ({ ...f, line_items: f.line_items.map(i => i.id === id ? { ...i, [field]: val } : i) }));
  };

  const handleSave = async (sendAfter = false) => {
    setSaving(true);
    setActionMsg("");
    try {
    // Always fetch fresh from DB before generating number — avoids stale state after delete
    const { data: freshData } = await supabase
      .from("invoices")
      .select("invoice_number")
      .order("created_at", { ascending: false });
    const freshInvoices = (freshData as { invoice_number: string }[]) || [];
    const year = new Date().getFullYear();
    const prefix = `THR-${year}-`;
    const thisYear = freshInvoices.filter(i => i.invoice_number?.startsWith(prefix));
    const maxNum = thisYear.reduce((max, inv) => {
      const n = parseInt(inv.invoice_number.replace(prefix, ""), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const invoice_number = `${prefix}${String(maxNum + 1).padStart(3, "0")}`;

    const payload = {
      invoice_number,
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      customer_phone: form.customer_phone,
      customer_company: form.customer_company,
      line_items: form.line_items,
      notes: form.notes,
      due_date: form.due_date || null,
      delivery_type: form.delivery_type,
      delivery_address: form.delivery_type === "delivery" ? form.delivery_address : "",
      delivery_fee: isNaN(deliveryFee) ? 0 : deliveryFee,
      service_fee: isNaN(serviceFee) ? 0 : serviceFee,
      tax_exempt: taxExempt,
      tax_amount: isNaN(tax) ? 0 : tax,
      total: isNaN(grandTotal) ? 0 : grandTotal,
      sales_rep: form.sales_rep,
      commission_rate: isNaN(rep.rate) ? 0 : rep.rate,
      commission_amount: isNaN(commission) ? 0 : commission,
      status: "draft",
    };

    console.log("Saving invoice payload:", JSON.stringify(payload, null, 2));
    const { data, error } = await supabase.from("invoices").insert(payload).select().single();
    setSaving(false);
    if (error) { setActionMsg(`Error: ${error.message} (code: ${error.code})`); console.error("Supabase error:", error); return; }

    await fetchInvoices();
    setSelected(data as Invoice);

    if (sendAfter) {
      setView("detail");
      await handleSend(data as Invoice);
    } else {
      setView("detail");
      setActionMsg("Invoice saved as draft.");
    }
    } catch (err: unknown) {
      setSaving(false);
      const msg = err instanceof Error ? err.message : String(err);
      setActionMsg(`Unexpected error: ${msg}`);
      console.error("Caught error:", err);
    }
  };

  const handleSend = async (inv?: Invoice) => {
    const target = inv || selected;
    if (!target) return;
    setSending(true);
    setActionMsg("");
    try {
      const res = await fetch("/api/invoice-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: target.id }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchInvoices();
        const { data: updated } = await supabase.from("invoices").select("*").eq("id", target.id).single();
        if (updated) setSelected(updated as Invoice);
        if (data.email_failed) {
          setActionMsg("Payment link generated! Email couldn't send (domain not verified yet) — copy the link below to send manually.");
        } else {
          setActionMsg("Invoice sent! Customer will receive an email with payment link.");
        }
      } else {
        await fetchInvoices();
        const { data: updated } = await supabase.from("invoices").select("*").eq("id", target.id).single();
        if (updated) setSelected(updated as Invoice);
        setActionMsg(`Error: ${data.error}`);
      }
    } catch {
      setActionMsg("Network error — try again.");
    }
    setSending(false);
  };

  const handleMarkPaid = async () => {
    if (!selected) return;
    setMarkingPaid(true);
    await supabase.from("invoices").update({
      status: "paid",
      payment_method: payMethod,
      paid_at: new Date().toISOString(),
    }).eq("id", selected.id);
    await fetchInvoices();
    const { data: updated } = await supabase.from("invoices").select("*").eq("id", selected.id).single();
    if (updated) setSelected(updated as Invoice);
    setMarkingPaid(false);
    setActionMsg(`Marked as paid via ${payMethod}.`);
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm(`Delete invoice ${selected.invoice_number}? This cannot be undone.`)) return;
    await supabase.from("invoices").delete().eq("id", selected.id);
    await fetchInvoices();
    setSelected(null);
    setView("list");
  };

  const inputCls = "w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 text-sm";
  const labelCls = "block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2";
  const feeInput = "w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-8 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 text-sm";

  // ─── LIST VIEW ───────────────────────────────────────────────
  if (view === "list") return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black">Invoices</h2>
          <p className="text-zinc-500 text-sm mt-1">Special orders & outside billing</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setActionMsg(""); setView("create"); }}
          className="bg-teal-500 hover:bg-teal-400 text-black font-black px-6 py-3 rounded-full text-sm transition-colors"
        >
          + New Invoice
        </button>
      </div>

      {loading ? <p className="text-zinc-500 text-sm">Loading...</p> : invoices.length === 0 ? (
        <div className="text-center py-20 text-zinc-600">
          <p className="text-5xl mb-4">🧾</p>
          <p className="font-bold text-lg">No invoices yet</p>
          <p className="text-sm mt-1">Create your first invoice to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total Invoiced", val: fmt(invoices.reduce((s,i) => s + i.total, 0)), color: "text-white" },
              { label: "Paid", val: fmt(invoices.filter(i => i.status === "paid").reduce((s,i) => s + i.total, 0)), color: "text-teal-400" },
              { label: "Outstanding", val: fmt(invoices.filter(i => i.status !== "paid").reduce((s,i) => s + i.total, 0)), color: "text-yellow-400" },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          {invoices.map(inv => {
            const repInfo = REPS.find(r => r.value === inv.sales_rep);
            return (
              <div
                key={inv.id}
                onClick={() => { setSelected(inv); setActionMsg(""); setView("detail"); }}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl px-5 py-4 cursor-pointer transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-zinc-500 font-mono text-sm shrink-0">{inv.invoice_number}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{inv.customer_name}</p>
                    {inv.customer_company && <p className="text-zinc-500 text-xs truncate">{inv.customer_company}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {repInfo && repInfo.value !== "house" && (
                    <span className="text-xs text-purple-400 font-bold">{repInfo.label.split(" ")[0]} · {repInfo.rate}%</span>
                  )}
                  <span className="text-zinc-400 text-xs">{inv.delivery_type === "delivery" ? "🚗 Delivery" : "🏪 Pickup"}</span>
                  <span className="text-white font-black">{fmt(inv.total)}</span>
                  <span className={`text-xs font-black px-3 py-1 rounded-full ${STATUS_STYLE[inv.status] || STATUS_STYLE.draft}`}>
                    {inv.status.toUpperCase()}
                  </span>
                  <span className="text-zinc-600 text-xs">{new Date(inv.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ─── CREATE VIEW ─────────────────────────────────────────────
  if (view === "create") return (
    <div className="max-w-2xl">
      <button onClick={() => setView("list")} className="text-zinc-500 hover:text-white text-sm mb-6 flex items-center gap-2 transition-colors">
        ← Back to Invoices
      </button>
      <h2 className="text-2xl font-black mb-8">New Invoice</h2>

      {/* Customer */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-5">Customer</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className={labelCls}>Name *</label><input className={inputCls} placeholder="Jane Smith" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} /></div>
          <div><label className={labelCls}>Company</label><input className={inputCls} placeholder="Acme Corp" value={form.customer_company} onChange={e => setForm(f => ({ ...f, customer_company: e.target.value }))} /></div>
          <div><label className={labelCls}>Email *</label><input className={inputCls} type="email" placeholder="jane@acme.com" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} /></div>
          <div><label className={labelCls}>Phone</label><input className={inputCls} placeholder="(214) 555-0100" value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} /></div>
          <div><label className={labelCls}>Due Date</label><input className={inputCls} type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
        </div>
      </div>

      {/* Delivery / Pickup */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-5">Fulfillment</p>
        <div className="flex gap-3 mb-4">
          {["pickup", "delivery"].map(type => (
            <button
              key={type}
              onClick={() => setForm(f => ({ ...f, delivery_type: type }))}
              className={`flex-1 py-3 rounded-full font-black text-sm border transition-colors ${form.delivery_type === type ? "bg-yellow-400 border-yellow-400 text-black" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"}`}
            >
              {type === "pickup" ? "🏪 Pickup" : "🚗 Delivery"}
            </button>
          ))}
        </div>
        {form.delivery_type === "delivery" && (
          <div>
            <label className={labelCls}>Delivery Address</label>
            <input className={inputCls} placeholder="1234 Main St, Dallas, TX 75201" value={form.delivery_address} onChange={e => setForm(f => ({ ...f, delivery_address: e.target.value }))} />
          </div>
        )}
      </div>

      {/* Tax Exempt Toggle */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4 flex items-center justify-between">
        <div>
          <p className="text-white font-black text-sm">Tax Exempt</p>
          <p className="text-zinc-500 text-xs mt-0.5">Toggle on for non-profit, resale, or exempt clients</p>
        </div>
        <button
          onClick={() => setForm(f => ({ ...f, tax_exempt: !f.tax_exempt }))}
          className={`relative w-12 h-6 rounded-full transition-colors ${form.tax_exempt ? "bg-teal-500" : "bg-zinc-700"}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.tax_exempt ? "translate-x-7" : "translate-x-1"}`} />
        </button>
      </div>

      {/* Sales Rep */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-5">Sales Rep</p>
        <div className="flex gap-3 flex-wrap">
          {REPS.map(r => (
            <button
              key={r.value}
              onClick={() => setForm(f => ({ ...f, sales_rep: r.value }))}
              className={`px-5 py-3 rounded-full font-black text-sm border transition-colors ${form.sales_rep === r.value ? "bg-purple-500 border-purple-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"}`}
            >
              {r.label} {r.rate > 0 ? `· ${r.rate}%` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">Line Items</p>
        <p className="text-zinc-600 text-xs mb-5">Taxable items — 8.25% sales tax applied to these.</p>
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-12 gap-2 text-xs font-bold text-zinc-600 uppercase tracking-widest px-1">
            <span className="col-span-6">Description</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-3 text-right">Rate</span>
            <span className="col-span-1"></span>
          </div>
          {form.line_items.map(item => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
              <input className={`${inputCls} col-span-6`} placeholder="Catering service — 50 guests" value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} />
              <input className={`${inputCls} col-span-2 text-center`} type="number" min={1} value={item.qty} onChange={e => updateItem(item.id, "qty", Number(e.target.value))} />
              <div className="col-span-3 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                <input className={`${inputCls} pl-7`} type="number" min={0} step={0.01} placeholder="0.00" value={item.rate || ""} onChange={e => updateItem(item.id, "rate", Number(e.target.value))} />
              </div>
              <button onClick={() => setForm(f => ({ ...f, line_items: f.line_items.filter(i => i.id !== item.id) }))} className="col-span-1 text-zinc-600 hover:text-red-400 text-lg text-center transition-colors">×</button>
            </div>
          ))}
        </div>
        <button onClick={() => setForm(f => ({ ...f, line_items: [...f.line_items, newItem()] }))} className="text-teal-400 hover:text-teal-300 text-sm font-bold transition-colors">
          + Add Line Item
        </button>
      </div>

      {/* Fees & Gratuity */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">Fees & Gratuity</p>
        <p className="text-zinc-600 text-xs mb-5">Non-taxable — added after tax is calculated. Gratuity is set by the client on the invoice page.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Delivery Fee</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
              <input className={feeInput} type="number" min={0} step={0.01} placeholder="0.00" value={form.delivery_fee || ""} onChange={e => setForm(f => ({ ...f, delivery_fee: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Service Fee</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
              <input className={feeInput} type="number" min={0} step={0.01} placeholder="0.00" value={form.service_fee || ""} onChange={e => setForm(f => ({ ...f, service_fee: Number(e.target.value) }))} />
            </div>
          </div>

        </div>
      </div>

      {/* Notes */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-5">Notes</p>
        <textarea className={`${inputCls} resize-y`} rows={3} placeholder="Payment terms, special instructions, etc." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>

      {/* Totals */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-zinc-400"><span>Subtotal (taxable)</span><span>{fmt(subtotal)}</span></div>
          {taxExempt
            ? <div className="flex justify-between"><span className="text-teal-400 text-xs font-black uppercase tracking-widest">Tax Exempt</span><span className="text-teal-400 font-bold">$0.00</span></div>
            : <div className="flex justify-between text-zinc-400"><span>Sales Tax (8.25%)</span><span>{fmt(tax)}</span></div>}
          {deliveryFee > 0 && <div className="flex justify-between text-zinc-400"><span>Delivery Fee <span className="text-zinc-600 text-xs">(non-taxable)</span></span><span>{fmt(deliveryFee)}</span></div>}
          {serviceFee > 0 && <div className="flex justify-between text-zinc-400"><span>Service Fee <span className="text-zinc-600 text-xs">(non-taxable)</span></span><span>{fmt(serviceFee)}</span></div>}
          {rep.rate > 0 && (
            <div className="flex justify-between text-purple-400"><span>{rep.label} commission ({rep.rate}%) <span className="text-zinc-600 text-xs">(internal)</span></span><span>{fmt(commission)}</span></div>
          )}
        </div>
        <div className="border-t border-zinc-700 pt-3 mt-3 flex justify-between items-center">
          <span className="text-white font-black text-lg">Total</span>
          <span className="text-white font-black text-2xl">{fmt(grandTotal)}</span>
        </div>
      </div>

      {actionMsg && <p className="text-teal-400 text-sm mb-4 font-bold">{actionMsg}</p>}

      <div className="flex gap-3">
        <button onClick={() => handleSave(false)} disabled={saving || !form.customer_name || !form.customer_email} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-black py-4 rounded-full transition-colors disabled:opacity-40">
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button onClick={() => handleSave(true)} disabled={saving || !form.customer_name || !form.customer_email} className="flex-1 bg-teal-500 hover:bg-teal-400 text-black font-black py-4 rounded-full transition-colors disabled:opacity-40">
          {saving ? "Saving..." : "Save & Send Invoice"}
        </button>
      </div>
    </div>
  );

  // ─── DETAIL VIEW ─────────────────────────────────────────────
  if (view === "detail" && selected) {
    const repInfo = REPS.find(r => r.value === selected.sales_rep);
    const selSubtotal = (selected.line_items as LineItem[]).reduce((s, i) => s + Number(i.qty) * Number(i.rate), 0);
    const isTaxExempt = !!selected.tax_exempt;
    const storedTax = Number(selected.tax_amount) || 0;
    const selTax = isTaxExempt ? 0 : (storedTax > 0 ? storedTax : selSubtotal * TAX_RATE);
    const selDelivery = Number(selected.delivery_fee) || 0;
    const selService = Number(selected.service_fee) || 0;
  
    return (
      <div className="max-w-2xl">
        <button onClick={() => { setSelected(null); setView("list"); }} className="text-zinc-500 hover:text-white text-sm mb-6 flex items-center gap-2 transition-colors">
          ← Back to Invoices
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-zinc-500 text-sm font-mono">{selected.invoice_number}</p>
            <h2 className="text-2xl font-black">{selected.customer_name}</h2>
            {selected.customer_company && <p className="text-zinc-400 text-sm">{selected.customer_company}</p>}
          </div>
          <span className={`text-sm font-black px-4 py-2 rounded-full ${STATUS_STYLE[selected.status] || STATUS_STYLE.draft}`}>
            {selected.status.toUpperCase()}
          </span>
        </div>

        {/* Customer details */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4 grid grid-cols-2 gap-3 text-sm">
          {selected.customer_email && <div><p className="text-zinc-500 text-xs mb-1">Email</p><p className="text-white">{selected.customer_email}</p></div>}
          {selected.customer_phone && <div><p className="text-zinc-500 text-xs mb-1">Phone</p><p className="text-white">{selected.customer_phone}</p></div>}
          <div><p className="text-zinc-500 text-xs mb-1">Fulfillment</p><p className="text-white">{selected.delivery_type === "delivery" ? "🚗 Delivery" : "🏪 Pickup"}</p></div>
          {selected.due_date && <div><p className="text-zinc-500 text-xs mb-1">Due Date</p><p className="text-white">{new Date(selected.due_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p></div>}
          {selected.delivery_type === "delivery" && selected.delivery_address && (
            <div className="col-span-2"><p className="text-zinc-500 text-xs mb-1">Delivery Address</p><p className="text-white">{selected.delivery_address}</p></div>
          )}
          {selected.paid_at && <div className="col-span-2"><p className="text-zinc-500 text-xs mb-1">Paid</p><p className="text-teal-400 font-bold">{new Date(selected.paid_at).toLocaleDateString("en-US", { month: "long", day: "numeric" })} · {selected.payment_method}</p></div>}
        </div>

        {/* Sales rep (internal only) */}
        {repInfo && repInfo.value !== "house" && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 mb-4 flex justify-between items-center">
            <div>
              <p className="text-purple-400 font-black text-sm">{repInfo.label}</p>
              <p className="text-zinc-500 text-xs">{repInfo.rate}% commission · internal</p>
            </div>
            <p className="text-purple-400 font-black text-lg">{fmt(selected.commission_amount)}</p>
          </div>
        )}

        {/* Line items */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Line Items</p>
          <div className="space-y-3">
            {(selected.line_items as LineItem[]).map((item, i) => (
              <div key={i} className="flex justify-between items-start gap-4 text-sm border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-white font-bold">{item.description}</p>
                  {item.qty > 1 && <p className="text-zinc-500 text-xs">{item.qty} × {fmt(item.rate)}</p>}
                </div>
                <p className="text-white font-black shrink-0">{fmt(item.qty * item.rate)}</p>
              </div>
            ))}
          </div>

          {/* Totals breakdown */}
          <div className="border-t border-zinc-700 mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>{fmt(selSubtotal)}</span></div>
            {isTaxExempt
              ? <div className="flex justify-between"><span className="text-teal-400 text-xs font-black uppercase tracking-widest">Tax Exempt</span><span className="text-teal-400 font-bold">$0.00</span></div>
              : <div className="flex justify-between text-zinc-400"><span>Sales Tax (8.25%)</span><span>{fmt(selTax)}</span></div>}
            {selDelivery > 0 && <div className="flex justify-between text-zinc-400"><span>Delivery Fee <span className="text-zinc-600 text-xs">(non-taxable)</span></span><span>{fmt(selDelivery)}</span></div>}
            {selService > 0 && <div className="flex justify-between text-zinc-400"><span>Service Fee <span className="text-zinc-600 text-xs">(non-taxable)</span></span><span>{fmt(selService)}</span></div>}
            <div className="flex justify-between text-white font-black border-t border-zinc-700 pt-2 mt-2">
              <span>Total</span>
              <span className="text-xl">{fmt(selected.total)}</span>
            </div>
          </div>
        </div>

        {selected.notes && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Notes</p>
            <p className="text-zinc-300 text-sm">{selected.notes}</p>
          </div>
        )}

        {/* Invoice page link — shareable, printable */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white font-bold text-sm">📄 Invoice Page</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://hungry-rooster.vercel.app";
                  navigator.clipboard.writeText(`${base}/invoice/${selected.id}`);
                  setActionMsg("Invoice link copied!");
                }}
                className="text-xs font-black bg-zinc-700 hover:bg-zinc-600 text-zinc-300 px-3 py-1 rounded-full transition-colors"
              >
                Copy Link
              </button>
              <a
                href={`/invoice/${selected.id}`}
                target="_blank"
                className="text-xs font-black bg-yellow-400 hover:bg-yellow-300 text-black px-3 py-1 rounded-full transition-colors"
              >
                Open →
              </a>
            </div>
          </div>
          <p className="text-zinc-500 text-xs">Send to client — they can view, print, and pay from this page.</p>
        </div>

        {selected.stripe_checkout_url && selected.status !== "paid" && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-400 font-bold text-sm">💳 Stripe Payment Link</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selected.stripe_checkout_url);
                  setActionMsg("Payment link copied!");
                }}
                className="text-xs font-black bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 px-3 py-1 rounded-full transition-colors"
              >
                Copy Link
              </button>
            </div>
            <p className="text-zinc-600 text-xs">Direct Stripe checkout — skips the invoice view.</p>
          </div>
        )}

        {actionMsg && <p className="text-teal-400 text-sm mb-4 font-bold">{actionMsg}</p>}

        {/* Actions */}
        {selected.status !== "paid" && (
          <div className="space-y-3">
            <button onClick={() => handleSend()} disabled={sending} className="w-full bg-teal-500 hover:bg-teal-400 text-black font-black py-4 rounded-full transition-colors disabled:opacity-40">
              {sending ? "Sending..." : selected.status === "sent" ? "Resend Invoice Email" : "Send Invoice via Email"}
            </button>
            <div className="flex gap-3">
              <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-3 text-white text-sm focus:outline-none focus:border-teal-500">
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="zelle">Zelle</option>
                <option value="venmo">Venmo</option>
                <option value="stripe">Stripe (manual)</option>
              </select>
              <button onClick={handleMarkPaid} disabled={markingPaid} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-black py-4 rounded-full transition-colors disabled:opacity-40">
                {markingPaid ? "Saving..." : "Mark as Paid"}
              </button>
            </div>
          </div>
        )}

        {selected.status === "paid" && (
          <div className="bg-teal-500/10 border border-teal-500/30 rounded-2xl p-5 text-center">
            <p className="text-teal-400 font-black text-lg">✓ Paid</p>
            <p className="text-zinc-500 text-sm mt-1">via {selected.payment_method} · {selected.paid_at ? new Date(selected.paid_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""}</p>
          </div>
        )}

        {/* Delete — unpaid invoices only */}
        {selected.status !== "paid" && (
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <button
              onClick={handleDelete}
              className="w-full text-red-500 hover:text-red-400 border border-red-500/30 hover:border-red-400/50 font-black py-3 rounded-full text-sm transition-colors"
            >
              Delete Invoice
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
