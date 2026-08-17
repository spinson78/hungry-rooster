"use client";
import { useState } from "react";

type Transaction = { id: string; type: string; amount: number; description: string; created_at: string };
type Account = { student_name: string; parent_name: string; grade_class: string; school_name: string; billing_preference: string; balance: number; status: string; freeze_reason: string | null };

const TYPE_LABEL: Record<string, string> = {
  purchase: "Purchase",
  payment: "Payment",
  adjustment: "Adjustment",
  billing_charge: "Weekly Charge",
  billing_invoice: "Weekly Invoice Sent",
};

export default function ParentPortalPage() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const lookup = async () => {
    if (!email || !pin) { setError("Enter your email and student ID."); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/school/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, pin }),
    });
    const data = await res.json();
    if (data.account) {
      setAccount(data.account);
      setTransactions(data.transactions);
    } else {
      setError(data.error || "Account not found.");
    }
    setLoading(false);
  };

  if (account) {
    return (
      <main className="min-h-screen bg-black text-white px-6 py-12">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <p className="text-4xl mb-3">☕</p>
            <h1 className="text-2xl font-black">{account.student_name}&apos;s Account</h1>
            <p className="text-zinc-500 text-sm">{account.school_name}{account.grade_class ? ` · ${account.grade_class}` : ""}</p>
          </div>

          {/* Status + Balance */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Current Balance</p>
              <p className="text-3xl font-black text-yellow-400">${Number(account.balance).toFixed(2)}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Status</p>
              <p className={`text-lg font-black ${account.status === "active" ? "text-green-400" : account.status === "frozen" ? "text-red-400" : "text-yellow-400"}`}>
                {account.status === "active" ? "✓ Active" : account.status === "frozen" ? "⛔ Frozen" : "⏳ Pending"}
              </p>
            </div>
          </div>

          {account.status === "frozen" && account.freeze_reason && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-sm text-red-300">
              <strong>Account frozen:</strong> {account.freeze_reason}. Please contact the THE COOP to resolve.
            </div>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6">
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Billing</p>
            <p className="font-bold">{account.billing_preference === "auto_charge" ? "💳 Card auto-charged each Friday" : "📧 Invoice sent each Friday"}</p>
          </div>

          {/* Transaction History */}
          <h2 className="font-black text-sm uppercase tracking-widest text-zinc-500 mb-3">Transaction History</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            {transactions.length === 0 ? (
              <p className="text-center text-zinc-600 py-8 text-sm">No transactions yet</p>
            ) : transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 last:border-0">
                <div>
                  <p className="font-bold text-sm">{TYPE_LABEL[t.type] || t.type}</p>
                  <p className="text-zinc-500 text-xs">{t.description}</p>
                  <p className="text-zinc-600 text-xs">{new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                </div>
                <p className={`font-black text-sm ${t.amount < 0 ? "text-green-400" : "text-white"}`}>
                  {t.amount < 0 ? "-" : "+"}${Math.abs(t.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <button onClick={() => { setAccount(null); setTransactions([]); }} className="w-full mt-6 text-zinc-500 text-sm py-3">
            Sign Out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <p className="text-5xl mb-4">☕</p>
          <h1 className="text-2xl font-black mb-2">THE COOP — Parent Portal</h1>
          <p className="text-zinc-400 text-sm">View your student&apos;s balance and transaction history</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Your Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="parent@email.com"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Student Account ID</label>
            <input type="text" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="1234"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 font-mono text-xl tracking-widest" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={lookup} disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black py-4 rounded-full text-lg transition-colors">
            {loading ? "Looking up…" : "View Account →"}
          </button>
          <div className="text-center">
            <a href="/school/register" className="text-teal-400 text-sm hover:underline">Don&apos;t have an account yet? Register →</a>
          </div>
        </div>
      </div>
    </main>
  );
}
