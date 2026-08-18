"use client";
import { useState } from "react";

const AMOUNTS = [
  { value: 50,  coupons: 10,  label: "$50",  sub: "10 Fred's Bucks" },
  { value: 100, coupons: 20,  label: "$100", sub: "20 Fred's Bucks" },
  { value: 150, coupons: 30,  label: "$150", sub: "30 Fred's Bucks" },
  { value: 200, coupons: 40,  label: "$200", sub: "40 Fred's Bucks" },
];

export default function FredbucksPage() {
  const [form, setForm] = useState({ teacher_name: "", teacher_email: "", school_name: "", amount: 50 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.teacher_name || !form.teacher_email) { setError("Please fill in your name and email."); return; }
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/coop/fredbucks/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <p className="text-5xl mb-4">🐓</p>
          <h1 className="text-3xl font-black mb-1">Fred's Bucks</h1>
          <p className="text-zinc-400 text-sm">THE COOP by The Hungry Rooster</p>
          <p className="text-zinc-500 text-xs mt-3">Purchase Fred's Bucks for your students. Each buck is worth $5 cash value at The Coop counter. Pick up your sheet at The Coop Counter after purchase.</p>
        </div>

        <div className="space-y-5">
          {/* Amount selector */}
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-widest mb-2 block">Select Amount</label>
            <div className="grid grid-cols-2 gap-3">
              {AMOUNTS.map(a => (
                <button key={a.value} onClick={() => set("amount", a.value)}
                  className={`p-4 rounded-2xl border-2 text-left transition-colors ${form.amount === a.value ? "border-yellow-400 bg-yellow-400/10" : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"}`}>
                  <p className="font-black text-2xl text-yellow-400">{a.label}</p>
                  <p className="text-zinc-400 text-sm">{a.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Your Name *</label>
            <input type="text" value={form.teacher_name} onChange={e => set("teacher_name", e.target.value)}
              placeholder="Ms. Johnson"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Email *</label>
            <input type="email" value={form.teacher_email} onChange={e => set("teacher_email", e.target.value)}
              placeholder="teacher@school.edu"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
          </div>

          {/* School */}
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">School</label>
            <input type="text" value={form.school_name} onChange={e => set("school_name", e.target.value)}
              placeholder="School name"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black py-4 rounded-full text-lg transition-colors">
            {submitting ? "Redirecting to payment…" : `Purchase ${AMOUNTS.find(a => a.value === form.amount)?.sub} — $${form.amount}`}
          </button>

          <p className="text-zinc-600 text-xs text-center">Cock-a-doodle-YOU! · Powered by Stripe · Pick up at The Coop Counter</p>
        </div>
      </div>
    </main>
  );
}
