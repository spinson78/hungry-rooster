"use client";
import { useState } from "react";

const MENU = [
  { id: "brisket_sandwich", emoji: "🥩", label: "Brisket Sandwich", detail: "w/ French Fries", price: 16.50 },
  { id: "caesar_salad",     emoji: "🥗", label: "Chicken Caesar Salad", detail: "Fresh romaine, grilled chicken", price: 21.00 },
  { id: "bbq_wrap",         emoji: "🌯", label: "Crispy BBQ Chicken Wrap", detail: "w/ Chips", price: 16.50 },
];

const DRINKS = ["Water Bottle", "Sweet Tea", "Sprite", "Coke", "Diet Coke", "Root Beer"];
const GRADES = ["9th Grade", "10th Grade", "11th Grade", "12th Grade"];

function getNextThursday(): string {
  const d = new Date();
  const days = (4 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function isClosed(): boolean {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  if (day === 4 && hour >= 12) return true;
  if (day === 5 || day === 6 || day === 0) return true;
  return false;
}

export default function AkibaLunchPage() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [mealCounts, setMealCounts] = useState<Record<string, number>>({});
  const [drink, setDrink] = useState("");
  const [drinkModal, setDrinkModal] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [grade, setGrade] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const closed = isClosed();
  const thursday = getNextThursday();

  const totalMeals = Object.values(mealCounts).reduce((a, b) => a + b, 0);
  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);
  const total = MENU.reduce((sum, item) => {
    const qty = quantities[item.id] || 0;
    const meals = mealCounts[item.id] || 0;
    return sum + qty * item.price + meals * 5;
  }, 0);

  const adjustQty = (id: string, delta: number) => {
    const current = quantities[id] || 0;
    const next = Math.max(0, Math.min(10, current + delta));
    setQuantities(prev => ({ ...prev, [id]: next }));
    if (delta < 0) {
      setMealCounts(prev => ({ ...prev, [id]: Math.min(prev[id] || 0, next) }));
    }
  };

  const adjustMeals = (id: string, delta: number) => {
    const maxMeals = quantities[id] || 0;
    setMealCounts(prev => ({
      ...prev,
      [id]: Math.max(0, Math.min(maxMeals, (prev[id] || 0) + delta)),
    }));
  };

  const doCheckout = async (drinkChoice: string) => {
    setError("");
    setSubmitting(true);
    const cart = MENU
      .filter(item => (quantities[item.id] || 0) > 0)
      .map(item => ({
        item_id: item.id,
        qty: quantities[item.id] || 0,
        meal_count: mealCounts[item.id] || 0,
      }));

    const res = await fetch("/api/akiba-lunch/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_name: studentName.trim(), grade, cart, drink: drinkChoice || null }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error || "Something went wrong.");
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (totalItems === 0) { setError("Please add at least one item."); return; }
    if (!studentName.trim()) { setError("Please enter a student name or family note."); return; }
    if (!grade) { setError("Please select a grade."); return; }
    if (totalMeals > 0 && !drink) { setDrinkModal(true); return; }
    await doCheckout(drink);
  };

  const handleDrinkSelect = (d: string) => {
    setDrink(d);
    setDrinkModal(false);
    doCheckout(d);
  };

  return (
    <main className="min-h-screen bg-black text-white">

      {/* Header */}
      <div className="bg-zinc-950 border-b border-zinc-800 px-6 py-8 text-center">
        <p className="text-4xl mb-2">🐓🏫</p>
        <h1 className="text-3xl font-black tracking-tight">Akiba Yavneh Lunch</h1>
        <p className="text-zinc-400 text-sm mt-1">by The Hungry Rooster · The Coop</p>
        <div className={`inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full text-xs font-bold ${closed ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-zinc-900 text-zinc-400 border border-zinc-800"}`}>
          {closed ? "⛔ Orders closed — opens again Monday" : `⏰ Order by Thursday noon · Delivery: ${thursday}`}
        </div>
      </div>

      {closed ? (
        <div className="text-center py-24 px-6">
          <p className="text-5xl mb-4">📅</p>
          <h2 className="text-2xl font-black mb-2">Orders Are Closed</h2>
          <p className="text-zinc-500">Ordering opens Monday and closes Thursday at noon.<br />Check back next week!</p>
        </div>
      ) : (
        <div className="px-6 py-8 max-w-lg mx-auto">

          {/* Menu */}
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Build Your Order</h2>
          <div className="space-y-3 mb-6">
            {MENU.map(item => {
              const qty = quantities[item.id] || 0;
              const meals = mealCounts[item.id] || 0;
              return (
                <div key={item.id} className={`border-2 rounded-2xl p-5 transition-all ${qty > 0 ? "border-yellow-400 bg-yellow-400/5" : "border-zinc-800 bg-zinc-950"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-3xl shrink-0">{item.emoji}</span>
                      <div className="min-w-0">
                        <p className="font-black text-base leading-tight">{item.label}</p>
                        <p className="text-zinc-500 text-xs">{item.detail} · <span className="text-yellow-400">${item.price.toFixed(2)}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => adjustQty(item.id, -1)} disabled={qty === 0}
                        className="w-9 h-9 rounded-full border border-zinc-700 font-black text-lg disabled:opacity-30 hover:border-yellow-400 transition-colors flex items-center justify-center">−</button>
                      <span className="w-6 text-center font-black text-lg">{qty}</span>
                      <button onClick={() => adjustQty(item.id, 1)}
                        className="w-9 h-9 rounded-full border border-zinc-700 font-black text-lg hover:border-yellow-400 transition-colors flex items-center justify-center">+</button>
                    </div>
                  </div>

                  {qty > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">🥤 Make it a Meal</p>
                        <p className="text-xs text-zinc-500">+$5 each · drink + cookie</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => adjustMeals(item.id, -1)} disabled={meals === 0}
                          className="w-8 h-8 rounded-full border border-zinc-700 text-teal-400 font-black disabled:opacity-30 hover:border-teal-400 transition-colors flex items-center justify-center text-sm">−</button>
                        <span className="w-5 text-center font-black text-teal-400">{meals}</span>
                        <button onClick={() => adjustMeals(item.id, 1)} disabled={meals >= qty}
                          className="w-8 h-8 rounded-full border border-zinc-700 text-teal-400 font-black disabled:opacity-30 hover:border-teal-400 transition-colors flex items-center justify-center text-sm">+</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Drink indicator */}
          {totalMeals > 0 && drink && (
            <div className="mb-4 flex items-center justify-between bg-teal-400/10 border border-teal-400/30 rounded-2xl px-5 py-3">
              <p className="text-teal-400 font-black text-sm">🥤 {totalMeals} meal{totalMeals > 1 ? "s" : ""} · {drink}</p>
              <button onClick={() => setDrink("")} className="text-zinc-500 hover:text-red-400 text-xs font-bold transition-colors">Change</button>
            </div>
          )}

          {/* Order form */}
          {totalItems > 0 && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-6">
              <h3 className="font-black text-sm uppercase tracking-widest text-zinc-400 mb-4">Order Details</h3>

              <div className="mb-4">
                <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Student Name / Family Note *</label>
                <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)}
                  placeholder="e.g. 'Jake Cohen' or 'Cohen family ×2'"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
              </div>

              <div className="mb-5">
                <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Grade *</label>
                <select value={grade} onChange={e => setGrade(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400 text-sm">
                  <option value="">Select grade…</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Order summary */}
              <div className="border-t border-zinc-800 pt-4 mb-5 space-y-2">
                {MENU.filter(item => (quantities[item.id] || 0) > 0).map(item => {
                  const qty = quantities[item.id] || 0;
                  const meals = mealCounts[item.id] || 0;
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-zinc-400">{item.emoji} {item.label} ×{qty}{meals > 0 ? ` + ${meals} meal` : ""}</span>
                      <span className="font-bold">${(qty * item.price + meals * 5).toFixed(2)}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center pt-2 border-t border-zinc-800 mt-2">
                  <span className="text-zinc-400 text-sm">Total</span>
                  <span className="text-yellow-400 font-black text-2xl">${total.toFixed(2)}</span>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm mb-4 font-bold">{error}</p>}

              <button onClick={handleSubmit} disabled={submitting}
                className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black py-4 rounded-full text-base transition-colors">
                {submitting ? "Redirecting to checkout…" : `Pay $${total.toFixed(2)} →`}
              </button>
              <p className="text-zinc-600 text-xs text-center mt-3">Secure payment via Stripe · Delivered Thursday at Akiba Yavneh.</p>
            </div>
          )}
        </div>
      )}

      {/* Drink modal */}
      {drinkModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-950 border-2 border-teal-400 rounded-3xl p-7 max-w-sm w-full">
            <p className="text-4xl mb-3 text-center">🥤🍪</p>
            <h3 className="font-black text-xl mb-1 text-center">Choose Your Drink</h3>
            <p className="text-zinc-500 text-sm mb-5 text-center">{totalMeals} meal add-on{totalMeals > 1 ? "s" : ""} · drink + cookie</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {DRINKS.map(d => (
                <button key={d} onClick={() => handleDrinkSelect(d)}
                  className="py-3 px-4 rounded-xl border border-zinc-700 hover:border-teal-400 hover:bg-teal-400/10 text-sm font-bold transition-colors text-left">
                  {d}
                </button>
              ))}
            </div>
            <button onClick={() => setDrinkModal(false)}
              className="w-full text-zinc-500 hover:text-white text-sm py-3 transition-colors font-bold">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="text-center pb-10 pt-4 text-zinc-700 text-xs">
        Akiba Yavneh Lunch · Powered by Stripe · The Coop by The Hungry Rooster
      </div>
    </main>
  );
}
