"use client";
import { useState } from "react";

type Tab = "weekly" | "semester1" | "semester2" | "fullyear";

type Pkg = {
  id: string;
  label: string;
  detail: string;
  price: number;
  hasBabka?: boolean;
  installmentEligible?: boolean;
  badge?: string;
};

const PACKAGES: Record<Tab, Pkg[]> = {
  weekly: [
    { id: "weekly_challah", label: "1 Challah", detail: "Fresh challah for this Friday", price: 6.50 },
    { id: "weekly_babka",   label: "1 Babka",   detail: "Cinnamon or chocolate — pick your flavor", price: 18.00, hasBabka: true },
  ],
  semester1: [
    { id: "s1_1challah",       label: "1 Challah / week",       detail: "Aug 28 – Dec 18",                       price: 76,  badge: "SAVE 10%" },
    { id: "s1_2challah",       label: "2 Challah / week",       detail: "Aug 28 – Dec 18",                       price: 152, badge: "SAVE 10%" },
    { id: "s1_1challah_1babka",label: "1 Challah + 1 Babka",    detail: "Aug 28 – Dec 18 · One flavor all semester", price: 290, hasBabka: true, badge: "SAVE 10%" },
    { id: "s1_2challah_1babka",label: "2 Challah + 1 Babka",    detail: "Aug 28 – Dec 18 · One flavor all semester", price: 366, hasBabka: true, badge: "SAVE 10%" },
  ],
  semester2: [
    { id: "s2_1challah",       label: "1 Challah / week",       detail: "Jan 8 – Jun 4",                         price: 105, badge: "SAVE 10%" },
    { id: "s2_2challah",       label: "2 Challah / week",       detail: "Jan 8 – Jun 4",                         price: 210, badge: "SAVE 10%" },
    { id: "s2_1challah_1babka",label: "1 Challah + 1 Babka",    detail: "Jan 8 – Jun 4 · One flavor all semester", price: 395, hasBabka: true, badge: "SAVE 10%" },
    { id: "s2_2challah_1babka",label: "2 Challah + 1 Babka",    detail: "Jan 8 – Jun 4 · One flavor all semester", price: 500, hasBabka: true, badge: "SAVE 10%" },
  ],
  fullyear: [
    { id: "fy_1challah",       label: "1 Challah / week",       detail: "Full school year · Aug 28 – Jun 4",     price: 172, badge: "SAVE 20%" },
    { id: "fy_2challah",       label: "2 Challah / week",       detail: "Full school year · Aug 28 – Jun 4",     price: 344, badge: "SAVE 20%" },
    { id: "fy_1challah_1babka",label: "1 Challah + 1 Babka",    detail: "Full school year · One flavor all year", price: 651, hasBabka: true, installmentEligible: true, badge: "SAVE 20%" },
    { id: "fy_2challah_1babka",label: "2 Challah + 1 Babka",    detail: "Full school year · One flavor all year", price: 827, hasBabka: true, installmentEligible: true, badge: "SAVE 20%" },
  ],
};

const CUTOFFS: Record<Tab, string> = {
  weekly:    "Wednesday at 11 PM weekly",
  semester1: "Tuesday, Aug 26 at 11 PM",
  semester2: "Monday, Jan 5 at 11 PM",
  fullyear:  "Tuesday, Aug 26 at 11 PM",
};

// Check if a tab's ordering window is closed
function isWeeklyClosed(): boolean {
  // Closed: Wednesday 11 PM through Friday noon (America/Chicago, handles CDT/CST automatically)
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);
  const dayStr = parts.find(p => p.type === "weekday")?.value ?? "";
  const hour = parseInt(parts.find(p => p.type === "hour")?.value ?? "0");
  const day = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(dayStr);

  if (day === 3 && hour >= 23) return true; // Wednesday after 11 PM
  if (day === 4) return true;               // All day Thursday
  if (day === 5 && hour < 12) return true;  // Friday before noon (after pickup reopens)
  return false;
}

function isClosed(tab: Tab): boolean {
  const now = Date.now();
  if (tab === "semester1" || tab === "fullyear") return now > new Date("2026-08-27T04:00:00Z").getTime();
  if (tab === "semester2") return now > new Date("2027-01-06T05:00:00Z").getTime();
  return isWeeklyClosed();
}

