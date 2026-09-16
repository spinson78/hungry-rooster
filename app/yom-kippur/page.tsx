"use client";
import { useState } from "react";
import NavBar from "../components/NavBar";

const CUTOFF = new Date("2026-09-20T15:00:00Z"); // Sep 20 @ 10 AM CDT
const TAX_RATE = 0.0825;
const BOX_PRICE = 100;

function isOpen() {
  return new Date() < CUTOFF;
}

const BOX_CONTENTS = [
  "6 Bagels",
  "1 lb Tuna Salad",
  "1 lb Egg Salad",
  "1 lb Salmon Salad",
  "Caesar Salad",
  "Coffee Cake",
];

export default function YomKippurPage() {
  const open = isOpen();

  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    special_requests: "",
  });
  const [tip, setTip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = BOX_PRICE * quantity;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = subtotal + tax + tip;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("Please fill in your name, phone number, and delivery address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/yom-kippur/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          customer_address: form.address,
          special_requests: form.special_requests,
          quantity,
          tip,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); setLoading(false); return; }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="bg-black text-white min-h-screen">
      <NavBar />
      <div className="px-6 py-12 max-w-2xl mx-auto">
        {/* HEADER */}
        <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-2">Yom Kippur · Break Fast</p>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Break Fast Box</h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          End your fast the right way. Our Break Fast Box feeds 4–6 and delivers Sunday, September 20 in the evening.
          Order deadline is <span className="text-white font-bold">September 20 at 10 AM</span>.
        </p>

        {!open ? (
          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl px-6 py-8 text-center">
            <p className="text-yellow-400 font-black text-xl mb-2">Orders are now closed</p>
            <p className="text-zinc-400 text-sm">The order deadline has passed. G'mar Chatimah Tovah!</p>
          </div>
        ) : (
          <>
            {/* BOX CONTENTS */}
            <div className="bg-zinc-900 border border-yellow-400/30 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-black text-xl">Break Fast Box</p>
                  <p className="text-zinc-400 text-sm">Serves 4–6 · Delivery included</p>
                </div>
                <p className="text-2xl font-black text-yellow-400">${BOX_PRICE}</p>
              </div>
              <ul className="space-y-2">
                {BOX_CONTENTS.map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
                    <span className="text-yellow-400 font-black">·</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* QUANTITY */}
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-widest">How many boxes?</label>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 text-white font-black text-xl hover:border-yellow-400 transition-colors">−</button>
                  <span className="text-2xl font-black w-8 text-center">{quantity}</span>
                  <button type="button" onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 text-white font-black text-xl hover:border-yellow-400 transition-colors">+</button>
                  <span className="text-zinc-400 text-sm ml-2">× ${BOX_PRICE} each</span>
                </div>
              </div>

              {/* CONTACT */}
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-1 uppercase tracking-widest">Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors"
                  placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-1 uppercase tracking-widest">Phone *</label>
                <input type="tel" required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors"
                  placeholder="(214) 555-0000" />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-1 uppercase tracking-widest">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors"
                  placeholder="For your receipt (optional)" />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-1 uppercase tracking-widest">Delivery Address *</label>
                <input type="text" required value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors"
                  placeholder="Street, City, ZIP" />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-1 uppercase tracking-widest">Special Requests</label>
                <textarea value={form.special_requests} onChange={e => setForm(f => ({ ...f, special_requests: e.target.value }))}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors resize-none"
                  placeholder="Allergies, gate codes, delivery notes…" />
              </div>

              {/* TIP */}
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-widest">Add a Tip</label>
                <div className="flex gap-2 flex-wrap">
                  {[0, 5, 10, 15, 20].map(t => (
                    <button key={t} type="button" onClick={() => setTip(t)}
                      className={`px-4 py-2 rounded-full text-sm font-black border transition-colors ${tip === t ? "bg-yellow-400 text-black border-yellow-400" : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-yellow-400"}`}>
                      {t === 0 ? "No tip" : `$${t}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* ORDER SUMMARY */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-2 text-sm">
                <div className="flex justify-between text-zinc-300">
                  <span>Break Fast Box × {quantity}</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {tip > 0 && (
                  <div className="flex justify-between text-zinc-300">
                    <span>Tip</span>
                    <span>${tip.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-300">
                  <span>Tax (8.25%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Delivery</span>
                  <span className="text-green-400">Included</span>
                </div>
                <div className="border-t border-zinc-700 pt-2 flex justify-between font-black text-white text-base">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm font-bold">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-full text-lg transition-colors disabled:opacity-50">
                {loading ? "Redirecting to checkout…" : `Pay $${total.toFixed(2)} — Break the Fast Right`}
              </button>

              <p className="text-zinc-500 text-xs text-center">
                Delivery Sunday, September 20 · Evening · Dallas area
              </p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
