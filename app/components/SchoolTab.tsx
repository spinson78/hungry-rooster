"use client";
import { useState, useEffect, useCallback } from "react";

type Account = {
  id: string;
  student_name: string;
  grade_class: string;
  school_name: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  billing_preference: string;
  balance: number;
  status: string;
  freeze_reason: string | null;
  student_pin: string;
  created_at: string;
};

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  emoji: string;
  available: boolean;
  sort_order: number;
};

type Transaction = {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
};

type FBPurchase = {
  id: string;
  teacher_name: string;
  teacher_email: string;
  school_name: string;
  amount_paid: number;
  coupons_total: number;
  coupons_redeemed: number;
  ref_code: string;
  created_at: string;
};

const STATUS_COLOR: Record<string, string> = {
  active: "text-green-400",
  frozen: "text-red-400",
  pending_setup: "text-yellow-400",
};

const TYPE_LABEL: Record<string, string> = {
  purchase: "Purchase",
  payment: "Payment",
  adjustment: "Adjustment",
  billing_charge: "Weekly Charge",
  billing_invoice: "Invoice Sent",
  cash_sale: "Cash Sale",
  card_sale: "Card Sale",
};

export default function SchoolTab() {
  const [view, setView] = useState<"accounts" | "menu" | "billing" | "sales" | "fredbucks" | "lunch">("accounts");
  const [lunchOrders, setLunchOrders] = useState<{
    id: string; student_name: string; grade: string; item_name: string;
    make_it_meal: boolean; drink: string | null; amount_total: number;
    status: string; week_of: string; created_at: string;
  }[]>([]);
  const [lunchLoading, setLunchLoading] = useState(false);
  const [lunchClearing, setLunchClearing] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "frozen" | "pending_setup">("all");

  // Modals
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showFreezeForm, setShowFreezeForm] = useState(false);
  const [showAddMenuItem, setShowAddMenuItem] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState({
    student_name: "", student_pin: "", grade_class: "", school_name: "",
    parent_name: "", parent_email: "", parent_phone: "",
    billing_preference: "invoice",
  });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  // Adjust form
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // Freeze form
  const [freezeReason, setFreezeReason] = useState("");
  const [freezing, setFreezing] = useState(false);

  // Menu item form
  const [menuForm, setMenuForm] = useState({ name: "", price: "", category: "", emoji: "☕", sort_order: "0" });
  const [savingMenu, setSavingMenu] = useState(false);

  // Fred's Bucks
  const [fbPurchases, setFbPurchases] = useState<FBPurchase[]>([]);
  const [fbLoading, setFbLoading] = useState(false);

  const fetchFB = useCallback(async () => {
    setFbLoading(true);
    const res = await fetch("/api/coop/fredbucks/list");
    const data = await res.json();
    setFbPurchases(data.purchases || []);
    setFbLoading(false);
  }, []);

  useEffect(() => {
    if (view === "fredbucks") fetchFB();
    if (view === "lunch") {
      setLunchLoading(true);
      fetch("/api/akiba-lunch/orders")
        .then(r => r.json())
        .then(d => { setLunchOrders(d.orders || []); setLunchLoading(false); })
        .catch(() => setLunchLoading(false));
    }
  }, [view, fetchFB]);

  // Billing
  // Sales log
  type SaleTxn = { id: string; type: string; amount: number; description: string; account_id: string | null; created_at: string };
  const [sales, setSales] = useState<SaleTxn[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesRange, setSalesRange] = useState<"week" | "month" | "ytd" | "all">("month");

  const fetchSales = useCallback(async (rangeVal: "week" | "month" | "ytd" | "all") => {
    setSalesLoading(true);
    const now = new Date();
    let from = "";
    if (rangeVal === "week") {
      const s = new Date(now); s.setDate(s.getDate() - s.getDay()); s.setHours(0,0,0,0); from = s.toISOString();
    } else if (rangeVal === "month") {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else if (rangeVal === "ytd") {
      from = new Date(now.getFullYear(), 0, 1).toISOString();
    }
    const params = new URLSearchParams({ type: "sales" });
    if (from) params.set("from", from);
    const res = await fetch(`/api/school/admin?${params}`);
    const data = await res.json();
    setSales(data.sales || []);
    setSalesLoading(false);
  }, []);

  useEffect(() => {
    if (view === "sales") fetchSales(salesRange);
  }, [view, salesRange, fetchSales]);

  const [billingLoading, setBillingLoading] = useState(false);
  const [billingResult, setBillingResult] = useState<{ charged?: number; invoiced?: number; failed?: number; failures?: string[] } | null>(null);

  // Remind
  const [reminding, setReminding] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/school/admin?type=all");
    const data = await res.json();
    setAccounts(data.accounts || []);
    setLoading(false);
  }, []);

  const fetchMenu = useCallback(async () => {
    const res = await fetch("/api/school/menu");
    const data = await res.json();
    setMenuItems(data.items || []);
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchMenu();
  }, [fetchAccounts, fetchMenu]);

  const openAccount = async (acct: Account) => {
    setSelectedAccount(acct);
    setTxLoading(true);
    const res = await fetch(`/api/school/admin?type=single&id=${acct.id}`);
    const data = await res.json();
    setTransactions(data.transactions || []);
    setTxLoading(false);
  };

  const doFreeze = async (action: "freeze" | "unfreeze") => {
    if (!selectedAccount) return;
    setFreezing(true);
    await fetch("/api/school/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, account_id: selectedAccount.id, reason: freezeReason }),
    });
    setFreezing(false);
    setShowFreezeForm(false);
    setFreezeReason("");
    await fetchAccounts();
    const updated = accounts.find(a => a.id === selectedAccount.id);
    if (updated) setSelectedAccount({ ...updated, status: action === "freeze" ? "frozen" : "active", freeze_reason: action === "freeze" ? freezeReason : null });
    else setSelectedAccount(null);
  };

  const doAdjust = async () => {
    if (!selectedAccount || !adjustAmount) return;
    setAdjusting(true);
    await fetch("/api/school/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "adjust", account_id: selectedAccount.id, amount: parseFloat(adjustAmount), note: adjustNote }),
    });
    setAdjusting(false);
    setShowAdjust(false);
    setAdjustAmount("");
    setAdjustNote("");
    await fetchAccounts();
    await openAccount(selectedAccount);
  };

  const doCreate = async () => {
    setCreating(true);
    setCreateMsg("");
    const res = await fetch("/api/school/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...createForm, _admin: true }),
    });
    const data = await res.json();
    if (data.success || data.url) {
      setCreateMsg(data.url ? `✅ Created! Card setup link: ${data.url}` : "✅ Account created — welcome email sent.");
      setShowCreateForm(false);
      setCreateForm({ student_name: "", student_pin: "", grade_class: "", school_name: "", parent_name: "", parent_email: "", parent_phone: "", billing_preference: "invoice" });
      fetchAccounts();
    } else {
      setCreateMsg("❌ " + (data.error || "Failed"));
    }
    setCreating(false);
  };

  const doRemind = async (acctId: string) => {
    setReminding(acctId);
    await fetch("/api/school/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remind", account_id: acctId }),
    });
    setReminding(null);
  };

  const runBilling = async () => {
    setBillingLoading(true);
    setBillingResult(null);
    const res = await fetch("/api/school/billing");
    const data = await res.json();
    setBillingResult(data);
    setBillingLoading(false);
    fetchAccounts();
  };

  const [unfreezeAllLoading, setUnfreezeAllLoading] = useState(false);
  const unfreezeAll = async () => {
    setUnfreezeAllLoading(true);
    const frozen = accounts.filter(a => a.status === "frozen");
    await Promise.all(frozen.map(a =>
      fetch("/api/school/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unfreeze", account_id: a.id }),
      })
    ));
    await fetchAccounts();
    setUnfreezeAllLoading(false);
  };

  const toggleMenuItem = async (item: MenuItem) => {
    await fetch("/api/school/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, available: !item.available }),
    });
    fetchMenu();
  };

  const deleteMenuItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/school/menu?id=${id}`, { method: "DELETE" });
    fetchMenu();
  };

  const addMenuItem = async () => {
    setSavingMenu(true);
    await fetch("/api/school/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...menuForm, price: parseFloat(menuForm.price), sort_order: parseInt(menuForm.sort_order) }),
    });
    setSavingMenu(false);
    setShowAddMenuItem(false);
    setMenuForm({ name: "", price: "", category: "", emoji: "☕", sort_order: "0" });
    fetchMenu();
  };

  const filtered = accounts.filter(a => statusFilter === "all" || a.status === statusFilter);
  const totalBalance = accounts.filter(a => a.status === "active").reduce((s, a) => s + Number(a.balance), 0);

  // ── ACCOUNT DETAIL VIEW ──────────────────────────────────────────────────
  if (selectedAccount) {
    return (
      <div>
        <button onClick={() => setSelectedAccount(null)} className="text-zinc-400 text-sm mb-6 hover:text-white">← Back to accounts</button>

        <div className="flex flex-wrap items-start gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black">{selectedAccount.student_name}</h2>
            <p className="text-zinc-500 text-sm">{selectedAccount.school_name}{selectedAccount.grade_class ? ` · ${selectedAccount.grade_class}` : ""}</p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            {selectedAccount.status === "frozen" ? (
              <button onClick={() => doFreeze("unfreeze")} className="bg-green-500 text-black font-black px-4 py-2 rounded-full text-sm">✓ Unfreeze</button>
            ) : (
              <button onClick={() => setShowFreezeForm(true)} className="bg-red-500/20 text-red-400 border border-red-500/30 font-black px-4 py-2 rounded-full text-sm">⛔ Freeze</button>
            )}
            <button onClick={() => setShowAdjust(true)} className="bg-zinc-800 text-white font-black px-4 py-2 rounded-full text-sm border border-zinc-700">± Adjust Balance</button>
            <button onClick={() => doRemind(selectedAccount.id)} disabled={reminding === selectedAccount.id}
              className="bg-zinc-800 text-yellow-400 font-black px-4 py-2 rounded-full text-sm border border-zinc-700 disabled:opacity-50">
              {reminding === selectedAccount.id ? "Sending…" : "📧 Remind"}
            </button>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Balance", value: `$${Number(selectedAccount.balance).toFixed(2)}`, color: "text-yellow-400" },
            { label: "Status", value: selectedAccount.status, color: STATUS_COLOR[selectedAccount.status] || "text-white" },
            { label: "Account ID", value: selectedAccount.student_pin, color: "text-teal-400" },
            { label: "Billing", value: selectedAccount.billing_preference === "auto_charge" ? "Auto-charge" : "Invoice", color: "text-white" },
          ].map(c => (
            <div key={c.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">{c.label}</p>
              <p className={`font-black ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {selectedAccount.status === "frozen" && selectedAccount.freeze_reason && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-sm text-red-300">
            Freeze reason: {selectedAccount.freeze_reason}
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 text-sm text-zinc-400">
          Parent: <strong className="text-white">{selectedAccount.parent_name}</strong> · {selectedAccount.parent_email}{selectedAccount.parent_phone ? ` · ${selectedAccount.parent_phone}` : ""}
        </div>

        {/* Adjust modal */}
        {showAdjust && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 mb-6">
            <h3 className="font-black mb-3">Manual Balance Adjustment</h3>
            <p className="text-zinc-500 text-sm mb-4">Positive = add credit. Negative = add charge.</p>
            <div className="flex gap-3 mb-3">
              <input type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="e.g. 5.00 or -3.50"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
              <input type="text" value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="Reason / note"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
            </div>
            <div className="flex gap-2">
              <button onClick={doAdjust} disabled={adjusting || !adjustAmount} className="bg-yellow-400 text-black font-black px-5 py-2 rounded-full text-sm disabled:opacity-50">
                {adjusting ? "Saving…" : "Apply"}
              </button>
              <button onClick={() => setShowAdjust(false)} className="text-zinc-400 text-sm px-4 py-2">Cancel</button>
            </div>
          </div>
        )}

        {/* Freeze reason modal */}
        {showFreezeForm && (
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-5 mb-6">
            <h3 className="font-black text-red-400 mb-3">Freeze Account</h3>
            <input type="text" value={freezeReason} onChange={e => setFreezeReason(e.target.value)} placeholder="Reason for freezing (shown to parent)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 mb-3 focus:outline-none focus:border-red-500" />
            <div className="flex gap-2">
              <button onClick={() => doFreeze("freeze")} disabled={freezing} className="bg-red-500 text-white font-black px-5 py-2 rounded-full text-sm disabled:opacity-50">
                {freezing ? "Freezing…" : "Freeze Account"}
              </button>
              <button onClick={() => setShowFreezeForm(false)} className="text-zinc-400 text-sm px-4 py-2">Cancel</button>
            </div>
          </div>
        )}

        {/* Transactions */}
        <h3 className="font-black text-sm uppercase tracking-widest text-zinc-500 mb-3">Transactions</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {txLoading ? (
            <p className="text-center text-zinc-600 py-8 text-sm animate-pulse">Loading…</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-zinc-600 py-8 text-sm">No transactions yet</p>
          ) : transactions.map(t => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 last:border-0">
              <div>
                <p className="font-bold text-sm">{TYPE_LABEL[t.type] || t.type}</p>
                <p className="text-zinc-500 text-xs">{t.description}</p>
                <p className="text-zinc-600 text-xs">{new Date(t.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
              </div>
              <p className={`font-black text-sm ${t.amount < 0 ? "text-green-400" : "text-white"}`}>
                {t.amount < 0 ? "-" : "+"}${Math.abs(t.amount).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── MAIN VIEW ─────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div>
          <h2 className="text-xl font-black">🐓 THE COOP</h2>
          <p className="text-zinc-500 text-xs">by The Hungry Rooster</p>
        </div>
        <div className="flex flex-wrap gap-2 ml-auto">
          {([
            { v: "accounts",  label: "Accounts" },
            { v: "sales",     label: "Sales Log" },
            { v: "fredbucks", label: "🐓 Fred's Bucks" },
            { v: "lunch",     label: "🏫 Akiba Lunch" },
            { v: "menu",      label: "Menu" },
            { v: "billing",   label: "Billing" },
          ] as const).map(({ v, label }) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 rounded-full text-sm font-black transition-colors ${view === v ? "bg-yellow-400 text-black" : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ACCOUNTS VIEW ── */}
      {view === "accounts" && (
        <div>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Accounts", value: accounts.length, color: "text-white" },
              { label: "Active", value: accounts.filter(a => a.status === "active").length, color: "text-green-400" },
              { label: "Frozen", value: accounts.filter(a => a.status === "frozen").length, color: "text-red-400" },
              { label: "Pending Billing", value: `$${totalBalance.toFixed(2)}`, color: "text-yellow-400" },
            ].map(c => (
              <div key={c.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">{c.label}</p>
                <p className={`font-black text-xl ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex gap-2">
              {(["all", "active", "frozen", "pending_setup"] as const).map(f => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-black transition-colors ${statusFilter === f ? "bg-zinc-100 text-black" : "bg-zinc-800 text-zinc-400 border border-zinc-700"}`}>
                  {f === "pending_setup" ? "Pending" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={() => setShowCreateForm(v => !v)}
              className="ml-auto bg-yellow-400 text-black font-black px-4 py-2 rounded-full text-sm hover:bg-yellow-300">
              + New Account
            </button>
          </div>

          {createMsg && (
            <div className={`rounded-xl p-3 mb-4 text-sm font-bold ${createMsg.startsWith("✅") ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>
              {createMsg}
            </div>
          )}

          {/* Create form */}
          {showCreateForm && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 mb-6">
              <h3 className="font-black mb-4">Create Account</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { key: "student_name", label: "Student Name", ph: "Jane Smith" },
                  { key: "student_pin", label: "Account ID (4-6 digits)", ph: "1234" },
                  { key: "grade_class", label: "Grade / Class", ph: "10th Grade" },
                  { key: "school_name", label: "School", ph: "School name" },
                  { key: "parent_name", label: "Parent Name", ph: "John Smith" },
                  { key: "parent_email", label: "Parent Email", ph: "john@email.com" },
                  { key: "parent_phone", label: "Parent Phone", ph: "(214) 555-0100" },
                ].map(f => (
                  <div key={f.key} className={f.key === "parent_email" ? "col-span-2" : ""}>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">{f.label}</label>
                    <input type={f.key === "parent_email" ? "email" : "text"}
                      value={(createForm as Record<string, string>)[f.key]}
                      onChange={e => setCreateForm(x => ({ ...x, [f.key]: f.key === "student_pin" ? e.target.value.replace(/\D/g, "") : e.target.value }))}
                      placeholder={f.ph}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-yellow-400" />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Billing</label>
                  <div className="flex gap-3">
                    {[{ value: "invoice", label: "📧 Invoice" }, { value: "auto_charge", label: "💳 Auto-charge" }].map(opt => (
                      <label key={opt.value} className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer text-sm ${createForm.billing_preference === opt.value ? "border-yellow-400 bg-yellow-400/10 text-yellow-300" : "border-zinc-700 text-zinc-400"}`}>
                        <input type="radio" name="billing_new" value={opt.value} checked={createForm.billing_preference === opt.value}
                          onChange={() => setCreateForm(x => ({ ...x, billing_preference: opt.value }))} className="sr-only" />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={doCreate} disabled={creating || !createForm.student_name || !createForm.student_pin || !createForm.parent_email}
                  className="bg-yellow-400 text-black font-black px-5 py-2 rounded-full text-sm disabled:opacity-50">
                  {creating ? "Creating…" : "Create Account"}
                </button>
                <button onClick={() => setShowCreateForm(false)} className="text-zinc-400 text-sm px-4 py-2">Cancel</button>
              </div>
            </div>
          )}

          {/* Account list */}
          {loading ? (
            <p className="text-zinc-500 text-sm animate-pulse py-8 text-center">Loading accounts…</p>
          ) : filtered.length === 0 ? (
            <p className="text-zinc-600 text-sm py-8 text-center">No accounts found</p>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {filtered.map(acct => (
                <div key={acct.id} onClick={() => openAccount(acct)}
                  className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 last:border-0 hover:bg-zinc-800 cursor-pointer transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{acct.student_name}</p>
                      <span className={`text-xs font-bold ${STATUS_COLOR[acct.status] || "text-white"}`}>
                        {acct.status === "pending_setup" ? "⏳" : acct.status === "frozen" ? "⛔" : ""}
                      </span>
                    </div>
                    <p className="text-zinc-500 text-xs">{acct.parent_name} · ID: {acct.student_pin}{acct.grade_class ? ` · ${acct.grade_class}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-sm ${Number(acct.balance) > 0 ? "text-yellow-400" : "text-zinc-500"}`}>
                      ${Number(acct.balance).toFixed(2)}
                    </p>
                    <p className="text-zinc-600 text-xs">{acct.billing_preference === "auto_charge" ? "💳" : "📧"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SALES LOG VIEW ── */}
      {view === "sales" && (() => {
        const SALE_LABEL: Record<string, string> = { purchase: "Account Tab", card_sale: "Card", cash_sale: "Cash" };
        const SALE_COLOR: Record<string, string> = { purchase: "text-yellow-400", card_sale: "text-teal-400", cash_sale: "text-green-400" };
        const salesTotal = sales.reduce((s, t) => s + Number(t.amount), 0);
        const byType = ["purchase", "card_sale", "cash_sale"].map(type => ({
          type,
          count: sales.filter(t => t.type === type).length,
          total: sales.filter(t => t.type === type).reduce((s, t) => s + Number(t.amount), 0),
        }));
        // Group by week
        const byWeek: Record<string, { label: string; total: number; count: number }> = {};
        sales.forEach(t => {
          const d = new Date(t.created_at);
          const day = d.getDay();
          const sun = new Date(d); sun.setDate(d.getDate() - day); sun.setHours(0,0,0,0);
          const key = sun.toISOString().split("T")[0];
          if (!byWeek[key]) {
            const fri = new Date(sun); fri.setDate(sun.getDate() + 5);
            const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
            byWeek[key] = { label: `${sun.toLocaleDateString("en-US", opts)} – ${fri.toLocaleDateString("en-US", opts)}`, total: 0, count: 0 };
          }
          byWeek[key].total += Number(t.amount);
          byWeek[key].count++;
        });
        return (
          <div>
            {/* Range filter */}
            <div className="flex items-center gap-2 mb-6">
              {([["week","This Week"],["month","This Month"],["ytd","YTD"],["all","All Time"]] as const).map(([v, label]) => (
                <button key={v} onClick={() => setSalesRange(v)}
                  className={`px-4 py-2 rounded-full text-sm font-black transition-colors ${salesRange === v ? "bg-teal-500 text-black" : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white"}`}>
                  {label}
                </button>
              ))}
              <button onClick={() => fetchSales(salesRange)} className="ml-auto text-zinc-500 text-xs hover:text-white">↺ Refresh</button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Transactions</p>
                <p className="font-black text-xl text-white">{sales.length}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Total Sales</p>
                <p className="font-black text-xl text-yellow-400">${salesTotal.toFixed(2)}</p>
              </div>
              {byType.filter(t => t.count > 0).map(t => (
                <div key={t.type} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">{SALE_LABEL[t.type]}</p>
                  <p className={`font-black text-xl ${SALE_COLOR[t.type]}`}>${t.total.toFixed(2)}</p>
                  <p className="text-zinc-600 text-xs">{t.count} sale{t.count !== 1 ? "s" : ""}</p>
                </div>
              ))}
            </div>

            {/* Weekly breakdown */}
            {Object.keys(byWeek).length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Weekly Breakdown</h3>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  {Object.entries(byWeek).sort((a,b) => b[0].localeCompare(a[0])).map(([key, w]) => (
                    <div key={key} className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 last:border-0">
                      <div>
                        <p className="font-bold text-sm">{w.label}</p>
                        <p className="text-zinc-500 text-xs">{w.count} transactions</p>
                      </div>
                      <p className="font-black text-yellow-400">${w.total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction list */}
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">All Transactions</h3>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {salesLoading ? (
                <p className="text-center text-zinc-600 py-8 text-sm animate-pulse">Loading…</p>
              ) : sales.length === 0 ? (
                <p className="text-center text-zinc-600 py-8 text-sm">No sales in this period</p>
              ) : sales.map(t => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 last:border-0">
                  <div>
                    <p className={`font-bold text-sm ${SALE_COLOR[t.type]}`}>{SALE_LABEL[t.type]}</p>
                    <p className="text-zinc-500 text-xs">{t.description}</p>
                    <p className="text-zinc-600 text-xs">{new Date(t.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                  <p className="font-black text-white">${Number(t.amount).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── FRED'S BUCKS VIEW ── */}
      {view === "fredbucks" && (() => {
        const totalRevenue = fbPurchases.reduce((s, p) => s + Number(p.amount_paid), 0);
        const totalIssued = fbPurchases.reduce((s, p) => s + p.coupons_total, 0);
        const totalRedeemed = fbPurchases.reduce((s, p) => s + p.coupons_redeemed, 0);
        const totalRemaining = totalIssued - totalRedeemed;
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-sm uppercase tracking-widest text-zinc-400">Fred&apos;s Bucks</h3>
              <button onClick={fetchFB} className="text-xs text-zinc-500 hover:text-white">↺ Refresh</button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Teachers",      value: fbPurchases.length,            color: "text-white" },
                { label: "Revenue",       value: `$${totalRevenue.toFixed(2)}`, color: "text-yellow-400" },
                { label: "Bucks Issued",  value: totalIssued,                   color: "text-teal-400" },
                { label: "Bucks Remaining", value: totalRemaining,              color: totalRemaining > 0 ? "text-green-400" : "text-zinc-500" },
              ].map(c => (
                <div key={c.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">{c.label}</p>
                  <p className={`font-black text-xl ${c.color}`}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Purchase list */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {fbLoading ? (
                <p className="text-center text-zinc-600 py-8 text-sm animate-pulse">Loading…</p>
              ) : fbPurchases.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-3xl mb-2">🐓</p>
                  <p className="text-zinc-600 text-sm">No Fred&apos;s Bucks purchased yet</p>
                  <p className="text-zinc-700 text-xs mt-1">Share the link: /coop/fredbucks</p>
                </div>
              ) : fbPurchases.map(p => {
                const remaining = p.coupons_total - p.coupons_redeemed;
                const pct = Math.round((p.coupons_redeemed / p.coupons_total) * 100);
                return (
                  <div key={p.id} className="px-5 py-4 border-b border-zinc-800 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-black text-sm">{p.teacher_name}</p>
                        <p className="text-zinc-500 text-xs">{p.teacher_email}{p.school_name ? ` · ${p.school_name}` : ""}</p>
                        <p className="text-zinc-700 text-xs font-mono mt-0.5">{p.ref_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-yellow-400">${Number(p.amount_paid).toFixed(2)}</p>
                        <p className="text-zinc-500 text-xs">{p.coupons_total} bucks · {pct}% used</p>
                        <p className={`text-xs font-black mt-0.5 ${remaining > 0 ? "text-green-400" : "text-zinc-600"}`}>
                          {remaining} remaining
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5">
                      <div className="bg-yellow-400 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-zinc-700 text-xs mt-1.5">{new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── AKIBA LUNCH VIEW ── */}
      {view === "lunch" && (() => {
        const paid = lunchOrders.filter(o => o.status === "paid");
        const revenue = paid.reduce((s, o) => s + Number(o.amount_total), 0);
        const itemCounts: Record<string, number> = {};
        paid.forEach(o => { itemCounts[o.item_name] = (itemCounts[o.item_name] || 0) + 1; });
        const mealCount = paid.filter(o => o.make_it_meal).length;

        const printManifest = () => {
          const rows = paid.map(o =>
            `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:700">${o.student_name}</td>
             <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280">${o.grade}</td>
             <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${o.item_name}${o.make_it_meal ? ` + Meal (${o.drink})` : ""}</td>
             <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700">$${Number(o.amount_total).toFixed(2)}</td></tr>`
          ).join("");
          const summaryRows = Object.entries(itemCounts).map(([name, qty]) =>
            `<tr><td style="padding:8px 12px;font-weight:700">${name}</td><td style="padding:8px 12px;font-weight:900;font-size:20px;color:#f97316">${qty}</td></tr>`
          ).join("");
          const html = `<!DOCTYPE html><html><head><title>Akiba Yavneh Lunch Manifest</title>
            <style>body{font-family:sans-serif;max-width:750px;margin:0 auto;padding:24px;color:#111}h1{font-weight:900;margin:0 0 4px}h2{font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin:20px 0 8px}table{width:100%;border-collapse:collapse}@media print{@page{margin:12mm}}</style>
            </head><body>
            <h1>Akiba Yavneh Lunch — Order Manifest</h1>
            <p style="color:#6b7280;font-size:14px;margin:0 0 20px">${paid.length} orders · $${revenue.toFixed(2)} · ${mealCount} meal add-ons</p>
            <h2>Item Summary</h2><table><tbody>${summaryRows}</tbody></table>
            <h2>Student Orders</h2>
            <table><thead><tr style="background:#f9fafb"><th style="padding:8px 12px;text-align:left">Student</th><th style="padding:8px 12px;text-align:left">Grade</th><th style="padding:8px 12px;text-align:left">Order</th><th style="padding:8px 12px;text-align:right">Total</th></tr></thead><tbody>${rows}</tbody></table>
            <div style="border-top:2px solid #111;margin-top:20px;padding-top:12px;display:flex;justify-content:space-between;font-weight:900;font-size:18px">
              <span>${paid.length} students</span><span>$${revenue.toFixed(2)}</span></div>
            </body></html>`;
          const w = window.open("", "_blank", "width=800,height=900");
          if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
        };

        const archiveAll = async () => {
          if (!window.confirm(`Archive all ${paid.length} completed orders?`)) return;
          setLunchClearing(true);
          await Promise.all(paid.map(o =>
            fetch("/api/akiba-lunch/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: o.id, action: "archive" }),
            })
          ));
          setLunchOrders(prev => prev.filter(o => o.status !== "paid"));
          setLunchClearing(false);
        };

        return (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h3 className="font-black text-lg">🏫 Akiba Yavneh Lunch</h3>
                <p className="text-zinc-500 text-xs mt-0.5">
                  Order link: <span className="text-teal-400 font-mono">thehungryroostertx.com/akiba-lunch</span>
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {paid.length > 0 && (
                  <>
                    <button onClick={printManifest}
                      className="text-xs font-black text-orange-400 border border-orange-400/30 hover:border-orange-400 px-4 py-2 rounded-full transition-colors">
                      🖨️ Print Manifest
                    </button>
                    <button onClick={archiveAll} disabled={lunchClearing}
                      className="text-xs font-black text-red-400 border border-red-400/30 hover:border-red-400 px-4 py-2 rounded-full transition-colors disabled:opacity-40">
                      {lunchClearing ? "Clearing…" : `Archive ${paid.length} orders`}
                    </button>
                  </>
                )}
                <button onClick={() => {
                  setLunchLoading(true);
                  fetch("/api/akiba-lunch/orders").then(r => r.json()).then(d => { setLunchOrders(d.orders || []); setLunchLoading(false); }).catch(() => setLunchLoading(false));
                }} className="text-xs text-zinc-500 hover:text-white font-bold border border-zinc-700 px-4 py-2 rounded-full">
                  ↺ Refresh
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Orders This Week", value: paid.length, color: "text-white" },
                { label: "Revenue",           value: `$${revenue.toFixed(2)}`, color: "text-yellow-400" },
                { label: "Meal Add-ons",      value: mealCount, color: "text-teal-400" },
                { label: "Cutoff",            value: "Thu Noon", color: "text-zinc-400" },
              ].map(c => (
                <div key={c.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">{c.label}</p>
                  <p className={`font-black text-xl ${c.color}`}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Item breakdown */}
            {Object.keys(itemCounts).length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Item Breakdown</p>
                <div className="space-y-2">
                  {Object.entries(itemCounts).map(([name, qty]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-300">{name}</span>
                      <span className="bg-orange-500 text-white font-black text-sm w-8 h-8 rounded-full flex items-center justify-center">{qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders list */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {lunchLoading ? (
                <p className="text-center text-zinc-600 py-8 text-sm animate-pulse">Loading…</p>
              ) : paid.length === 0 ? (
                <p className="text-center text-zinc-600 py-8 text-sm">No orders yet this week</p>
              ) : paid.map(o => (
                <div key={o.id} className="flex items-start justify-between px-4 py-4 border-b border-zinc-800 last:border-0">
                  <div>
                    <p className="font-black text-sm">{o.student_name}</p>
                    <p className="text-zinc-500 text-xs">{o.grade}</p>
                    <p className="text-zinc-400 text-xs mt-1">{o.item_name}</p>
                    {o.make_it_meal && <p className="text-teal-400 text-xs">+ Meal · {o.drink}</p>}
                  </div>
                  <p className="text-yellow-400 font-black">${Number(o.amount_total).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── MENU VIEW ── */}
      {view === "menu" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-sm uppercase tracking-widest text-zinc-400">Menu Items</h3>
            <button onClick={() => setShowAddMenuItem(v => !v)}
              className="bg-yellow-400 text-black font-black px-4 py-2 rounded-full text-sm hover:bg-yellow-300">
              + Add Item
            </button>
          </div>

          {showAddMenuItem && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 mb-6">
              <h3 className="font-black mb-4">New Menu Item</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { key: "name", label: "Item Name", ph: "Latte" },
                  { key: "price", label: "Price", ph: "3.50" },
                  { key: "category", label: "Category", ph: "Coffee" },
                  { key: "emoji", label: "Emoji", ph: "☕" },
                  { key: "sort_order", label: "Sort Order", ph: "0" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">{f.label}</label>
                    <input type={f.key === "price" || f.key === "sort_order" ? "number" : "text"}
                      value={(menuForm as Record<string, string>)[f.key]}
                      onChange={e => setMenuForm(x => ({ ...x, [f.key]: e.target.value }))}
                      placeholder={f.ph}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-yellow-400" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={addMenuItem} disabled={savingMenu || !menuForm.name || !menuForm.price}
                  className="bg-yellow-400 text-black font-black px-5 py-2 rounded-full text-sm disabled:opacity-50">
                  {savingMenu ? "Saving…" : "Add Item"}
                </button>
                <button onClick={() => setShowAddMenuItem(false)} className="text-zinc-400 text-sm px-4 py-2">Cancel</button>
              </div>
            </div>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            {menuItems.length === 0 ? (
              <p className="text-center text-zinc-600 py-8 text-sm">No items yet — add your first item above</p>
            ) : menuItems.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-4 py-3 border-b border-zinc-800 last:border-0">
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm">{item.name}</p>
                  <p className="text-zinc-500 text-xs">{item.category} · ${Number(item.price).toFixed(2)}</p>
                </div>
                <button onClick={() => toggleMenuItem(item)}
                  className={`px-3 py-1 rounded-full text-xs font-black border transition-colors ${item.available ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-zinc-700 text-zinc-500 bg-zinc-800"}`}>
                  {item.available ? "Available" : "Hidden"}
                </button>
                <button onClick={() => deleteMenuItem(item.id)} className="text-red-400 text-xs hover:text-red-300 px-2">Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BILLING VIEW ── */}
      {view === "billing" && (
        <div className="max-w-xl">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
            <h3 className="font-black mb-2">Friday Billing Cron</h3>
            <p className="text-zinc-400 text-sm mb-4">Runs automatically every Friday at 8 AM CDT. Charges cards on file or sends Stripe invoices for accounts with outstanding balances.</p>
            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 mb-4 text-sm text-yellow-300">
              <strong>Next auto-run:</strong> this Friday at 8:00 AM CDT
            </div>
            <button onClick={runBilling} disabled={billingLoading}
              className="bg-yellow-400 text-black font-black px-6 py-3 rounded-full hover:bg-yellow-300 disabled:opacity-50 transition-colors">
              {billingLoading ? "Running…" : "▶ Run Billing Now"}
            </button>
          </div>

          {billingResult && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h3 className="font-black mb-3 text-green-400">Billing Complete</h3>
              <div className="space-y-2 text-sm">
                <p>💳 Cards charged: <strong>{billingResult.charged}</strong></p>
                <p>📧 Invoices sent: <strong>{billingResult.invoiced}</strong></p>
                <p>❌ Failed: <strong className={billingResult.failed ? "text-red-400" : ""}>{billingResult.failed}</strong></p>
                {billingResult.failures && billingResult.failures.length > 0 && (
                  <p className="text-red-400 text-xs">Failed accounts: {billingResult.failures.join(", ")}</p>
                )}
              </div>
            </div>
          )}

          {accounts.filter(a => a.status === "frozen").length > 0 && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-2">
              <h3 className="font-black mb-1 text-red-400">⛔ Frozen Accounts</h3>
              <p className="text-zinc-400 text-sm mb-3">Frozen accounts are skipped by billing. Unfreeze them first, then run billing.</p>
              <button onClick={unfreezeAll} disabled={unfreezeAllLoading}
                className="bg-green-500 text-black font-black px-5 py-2 rounded-full text-sm disabled:opacity-50 hover:bg-green-400 transition-colors">
                {unfreezeAllLoading ? "Unfreezing…" : `✓ Unfreeze All (${accounts.filter(a => a.status === "frozen").length})`}
              </button>
            </div>
          )}

          <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h3 className="font-black mb-3">Send Payment Reminders</h3>
            <p className="text-zinc-400 text-sm mb-4">Click Remind next to any frozen account to email the parent.</p>
            {accounts.filter(a => a.status === "frozen" || Number(a.balance) > 0).length === 0 ? (
              <p className="text-zinc-600 text-sm">No accounts need reminders right now.</p>
            ) : accounts.filter(a => a.status === "frozen" || Number(a.balance) > 0).map(acct => (
              <div key={acct.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <div>
                  <p className="font-bold text-sm">{acct.student_name}</p>
                  <p className="text-zinc-500 text-xs">{acct.status === "frozen" ? "⛔ Frozen" : `Balance: $${Number(acct.balance).toFixed(2)}`}</p>
                </div>
                <button onClick={() => doRemind(acct.id)} disabled={reminding === acct.id}
                  className="bg-zinc-800 text-yellow-400 text-xs font-black px-3 py-1.5 rounded-full border border-zinc-700 disabled:opacity-50">
                  {reminding === acct.id ? "Sending…" : "📧 Remind"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
