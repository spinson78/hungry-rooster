"use client";
import { useState } from "react";

const TOPPINGS = ["Sprinkles", "Parve Choco Chips", "Reese's Pieces", "Trail Mix", "Cherries"];

function minDeliveryDate() {
  const d = new Date(Date.now() + 48 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

type OrderType = "froyo" | "cupcakes" | "celebration_pack" | null;

export default function CoopCelebratePage() {
  const [selected, setSelected] = useState<OrderType>(null);
  const [form, setForm] = useState({
    purchaser_name: "", classroom: "", kids_name: "",
    delivery_date: "", delivery_time: "",
    student_count: "", quantity: "1",
    cupcake_flavor: "chocolate",
    special_requests: "",
  });
  const [toppings, setToppings] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const upd = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const toggleTopping = (t: string) => {
    setToppings(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : prev.length < 2 ? [...prev, t] : prev
    );
  };

  const getTotal = () => {
    if (selected === "froyo") return (parseInt(form.student_count) || 0) * 5;
    if (selected === "cupcakes") return (parseInt(form.quantity) || 1) * 36;
    if (selected === "celebration_pack") return (parseInt(form.quantity) || 1) * 100;
    return 0;
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.purchaser_name || !form.classroom || !form.delivery_date || !form.delivery_time) {
      setError("Please fill in all required fields."); return;
    }
    if (selected === "froyo" && (!form.student_count || parseInt(form.student_count) < 1)) {
      setError("Please enter number of students."); return;
    }
    if (selected === "celebration_pack" && toppings.length < 2) {
      setError("Please select exactly 2 toppings."); return;
    }
    setSubmitting(true);
    const res = await fetch("/api/coopcelebrate/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_type: selected,
        ...form,
        toppings,
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

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-zinc-950 border-b border-zinc-800 px-6 py-10 text-center">
        <p className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-3">THE COOP · By The Hungry Rooster</p>
        <h1 className="text-4xl font-black tracking-tight">Celebration Orders</h1>
        <p className="text-zinc-400 mt-2">Frozen yogurt, cupcakes & party packs for your class</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700 text-zinc-400 text-xs font-bold px-4 py-2 rounded-full">
          ⏰ 48-hour advance notice required
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Product selector */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500">Choose Your Celebration</h2>

          {/* Frozen Yogurt */}
          <button onClick={() => setSelected("froyo")}
            className={`w-full text-left border-2 rounded-2xl p-5 transition-all ${selected === "froyo" ? "border-teal-400 bg-teal-400/5" : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="font-black text-lg">Frozen Yogurt Party</p>
              <p className="text-teal-400 font-black">$5 / student</p>
            </div>
            <p className="text-zinc-400 text-sm">Frozen yogurt, spoon & sprinkles included · Price per student</p>
          </button>

          {/* Cupcakes */}
          <button onClick={() => setSelected("cupcakes")}
            className={`w-full text-left border-2 rounded-2xl p-5 transition-all ${selected === "cupcakes" ? "border-yellow-400 bg-yellow-400/5" : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="font-black text-lg">Cupcakes</p>
              <p className="text-yellow-400 font-black">$36 / dozen</p>
            </div>
            <p className="text-zinc-400 text-sm">Chocolate or Vanilla · Includes sprinkles · Sold in dozen packs</p>
          </button>

          {/* Celebration Pack */}
          <button onClick={() => setSelected("celebration_pack")}
            className={`w-full text-left border-2 rounded-2xl p-5 transition-all ${selected === "celebration_pack" ? "border-yellow-400 bg-yellow-400/5" : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-black text-lg">The Coop Celebration Pack</p>
                <span className="text-xs font-bold bg-yellow-400 text-black px-2 py-0.5 rounded-full">Best Value</span>
              </div>
              <p className="text-yellow-400 font-black text-xl">$100</p>
            </div>
            <p className="text-zinc-400 text-sm">12 cupcakes + 12 frozen yogurts · Comes with 2 yogurt toppings</p>
          </button>
        </div>

        {/* Order form */}
        {selected && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-5">
            <h3 className="font-black text-sm uppercase tracking-widest text-zinc-400">Order Details</h3>

            {/* Cupcake flavor */}
            {(selected === "cupcakes" || selected === "celebration_pack") && (
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-widest mb-2 block">Cupcake Flavor *</label>
                <div className="grid grid-cols-2 gap-3">
                  {["chocolate", "vanilla"].map(f => (
                    <button key={f} onClick={() => upd("cupcake_flavor", f)}
                      className={`py-3 rounded-xl font-bold text-sm capitalize border-2 transition-colors ${form.cupcake_flavor === f ? "border-yellow-400 bg-yellow-400/10 text-yellow-400" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Toppings for celebration pack */}
            {selected === "celebration_pack" && (
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-widest mb-2 block">Choose 2 Yogurt Toppings *</label>
                <div className="grid grid-cols-2 gap-2">
                  {TOPPINGS.map(t => (
                    <button key={t} onClick={() => toggleTopping(t)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-bold border-2 transition-colors text-left ${toppings.includes(t) ? "border-teal-400 bg-teal-400/10 text-teal-400" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"} ${!toppings.includes(t) && toppings.length >= 2 ? "opacity-40 cursor-not-allowed" : ""}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <p className="text-zinc-600 text-xs mt-1">{toppings.length}/2 selected</p>
              </div>
            )}

            {/* Quantity */}
            {selected === "cupcakes" && (
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Quantity (dozens) *</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => upd("quantity", String(Math.max(1, parseInt(form.quantity) - 1)))}
                    className="w-10 h-10 rounded-full border border-zinc-700 font-black text-lg hover:border-yellow-400 transition-colors flex items-center justify-center">−</button>
                  <span className="text-2xl font-black text-yellow-400 w-8 text-center">{form.quantity}</span>
                  <button onClick={() => upd("quantity", String(parseInt(form.quantity) + 1))}
                    className="w-10 h-10 rounded-full border border-zinc-700 font-black text-lg hover:border-yellow-400 transition-colors flex items-center justify-center">+</button>
                  <span className="text-zinc-500 text-sm">× $36 = <span className="text-yellow-400 font-bold">${(parseInt(form.quantity) * 36).toFixed(2)}</span></span>
                </div>
              </div>
            )}

            {selected === "celebration_pack" && (
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Quantity (packs) *</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => upd("quantity", String(Math.max(1, parseInt(form.quantity) - 1)))}
                    className="w-10 h-10 rounded-full border border-zinc-700 font-black text-lg hover:border-yellow-400 transition-colors flex items-center justify-center">−</button>
                  <span className="text-2xl font-black text-yellow-400 w-8 text-center">{form.quantity}</span>
                  <button onClick={() => upd("quantity", String(parseInt(form.quantity) + 1))}
                    className="w-10 h-10 rounded-full border border-zinc-700 font-black text-lg hover:border-yellow-400 transition-colors flex items-center justify-center">+</button>
                  <span className="text-zinc-500 text-sm">× $100 = <span className="text-yellow-400 font-bold">${(parseInt(form.quantity) * 100).toFixed(2)}</span></span>
                </div>
              </div>
            )}

            {/* Student count for froyo */}
            {selected === "froyo" && (
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Number of Students *</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => upd("student_count", String(Math.max(1, parseInt(form.student_count || "0") - 1)))}
                    className="w-10 h-10 rounded-full border border-zinc-700 font-black text-lg hover:border-teal-400 transition-colors flex items-center justify-center">−</button>
                  <span className="text-2xl font-black text-teal-400 w-8 text-center">{form.student_count || 0}</span>
                  <button onClick={() => upd("student_count", String(parseInt(form.student_count || "0") + 1))}
                    className="w-10 h-10 rounded-full border border-zinc-700 font-black text-lg hover:border-teal-400 transition-colors flex items-center justify-center">+</button>
                  <span className="text-zinc-500 text-sm">× $5 = <span className="text-teal-400 font-bold">${((parseInt(form.student_count || "0")) * 5).toFixed(2)}</span></span>
                </div>
              </div>
            )}

            {/* Purchaser name */}
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Your Name *</label>
              <input type="text" placeholder="Jane Smith" value={form.purchaser_name} onChange={e => upd("purchaser_name", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
            </div>

            {/* Kid's name (cupcakes / pack) */}
            {(selected === "cupcakes" || selected === "celebration_pack") && (
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Child's Name</label>
                <input type="text" placeholder="Birthday kid's name" value={form.kids_name} onChange={e => upd("kids_name", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
              </div>
            )}

            {/* Classroom */}
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Classroom *</label>
              <input type="text" placeholder="e.g. Mrs. Cohen — 3rd Grade" value={form.classroom} onChange={e => upd("classroom", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
            </div>

            {/* Delivery date */}
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Delivery Date * <span className="normal-case font-normal text-zinc-600">(48 hrs minimum)</span></label>
              <input type="date" min={minDeliveryDate()} value={form.delivery_date} onChange={e => upd("delivery_date", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400 text-sm" />
            </div>

            {/* Delivery time */}
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Time Needed *</label>
              <input type="time" value={form.delivery_time} onChange={e => upd("delivery_time", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400 text-sm" />
            </div>

            {/* Special requests */}
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Special Requests</label>
              <textarea placeholder="Allergies or anything we should know…" value={form.special_requests} onChange={e => upd("special_requests", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm resize-none h-20" />
            </div>

            {/* Notice */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-center">
              <p className="text-zinc-400 text-xs font-bold">⚠️ Once purchased, no changes can be made. Please review your order carefully.</p>
            </div>

            {/* Total + checkout */}
            <div className="border-t border-zinc-800 pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-zinc-400">Subtotal</span>
                <span className="font-black text-xl text-yellow-400">${getTotal().toFixed(2)}</span>
              </div>
              {error && <p className="text-red-400 text-sm font-bold mb-3">{error}</p>}
              <button onClick={handleSubmit} disabled={submitting || getTotal() === 0}
                className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black py-4 rounded-full text-base transition-colors">
                {submitting ? "Redirecting to checkout…" : `Pay $${(getTotal() * 1.0825).toFixed(2)} — Secure Checkout →`}
              </button>
              <p className="text-zinc-600 text-xs text-center mt-2">Tax included · Powered by Stripe</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
