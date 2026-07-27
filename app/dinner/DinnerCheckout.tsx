"use client";
import { useEffect, useState, useRef } from "react";

type DinnerMenu = {
  id: string;
  date: string;
  day_of_week: string;
  protein: string;
  side1: string;
  side2: string;
  extra: string;
  quantity_remaining: number;
  reveal_time: string;
  cutoff_time: string;
  price?: number;
};

function getRevealForDinner(dinner: DinnerMenu) {
  const d = new Date(dinner.date + "T12:00:00");
  const daysSinceSunday = d.getDay();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - daysSinceSunday);
  sunday.setHours(10, 0, 0, 0);
  sunday.setSeconds(0, 0);
  return sunday;
}

function getCutoff(dinner: DinnerMenu) {
  if (dinner.cutoff_time) return new Date(dinner.cutoff_time);
  return new Date(dinner.date + "T12:00:00");
}

function formatCountdown(ms: number) {
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function DinnerCheckout({ initialDinners }: { initialDinners: DinnerMenu[] }) {
  const [dinners] = useState<DinnerMenu[]>(initialDinners);
  const [now, setNow] = useState(new Date());
  const [selectedDinner, setSelectedDinner] = useState<DinnerMenu | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", special_requests: "", sms_opted_in: false,
  });
  const [tipAmount, setTipAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const isRevealed = (dinner: DinnerMenu) => now >= getRevealForDinner(dinner);
  const isClosed = (dinner: DinnerMenu) => now >= getCutoff(dinner);
  const isOrderable = (dinner: DinnerMenu) =>
    isRevealed(dinner) && !isClosed(dinner) && dinner.quantity_remaining > 0;

  const nextOpenDinner = dinners
    .filter((d) => isOrderable(d))
    .sort((a, b) => getCutoff(a).getTime() - getCutoff(b).getTime())[0];
  const countdownMs = nextOpenDinner ? getCutoff(nextOpenDinner).getTime() - now.getTime() : 0;
  const countdown = formatCountdown(countdownMs);

  const price = selectedDinner?.price || 85;
  const subtotal = price * quantity;
  const tax = subtotal * 0.0825;
  const total = subtotal + tax + tipAmount;

  const handleOrderClick = (dinner: DinnerMenu) => {
    setSelectedDinner(dinner);
    setQuantity(1);
    setError("");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.address) {
      setError("Please fill in your name, phone, and delivery address.");
      return;
    }
    if (!selectedDinner) return;
    setSubmitting(true);
    setError("");

    try {
      const dinnerLabel = `${selectedDinner.protein} · ${selectedDinner.side1} · ${selectedDinner.side2} · ${selectedDinner.extra}`;
      const items = Array.from({ length: quantity }, () => ({
        name: "Dinner Drop",
        protein: selectedDinner.protein,
        side1: selectedDinner.side1,
        side2: selectedDinner.side2,
        extra: selectedDinner.extra,
      }));

      const res = await fetch("/api/dinner-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dinnerLabel,
          price: selectedDinner.price || 85,
          quantity,
          tipAmount,
          metadata: {
            order_type: "dinner",
            menu_id: selectedDinner.id,
            customer_name: form.name,
            customer_phone: form.phone,
            customer_email: form.email,
            customer_address: form.address,
            special_requests: form.special_requests,
            sms_opted_in: String(form.sms_opted_in),
            quantity: String(quantity),
            items: JSON.stringify(items),
          },
        }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Countdown */}
      {countdown && nextOpenDinner && (
        <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-5 py-2 mb-10">
          <span className="text-yellow-400 text-sm">⏱</span>
          <span className="text-yellow-400 text-sm font-bold">
            {nextOpenDinner.day_of_week} closes in {countdown}
          </span>
        </div>
      )}

      {/* Dinner Cards */}
      {dinners.length === 0 ? (
        <div className="bg-zinc-900 rounded-2xl p-10 border border-zinc-800 text-center mb-8">
          <p className="text-2xl font-black mb-3">No dinners posted yet this week</p>
          <p className="text-zinc-400 mb-6">Check back Sunday at 10 AM to see what&apos;s cooking.</p>
          <a href="https://instagram.com/thehungryroostertx" target="_blank" className="inline-block border-2 border-teal-500 text-teal-400 font-black px-8 py-3 rounded-full hover:bg-teal-500 hover:text-black transition-colors">
            Follow us for updates
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {dinners.map((dinner) => {
            const orderable = isOrderable(dinner);
            const closed = isClosed(dinner);
            const soldOut = dinner.quantity_remaining === 0;
            const revealed = isRevealed(dinner);
            const isSelected = selectedDinner?.id === dinner.id;
            const cutoffMs = getCutoff(dinner).getTime() - now.getTime();
            const dinnerCountdown = orderable ? formatCountdown(cutoffMs) : null;

            return (
              <div
                key={dinner.id}
                className={`bg-zinc-900 rounded-2xl p-6 border transition-all flex flex-col ${
                  isSelected ? "border-teal-500 shadow-lg shadow-teal-500/10" : "border-zinc-800"
                }`}
              >
                <div className="mb-4">
                  <p className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-1">
                    {dinner.day_of_week} — {new Date(dinner.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                  </p>

                  {revealed ? (
                    <div className="space-y-2 mt-3">
                      <div>
                        <p className="text-zinc-500 text-xs uppercase tracking-wide">Protein</p>
                        <p className="font-bold text-base">{dinner.protein}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-xs uppercase tracking-wide">Side 1</p>
                        <p className="font-semibold text-sm">{dinner.side1}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-xs uppercase tracking-wide">Side 2</p>
                        <p className="font-semibold text-sm">{dinner.side2}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-xs uppercase tracking-wide">Side 3</p>
                        <p className="font-semibold text-sm">{dinner.extra}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 py-6 text-center">
                      <p className="text-zinc-500 text-sm">Menu drops Sunday at 10 AM</p>
                    </div>
                  )}
                </div>

                <div className="mt-auto border-t border-zinc-800 pt-4">
                  <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
                    <span>🕒 Delivery 3–5 PM</span>
                    <span>${dinner.price || 85} / meal</span>
                  </div>

                  {closed ? (
                    <div className="w-full bg-zinc-800 text-zinc-500 font-bold py-3 rounded-full text-center text-sm">
                      Ordering Closed
                    </div>
                  ) : soldOut ? (
                    <div className="w-full bg-zinc-800 text-zinc-500 font-bold py-3 rounded-full text-center text-sm">
                      Sold Out
                    </div>
                  ) : !revealed ? (
                    <div className="w-full bg-zinc-800 text-zinc-500 font-bold py-3 rounded-full text-center text-sm">
                      Opens Sunday 10 AM
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOrderClick(dinner)}
                      className={`w-full font-black py-3 rounded-full text-sm transition-colors ${
                        isSelected
                          ? "bg-teal-500 text-black"
                          : "bg-yellow-400 hover:bg-yellow-300 text-black"
                      }`}
                    >
                      {isSelected ? "✓ Selected" : "Order Now"}
                    </button>
                  )}

                  {orderable && dinnerCountdown && (
                    <p className="text-zinc-600 text-xs text-center mt-2">
                      {dinner.quantity_remaining} left · closes {dinner.day_of_week} at noon
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Form */}
      {selectedDinner && (
        <div ref={formRef} className="bg-zinc-900 rounded-2xl border border-teal-500/30 p-6 space-y-6 scroll-mt-24">
          <div>
            <h2 className="text-2xl font-black mb-1">Your Order</h2>
            <p className="text-teal-400 text-sm font-semibold">
              {selectedDinner.day_of_week} · {selectedDinner.protein} · {selectedDinner.side1} · {selectedDinner.side2} · {selectedDinner.extra}
            </p>
            <button
              onClick={() => setSelectedDinner(null)}
              className="text-zinc-600 text-xs mt-1 hover:text-zinc-400 transition-colors"
            >
              ← Change dinner
            </button>
          </div>

          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wide mb-3 block">How many meals?</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuantity(q)}
                  className={`flex-1 py-3 rounded-xl font-black text-xl transition-colors ${
                    quantity === q ? "bg-teal-500 text-black" : "bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-black">Delivery Info</h3>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Full Name *</label>
              <input type="text" placeholder="Jane Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Phone Number *</label>
              <input type="tel" placeholder="(214) 555-0100" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Email</label>
              <input type="email" placeholder="jane@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Delivery Address *</label>
              <input type="text" placeholder="1234 Main St, Dallas, TX 75201" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Special Requests</label>
              <textarea placeholder="Allergies, gate codes, anything we should know..." value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 resize-none h-20" />
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.sms_opted_in} onChange={(e) => setForm({ ...form, sms_opted_in: e.target.checked })} className="mt-1 w-4 h-4 accent-teal-500 cursor-pointer" />
              <span className="text-sm text-zinc-400">Yes, send me order confirmations and special offers via text. Msg frequency varies. Reply STOP to cancel. Msg and data rates may apply. <a href="/privacy" className="underline text-teal-400">Privacy Policy</a></span>
            </label>
          </div>

          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wide mb-2 block">Driver Tip (optional)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={tipAmount || ""}
                onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="bg-zinc-800 rounded-xl p-4 text-sm space-y-1.5">
            <div className="flex justify-between text-zinc-400">
              <span>${price} × {quantity} meal{quantity > 1 ? "s" : ""}</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Sales Tax (8.25%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            {tipAmount > 0 && (
              <div className="flex justify-between text-teal-400">
                <span>Driver Tip</span>
                <span>${tipAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-black border-t border-zinc-700 pt-2 mt-2 text-base">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-full text-lg transition-colors disabled:opacity-50"
          >
            {submitting ? "Redirecting to payment..." : `Pay $${total.toFixed(2)} — Secure Checkout`}
          </button>
          <p className="text-zinc-600 text-xs text-center">Powered by Stripe. Your card info is never stored on our servers.</p>
        </div>
      )}
    </>
  );
}
