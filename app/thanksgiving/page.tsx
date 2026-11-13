"use client";
import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";

const MENU = [
  { name: "Dinner Rolls (1 dozen)", unit_price: 25, note: "Freshly baked, 1 dozen" },
  { name: "Garlicky Green Beans", unit_price: 55, note: "9×13 pan" },
  { name: "Herbed Stuffing", unit_price: 55, note: "9×13 pan" },
  { name: "Candied Sweet Potatoes", unit_price: 55, note: "9×13 pan" },
  { name: "Creamy Mashed Potatoes", unit_price: 55, note: "9×13 pan" },
  { name: "Cranberry Sauce", unit_price: 15, note: "1 Quart" },
  { name: "Apple Pie", unit_price: 25, note: "Scratch made" },
  { name: "Bourbon Pecan Pie", unit_price: 25, note: "Scratch made" },
  { name: "Chocolate Pecan Pie", unit_price: 25, note: "Scratch made" },
  { name: "Pumpkin Streusel Pie", unit_price: 25, note: "Scratch made" },
];

const MIN_ORDER = 50;
const CUTOFF = new Date("2026-11-24T06:00:00Z"); // Nov 23 midnight CST

export default function ThanksgivingPage() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ name: "", email: "", address: "", special_requests: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    setIsOpen(new Date() < CUTOFF);
  }, []);

  const setQty = (name: string, delta: number) => {
    setQuantities(prev => {
      const next = Math.max(0, (prev[name] || 0) + delta);
      if (next === 0) { const u = { ...prev }; delete u[name]; return u; }
      return { ...prev, [name]: next };
    });
  };

  const subtotal = MENU.reduce((s, item) => s + item.unit_price * (quantities[item.name] || 0), 0);
  const tax = Math.round(subtotal * 0.0825 * 100) / 100;
  const total = subtotal + tax;
  const meetsMin = subtotal >= MIN_ORDER;

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.address.trim()) {
      setError("Please fill in your name, email, and delivery address.");
      return;
    }
    if (!meetsMin) {
      setError(`Minimum order is $${MIN_ORDER}. Add more items to continue.`);
      return;
    }

    const items = MENU
      .filter(item => (quantities[item.name] || 0) > 0)
      .map(item => ({ name: item.name, qty: quantities[item.name], unit_price: item.unit_price, note: item.note }));

    setSubmitting(true);
    try {
      const res = await fetch("/api/thanksgiving/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-black text-white min-h-screen">
      <NavBar />
      <div className="px-5 py-10 max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-5xl mb-3">🦃</p>
          <h1 className="text-4xl font-black mb-2">Thanksgiving Pre-Order</h1>
          <p className="text-zinc-400 text-sm">Delivered Wednesday, November 26 · Order by midnight November 23</p>
        </div>

        {!isOpen ? (
          <div className="bg-zinc-900 border border-orange-500/30 rounded-2xl p-10 text-center">
            <p className="text-4xl mb-4">🦃</p>
            <h2 className="text-2xl font-black mb-2">Orders are closed</h2>
            <p className="text-zinc-400">Thanksgiving pre-orders closed November 23 at midnight. See you next year!</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Menu */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-orange-400 font-black text-sm uppercase tracking-widest mb-1">Thanksgiving Menu</p>
              <p className="text-zinc-500 text-xs mb-5">Select your items · Minimum order $50 · Delivered Nov 26</p>

              {/* Sides */}
              <p className="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-3">Sides & Rolls</p>
              <div className="space-y-2 mb-6">
                {MENU.slice(0, 6).map(item => {
                  const qty = quantities[item.name] || 0;
                  return (
                    <div key={item.name}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${qty > 0 ? "border-orange-400 bg-orange-400/5" : "border-zinc-700"}`}>
                      <div>
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-zinc-500 text-xs">{item.note}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-zinc-300 font-black text-sm">${item.unit_price}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setQty(item.name, -1)} disabled={qty === 0}
                            className="w-8 h-8 rounded-full border border-zinc-600 text-zinc-300 font-black text-lg flex items-center justify-center hover:border-orange-400 hover:text-orange-400 transition-colors disabled:opacity-30">−</button>
                          <span className="w-5 text-center font-black text-sm">{qty}</span>
                          <button onClick={() => setQty(item.name, 1)}
                            className="w-8 h-8 rounded-full border border-zinc-600 text-zinc-300 font-black text-lg flex items-center justify-center hover:border-orange-400 hover:text-orange-400 transition-colors">+</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pies */}
              <p className="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-3">Scratch Made Pies — $25 each</p>
              <div className="space-y-2">
                {MENU.slice(6).map(item => {
                  const qty = quantities[item.name] || 0;
                  return (
                    <div key={item.name}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${qty > 0 ? "border-orange-400 bg-orange-400/5" : "border-zinc-700"}`}>
                      <div>
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-zinc-500 text-xs">{item.note}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-zinc-300 font-black text-sm">$25</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setQty(item.name, -1)} disabled={qty === 0}
                            className="w-8 h-8 rounded-full border border-zinc-600 text-zinc-300 font-black text-lg flex items-center justify-center hover:border-orange-400 hover:text-orange-400 transition-colors disabled:opacity-30">−</button>
                          <span className="w-5 text-center font-black text-sm">{qty}</span>
                          <button onClick={() => setQty(item.name, 1)}
                            className="w-8 h-8 rounded-full border border-zinc-600 text-zinc-300 font-black text-lg flex items-center justify-center hover:border-orange-400 hover:text-orange-400 transition-colors">+</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <p className={`text-sm font-bold ${meetsMin ? "text-green-400" : "text-zinc-500"}`}>
                  {meetsMin ? "✓ Order minimum met!" : `$${(MIN_ORDER - subtotal).toFixed(2)} more needed to reach the $${MIN_ORDER} minimum`}
                </p>
                <p className="text-white font-black">${subtotal.toFixed(2)}</p>
              </div>
            </div>

            {/* Contact + Delivery */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <p className="text-orange-400 font-black text-sm uppercase tracking-widest mb-1">Your Info</p>

              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Full Name *</label>
                <input type="text" placeholder="Jane Smith" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Email *</label>
                <input type="email" placeholder="jane@email.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Delivery Address *</label>
                <input type="text" placeholder="1234 Main St, Dallas, TX 75201" value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Special Requests</label>
                <textarea placeholder="Allergies, gate codes, anything we should know..."
                  value={form.special_requests}
                  onChange={e => setForm({ ...form, special_requests: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-400 resize-none h-20" />
              </div>

              {/* Order summary */}
              <div className="bg-zinc-800 rounded-xl p-4 text-sm space-y-1.5">
                <p className="font-black text-zinc-300 mb-2">Order Summary</p>
                {MENU.filter(i => (quantities[i.name] || 0) > 0).map(i => (
                  <div key={i.name} className="flex justify-between text-zinc-400">
                    <span>{quantities[i.name]}× {i.name}</span>
                    <span>${(i.unit_price * (quantities[i.name] || 0)).toFixed(2)}</span>
                  </div>
                ))}
                {subtotal === 0 && <p className="text-zinc-600 text-xs">No items selected yet</p>}
                <div className="border-t border-zinc-700 pt-2 mt-2 space-y-1">
                  <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-zinc-400"><span>Sales Tax (8.25%)</span><span>${tax.toFixed(2)}</span></div>
                  <div className="flex justify-between font-black text-white text-base"><span>Total</span><span>${total.toFixed(2)}</span></div>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm font-bold">{error}</p>}

              <button onClick={handleSubmit}
                disabled={submitting || !meetsMin || subtotal === 0}
                className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-black py-4 rounded-full text-lg transition-colors mt-2">
                {submitting ? "Redirecting to payment…"
                  : subtotal === 0 ? "Select items to continue"
                  : !meetsMin ? `Add $${(MIN_ORDER - subtotal).toFixed(2)} more to checkout`
                  : `Pay $${total.toFixed(2)} — Secure Checkout 🦃`}
              </button>
              <p className="text-zinc-600 text-xs text-center">Powered by Stripe · Your card info is never stored on our servers</p>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-zinc-800 px-6 py-10 mt-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-8 w-auto opacity-50" />
          <p className="text-zinc-600 text-xs">Thanksgiving Pre-Order · Dallas, TX · Delivery November 26</p>
          <a href="/" className="text-zinc-400 hover:text-white text-sm font-bold transition-colors">← Back to The Hungry Rooster</a>
        </div>
      </footer>
    </main>
  );
}
