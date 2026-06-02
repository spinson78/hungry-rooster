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
  { value: "abigayle", label: "Abigayle Pinson", rate: 5 },
  { value: "jordona", label: "Jordona Kohn", rate: 10 },
];

const STATUS_STYLE: Record<string, string> = {
  draft:   "text-zinc-400 bg-zinc-800 border border-zinc-700",
  sent:    "text-blue-400 bg-blue-500/10 border border-blue-500/30",
  paid:    "text-teal-400 bg-teal-500/10 border border-teal-500/30",
  overdue: "text-red-400 bg-red-500/10 border border-red-500/30",
};

const fmt = (n: number) => `$${n.toFixed(2)}`;
const newItem = (): LineItem => ({ id: Math.random().toString(36).slice(2), description: "", qty: 1, rate: 0 });

const emptyForm = {
  customer_name: "", customer_email: "", customer_phone: "", customer_company: "",
  line_items: [newItem()],
  notes: "", due_date: "", sales_rep: "house",
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

  // Auto-calculate totals
  const lineTotal = (item: LineItem) => item.qty * item.rate;
  const subtotal = form.line_items.reduce((s, i) => s + lineTotal(i), 0);
  const rep = REPS.find(r => r.value === form.sales_rep) || REPS[0];
  const commission = subtotal * (rep.rate / 100);

  const updateItem = (id: string, field: keyof LineItem, val: string | number) => {
    setForm(f => ({ ...f, line_items: f.line_items.map(i => i.id === id ? { ...i, [field]: val } : i) }));
  };

  const nextInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const count = invoices.filter(i => i.invoice_number.includes(String(year))).length + 1;
    return `THR-${year}-${String(count).padStart(3, "0")}`;
  };

  const handleSave = async (sendAfter = false) => {
    setSaving(true);
    setActionMsg("");
    const invoice_number = nextInvoiceNumber();
    const total = subtotal;
    const commission_amount = commission;
    const commission_rate = rep.rate;

    const payload = {
      invoice_number,
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      customer_phone: form.customer_phone,
      customer_company: form.customer_company,
      line_items: form.line_items,
      notes: form.notes,
      due_date: form.due_date || null,
      total,
      sales_rep: form.sales_rep,
      commission_rate,
      commission_amount,
      status: "draft",
    };

    const { data, error } = await supabase.from("invoices").insert(payload).select().single();
    setSaving(false);
    if (error) { setActionMsg("Error saving invoice."); return; }

    await fetchInvoices();
    setSelected(data as Invoice);

    if (sendAfter) {
      setView("detail");
      await handleSend(data as Invoice);
    } else {
      setView("detail");
      setActionMsg("Invoice saved as draft.");
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
        // Even on error, refresh in case Stripe link was saved
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

  const inputCls = "w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 text-sm";
  const labelCls = "block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2";

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
          {/* Summary bar */}
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

          {/* Invoice rows */}
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
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-5">Line Items</p>
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

      {/* Notes */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-5">Notes</p>
        <textarea className={`${inputCls} resize-y`} rows={3} placeholder="Payment terms, special instructions, etc." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>

      {/* Totals */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-zinc-400 text-sm">Subtotal</span>
          <span className="text-white font-bold">{fmt(subtotal)}</span>
        </div>
        {rep.rate > 0 && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-purple-400 text-sm">{rep.label} commission ({rep.rate}%)</span>
            <span className="text-purple-400 font-bold">{fmt(commission)}</span>
          </div>
        )}
        <div className="border-t border-zinc-700 pt-3 mt-3 flex justify-between items-center">
          <span className="text-white font-black text-lg">Total</span>
          <span className="text-white font-black text-2xl">{fmt(subtotal)}</span>
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
          {selected.due_date && <div><p className="text-zinc-500 text-xs mb-1">Due Date</p><p className="text-white">{new Date(selected.due_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p></div>}
          {selected.paid_at && <div><p className="text-zinc-500 text-xs mb-1">Paid</p><p className="text-teal-400 font-bold">{new Date(selected.paid_at).toLocaleDateString("en-US", { month: "long", day: "numeric" })} · {selected.payment_method}</p></div>}
        </div>

        {/* Sales rep */}
        {repInfo && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 mb-4 flex justify-between items-center">
            <div>
              <p className="text-purple-400 font-black text-sm">{repInfo.label}</p>
              <p className="text-zinc-500 text-xs">{repInfo.rate}% commission</p>
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
          <div className="border-t border-zinc-700 mt-4 pt-4 flex justify-between">
            <span className="text-white font-black">Total</span>
            <span className="text-white font-black text-xl">{fmt(selected.total)}</span>
          </div>
        </div>

        {selected.notes && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Notes</p>
            <p className="text-zinc-300 text-sm">{selected.notes}</p>
          </div>
        )}

        {selected.stripe_checkout_url && selected.status !== "paid" && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-400 font-bold text-sm">Payment Link Active</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selected.stripe_checkout_url);
                  setActionMsg("Link copied to clipboard!");
                }}
                className="text-xs font-black bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 px-3 py-1 rounded-full transition-colors"
              >
                Copy Link
              </button>
            </div>
            <a href={selected.stripe_checkout_url} target="_blank" className="text-zinc-400 text-xs underline break-all hover:text-white transition-colors">{selected.stripe_checkout_url}</a>
            <p className="text-zinc-600 text-xs mt-2">Send this link via text, email, or any messaging app — client pays directly through Stripe.</p>
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
      </div>
    );
  }

  return null;
}
