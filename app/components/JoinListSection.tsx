"use client";
import { useState } from "react";

export default function JoinListSection() {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [smsChecked, setSmsChecked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.email && !form.phone) {
      setError("Enter at least an email or phone number.");
      return;
    }
    if (form.phone && !smsChecked) {
      setError("Please check the SMS consent box to receive texts.");
      return;
    }
    setLoading(true);
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email || undefined,
          phone: smsChecked ? form.phone : undefined,
          source: "homepage",
        }),
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section className="bg-zinc-900 border-t border-zinc-800 px-6 py-20 text-center">
        <p className="text-5xl mb-4">🐓</p>
        <h2 className="text-3xl font-black mb-2 text-white">You're in!</h2>
        <p className="text-zinc-400 text-lg max-w-md mx-auto">
          Fred will keep you posted on weekly specials, new dinner drops, and Shabbat menus.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-zinc-900 border-t border-zinc-800 px-6 py-20">
      <div className="max-w-xl mx-auto text-center">
        <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-3">Stay in the loop</p>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
          Be the first to know.
        </h2>
        <p className="text-zinc-400 text-lg mb-10 max-w-md mx-auto leading-relaxed">
          Weekly dinner drops, Shabbat menus, new menu items, and exclusive offers — straight to your inbox or phone.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <input
            type="text"
            placeholder="First name (optional)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500"
          />
          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500"
          />
          <div className="relative">
            <input
              type="tel"
              placeholder="Phone number (for text updates)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500"
            />
          </div>
          {form.phone && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={smsChecked}
                onChange={(e) => setSmsChecked(e.target.checked)}
                className="mt-1 w-4 h-4 accent-teal-500 cursor-pointer shrink-0"
              />
              <span className="text-xs text-zinc-500 leading-relaxed">
                Yes, send me texts from The Hungry Rooster including updates, specials, and offers. Msg frequency varies. Reply STOP to cancel. Msg and data rates may apply.{" "}
                <a href="/privacy" className="underline text-zinc-400">Privacy Policy</a>
              </span>
            </label>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black font-black py-4 rounded-full text-lg transition-colors"
          >
            {loading ? "Signing up..." : "Count me in →"}
          </button>
        </form>
        <p className="text-zinc-600 text-xs mt-4">No spam. Unsubscribe any time.</p>
      </div>
    </section>
  );
}