function getNextFriday(): string {
  const d = new Date();
  const daysUntil = (5 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntil);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function CoopChallahPage() {
  const [incentiveOpen, setIncentiveOpen] = useState(true);
  const [tab, setTab] = useState<Tab>("weekly");
  const [selected, setSelected] = useState<Pkg | null>(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", babka_flavor: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const selectPackage = (pkg: Pkg) => {
    setSelected(pkg);
    setIsInstallment(false);
    setError("");
    if (pkg.installmentEligible) {
      setPaymentModal(true);
    }
  };

  const handleSubmit = async (installment = false) => {
    if (!selected) return;
    if (!form.name || !form.phone) { setError("Please enter your name and phone number."); return; }
    if (selected.hasBabka && !form.babka_flavor) { setError("Please choose a babka flavor."); return; }
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/coopchallah/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        order_type: tab,
        package: selected.id,
        babka_flavor: selected.hasBabka ? form.babka_flavor : null,
        is_installment: installment,
      }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const tabs: { v: Tab; label: string }[] = [
    { v: "weekly",   label: "Weekly" },
    { v: "semester1",label: "Semester 1" },
    { v: "semester2",label: "Semester 2" },
    { v: "fullyear", label: "Full Year" },
  ];

  return (
    <main className="min-h-screen bg-black text-white">

      {/* ── Incentive Popup ─────────────────────────────────────────────── */}
      {incentiveOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-md w-full text-center">
            <p className="text-5xl mb-4">🐓🍞</p>
            <h2 className="text-3xl font-black mb-2 leading-tight">Lock In Your Shabbat.<br />All Year.</h2>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              Subscribe for the full school year and save <span className="text-yellow-400 font-black">20%</span> off weekly prices.
            </p>
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-5 mb-6 text-left">
              <p className="text-yellow-400 font-black text-sm mb-2">💡 Split It Into 4 Easy Payments</p>
              <p className="text-zinc-300 text-sm leading-relaxed">
                Our full-year Challah + Babka packages let you auto-draft 4 equal installments instead of paying all at once — no big upfront cost, no hassle. Just fresh Challah and Babka waiting every Friday.
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                {["Aug 28","Oct 15","Jan 8","Mar 15"].map(d => (
                  <div key={d} className="bg-yellow-400/10 rounded-lg py-1.5 text-yellow-400 font-black">{d}</div>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { setIncentiveOpen(false); setTab("fullyear"); }}
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-black py-3 rounded-full text-sm transition-colors">
                📅 See Full Year Plans
              </button>
              <button
                onClick={() => setIncentiveOpen(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-black py-3 rounded-full text-sm transition-colors border border-zinc-700">
                See All Plans
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-zinc-950 border-b border-zinc-800 px-6 py-6 text-center">
        <p className="text-4xl mb-2">🍞</p>
        <h1 className="text-3xl font-black tracking-tight">THE COOP</h1>
        <p className="text-zinc-400 text-sm">Challah & Babka Pre-Orders · by The Hungry Rooster</p>
        <p className="text-zinc-600 text-xs mt-1">Pickup every Friday morning at The Coop Counter</p>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 flex gap-2 overflow-x-auto border-b border-zinc-900">
        {tabs.map(t => (
          <button key={t.v} onClick={() => { setTab(t.v); setSelected(null); }}
            className={`px-5 py-2.5 rounded-full text-sm font-black whitespace-nowrap flex-shrink-0 transition-colors ${
              tab === t.v ? "bg-yellow-400 text-black" : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-600"
            } ${t.v === "fullyear" ? "ring-1 ring-yellow-400/30" : ""}`}>
            {t.v === "fullyear" ? "⭐ Full Year" : t.label}
          </button>
        ))}
      </div>

      {/* ── Cutoff notice ───────────────────────────────────────────────── */}
      <div className="px-6 pt-4">
        <div className={`rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2 w-fit ${isClosed(tab) ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-zinc-900 text-zinc-500 border border-zinc-800"}`}>
          {isClosed(tab) ? "⛔ Registration closed for this period" : `⏰ Order cutoff: ${CUTOFFS[tab]}${tab === "weekly" ? ` · Next pickup: ${getNextFriday()}` : ""}`}
        </div>
      </div>

      {/* ── Package cards ───────────────────────────────────────────────── */}
      <div className="px-6 py-6">
        {isClosed(tab) ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-zinc-500 font-bold">Registration is closed for this period.</p>
            <p className="text-zinc-700 text-sm mt-1">Check back when the next enrollment opens.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {PACKAGES[tab].map(pkg => (
              <button key={pkg.id} onClick={() => selectPackage(pkg)}
                className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                  selected?.id === pkg.id
                    ? "border-yellow-400 bg-yellow-400/10"
                    : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                }`}>
                {pkg.badge && (
                  <span className="absolute top-3 right-3 bg-yellow-400 text-black text-xs font-black px-2.5 py-1 rounded-full">
                    {pkg.badge}
                  </span>
                )}
                {pkg.installmentEligible && (
                  <span className="absolute bottom-3 right-3 text-teal-400 text-xs font-black">4 installments available</span>
                )}
                <p className="font-black text-lg mb-1 pr-16">{pkg.label}</p>
                <p className="text-zinc-500 text-xs mb-3">{pkg.detail}</p>
                <p className="text-yellow-400 font-black text-2xl">${pkg.price.toFixed(2)}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Order form ──────────────────────────────────────────────────── */}
      {selected && !isClosed(tab) && !paymentModal && (
        <div className="px-6 pb-12">
          <div className="max-w-md mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
            <h3 className="font-black text-lg mb-1">Your Order</h3>
            <p className="text-zinc-500 text-sm mb-5">{selected.label} — <span className="text-yellow-400 font-black">${selected.price.toFixed(2)}</span></p>

            {/* Babka flavor */}
            {selected.hasBabka && (
              <div className="mb-4">
                <label className="text-xs text-zinc-400 uppercase tracking-widest mb-2 block">Babka Flavor{tab !== "weekly" ? " (for entire subscription)" : ""}</label>
                <div className="grid grid-cols-2 gap-3">
                  {["cinnamon", "chocolate"].map(f => (
                    <button key={f} onClick={() => set("babka_flavor", f)}
                      className={`py-3 rounded-xl border-2 font-black text-sm capitalize transition-colors ${
                        form.babka_flavor === f ? "border-yellow-400 bg-yellow-400/10 text-yellow-400" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                      }`}>
                      {f === "cinnamon" ? "🤎 Cinnamon" : "🍫 Chocolate"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Name */}
            <div className="mb-3">
              <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Your Name *</label>
              <input type="text" value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="Parent name"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
            </div>

            {/* Phone */}
            <div className="mb-5">
              <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Phone Number *</label>
              <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                placeholder="(214) 555-0100"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
            </div>

            {error && <p className="text-red-400 text-sm mb-4 font-bold">{error}</p>}

            <button onClick={() => handleSubmit(false)} disabled={submitting}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black py-4 rounded-full text-base transition-colors">
              {submitting ? "Redirecting…" : `Pay $${selected.price.toFixed(2)} →`}
            </button>
            <button onClick={() => setSelected(null)} className="w-full text-zinc-600 hover:text-white text-sm py-2 mt-2 transition-colors font-bold">
              ← Change selection
            </button>
          </div>
        </div>
      )}

      {/* ── Payment Choice Modal (Full Year Babka combos) ──────────────── */}
      {paymentModal && selected && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-7 max-w-sm w-full">
            <h3 className="font-black text-xl mb-1">How would you like to pay?</h3>
            <p className="text-zinc-500 text-sm mb-6">{selected.label} — <span className="text-yellow-400 font-black">${selected.price.toFixed(2)} total</span></p>

            {/* Installment option */}
            <button onClick={() => { setIsInstallment(true); setPaymentModal(false); }}
              className="w-full text-left bg-yellow-400/10 border-2 border-yellow-400/40 hover:border-yellow-400 rounded-2xl p-5 mb-3 transition-all group">
              <div className="flex items-center justify-between mb-1">
                <p className="font-black text-yellow-400">4 Easy Installments</p>
                <span className="text-xs bg-yellow-400 text-black font-black px-2 py-0.5 rounded-full">POPULAR</span>
              </div>
              <p className="text-2xl font-black text-white mb-0.5">${(selected.price / 4).toFixed(2)} <span className="text-base text-zinc-400 font-bold">× 4</span></p>
              <p className="text-zinc-500 text-xs">Auto-drafted Aug 28 · Oct 15 · Jan 8 · Mar 15</p>
            </button>

            {/* Pay in full option */}
            <button onClick={() => { setIsInstallment(false); setPaymentModal(false); }}
              className="w-full text-left bg-zinc-900 border-2 border-zinc-700 hover:border-zinc-500 rounded-2xl p-5 mb-5 transition-all">
              <p className="font-black mb-1">Pay in Full</p>
              <p className="text-2xl font-black text-yellow-400">${selected.price.toFixed(2)}</p>
              <p className="text-zinc-500 text-xs mt-0.5">One payment, done</p>
            </button>

            {/* Info fields in modal */}
            {selected.hasBabka && (
              <div className="mb-3">
                <label className="text-xs text-zinc-400 uppercase tracking-widest mb-2 block">Babka Flavor (for entire year)</label>
                <div className="grid grid-cols-2 gap-2">
                  {["cinnamon", "chocolate"].map(f => (
                    <button key={f} onClick={() => set("babka_flavor", f)}
                      className={`py-2.5 rounded-xl border font-black text-sm capitalize transition-colors ${
                        form.babka_flavor === f ? "border-yellow-400 bg-yellow-400/10 text-yellow-400" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                      }`}>
                      {f === "cinnamon" ? "🤎 Cinnamon" : "🍫 Chocolate"}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-3">
              <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Your Name *</label>
              <input type="text" value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="Parent name"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
            </div>
            <div className="mb-5">
              <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Phone *</label>
              <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                placeholder="(214) 555-0100"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
            </div>

            {error && <p className="text-red-400 text-sm mb-3 font-bold">{error}</p>}

            <button onClick={() => handleSubmit(isInstallment)} disabled={submitting}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black py-4 rounded-full text-base transition-colors mb-2">
              {submitting ? "Redirecting…" : isInstallment ? `Pay $${(selected.price / 4).toFixed(2)} Now →` : `Pay $${selected.price.toFixed(2)} →`}
            </button>
            <button onClick={() => { setPaymentModal(false); setSelected(null); }} className="w-full text-zinc-600 hover:text-white text-sm py-1.5 transition-colors font-bold">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="text-center pb-10 pt-4 text-zinc-700 text-xs px-6">
        Shabbat Shalom · Powered by Stripe · The Coop by The Hungry Rooster
      </div>
    </main>
  );
}
