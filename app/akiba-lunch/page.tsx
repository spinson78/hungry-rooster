"use client";
import { useState } from "react";

const MENU = [
  { id: "brisket_sandwich", emoji: "🥩", label: "Brisket Sandwich", detail: "w/ French Fries", price: 16.50 },
  { id: "caesar_salad",     emoji: "🥗", label: "Chicken Caesar Salad", detail: "Fresh romaine, grilled chicken", price: 21.00 },
  { id: "bbq_wrap",         emoji: "🌯", label: "Crispy BBQ Chicken Wrap", detail: "w/ Chips", price: 16.50 },
];

const DRINKS = ["Water Bottle", "Sweet Tea", "Sprite", "Coke", "Diet Coke", "Root Beer"];

const GRADES = ["Pre-K", "Kindergarten", "1st Grade", "2nd Grade", "3rd Grade", "4th Grade",
  "5th Grade", "6th Grade", "7th Grade", "8th Grade", "9th Grade", "10th Grade", "11th Grade", "12th Grade"];

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
  // Closed Thu noon through Sun
  if (day === 4 && hour >= 12) return true;
  if (day === 5 || day === 6 || day === 0) return true;
  return false;
}

export default function AkibaLunchPage() {
  const [selected, setSelected] = useState<typeof MENU[0] | null>(null);
  const [meal, setMeal] = useState(false);
  const [drinkModal, setDrinkModal] = useState(false);
  const [drink, setDrink] = useState("");
  const [studentName, setStudentName] = useState("");
  const [grade, setGrade] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const closed = isClosed();
  const thursday = getNextThursday();

  const total = selected ? selected.price + (meal ? 5 : 0) : 0;

  const handleMealToggle = (checked: boolean) => {
    setMeal(checked);
    if (checked) { setDrinkModal(true); setDrink(""); }
    else { setDrink(""); }
  };

  const handleDrinkSelect = (d: string) => {
    setDrink(d);
    setDrinkModal(false);
  };

  const handleSubmit = async () => {
    if (!selected) return;
    if (!studentName.trim()) { setError("Please enter your student's name."); return; }
    if (!grade) { setError("Please select a grade."); return; }
    if (meal && !drink) { setError("Please choose a drink for the meal."); return; }
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/akiba-lunch/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_name: studentName.trim(), grade, item_id: selected.id, make_it_meal: meal, drink: drink || null }),
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
    <main className="min-h-screen bg-black text-white">

      {/* Header */}
      <div className="bg-zinc-950 border-b border-zinc-800 px-6 py-8 text-center">
        <p className="text-4xl mb-2">🐓🏫</p>
        <h1 className="text-3xl font-black tracking-tight">Akiba Yavneh Lunch</h1>
        <p className="text-zinc-400 text-sm mt-1">by The Hungry Rooster · The Coop</p>
        <div className={`inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full text-xs font-bold ${closed ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-zinc-900 text-zinc-400 border border-zinc-800"}`}>
          {closed
            ? "⛔ Orders closed — opens again Monday"
            : `⏰ Order by Thursday noon · Delivery: ${thursday}`}
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
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Choose Your Lunch</h2>
          <div className="space-y-3 mb-8">
            {MENU.map(item => (
              <button key={item.id} onClick={() => { setSelected(item); setMeal(false); setDrink(""); setError(""); }}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                  selected?.id === item.id
                    ? "border-yellow-400 bg-yellow-400/10"
                    : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                }`}>
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{item.emoji}</span>
                  <div>
                    <p className="font-black text-base">{item.label}</p>
                    <p className="text-zinc-500 text-xs">{item.detail}</p>
                  </div>
                </div>
                <p className="text-yellow-400 font-black text-xl shrink-0">${item.price.toFixed(2)}</p>
              </button>
            ))}
          </div>

          {/* Meal add-on */}
          {selected && (
            <div className="mb-6">
              <button
                onClick={() => handleMealToggle(!meal)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                  meal ? "border-teal-400 bg-teal-400/10" : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                }`}>
                <div className="flex items-center gap-4">
                  <span className="text-3xl">🥤</span>
                  <div>
                    <p className="font-black text-base">Make it a Meal</p>
                    <p className="text-zinc-500 text-xs">Add a drink + cookie</p>
                    {meal && drink && <p className="text-teal-400 text-xs font-bold mt-0.5">✓ {drink}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-xl ${meal ? "text-teal-400" : "text-zinc-400"}`}>+$5.00</p>
                  {meal && <p className="text-xs text-zinc-500">tap to remove</p>}
                </div>
              </button>
            </div>
          )}

          {/* Order form */}
          {selected && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-6">
              <h3 className="font-black text-sm uppercase tracking-widest text-zinc-400 mb-4">Student Info</h3>

              <div className="mb-4">
                <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Student Name *</label>
                <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)}
                  placeholder="First & Last Name"
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

              <div className="border-t border-zinc-800 pt-4 mb-5 flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Order Total</span>
                <span className="text-yellow-400 font-black text-2xl">${total.toFixed(2)}</span>
              </div>

              {error && <p className="text-red-400 text-sm mb-4 font-bold">{error}</p>}

              <button onClick={handleSubmit} disabled={submitting}
                className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black py-4 rounded-full text-base transition-colors">
                {submitting ? "Redirecting to checkout…" : `Pay $${total.toFixed(2)} →`}
              </button>
              <p className="text-zinc-600 text-xs text-center mt-3">Secure payment via Stripe. Delivered Thursday at Akiba Yavneh.</p>
            </div>
          )}
        </div>
      )}

      {/* Drink modal */}
      {drinkModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-7 max-w-sm w-full">
            <h3 className="font-black text-xl mb-1">Choose Your Drink</h3>
            <p className="text-zinc-500 text-sm mb-5">Included with your meal add-on</p>
            <div className="grid grid-cols-2 gap-2">
              {DRINKS.map(d => (
                <button key={d} onClick={() => handleDrinkSelect(d)}
                  className="py-3 px-4 rounded-xl border border-zinc-700 hover:border-yellow-400 hover:bg-yellow-400/10 text-sm font-bold transition-colors text-left">
                  {d}
                </button>
              ))}
            </div>
            <button onClick={() => { setDrinkModal(false); setMeal(false); }}
              className="w-full text-zinc-500 hover:text-white text-sm py-3 mt-4 transition-colors font-bold">
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
