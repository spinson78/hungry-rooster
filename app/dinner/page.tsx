"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

export default function DinnerPage() {
  const [dinner, setDinner] = useState<DinnerMenu | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", special_requests: "", sms_opted_in: false });
  const [tipAmount, setTipAmount] = useState<number>(0);

  useEffect(() => {
    const fetchDinner = async () => {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date();
      const { data } = await supabase.from("dinner_menus").select("*").gte("date", today).order("date", { ascending: true }).limit(1);
      if (data && data.length > 0) {
        const menu = data[0];
        setDinner(menu);
        const reveal = new Date(menu.reveal_time);
        const cutoff = new Date(menu.cutoff_time);
        setIsOpen(now >= reveal && now < cutoff && menu.quantity_remaining > 0);
      }
      setLoading(false);
    };
    fetchDinner();
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.address) {
      setError("Please fill in your name, phone, and delivery address.");
      return;
    }
    if (!dinner) return;
    setSubmitting(true);
    setError("");

    try {
      const dinnerLabel = `${dinner.protein} · ${dinner.side1} · ${dinner.side2} · ${dinner.extra}`;
      const items = [{ name: "Dinner Drop", protein: dinner.protein, side1: dinner.side1, side2: dinner.side2, extra: dinner.extra }];

      const res = await fetch("/api/dinner-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dinnerLabel,
          price: dinner.price || 85,
          tipAmount,
          metadata: {
            order_type: "dinner",
            menu_id: dinner.id,
            customer_name: form.name,
            customer_phone: form.phone,
            customer_email: form.email,
            customer_address: form.address,
            special_requests: form.special_requests,
            sms_opted_in: form.sms_opted_in,
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

  if (loading) {
    return (
      <main className="bg-black text-white min-h-screen flex items-center justify-center">
        <p className="text-zinc-400">Loading tonight's dinner...</p>
      </main>
    );
  }

  return (
    <main className="bg-black text-white min-h-screen">
      <nav className="bg-black border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <a href="/"><img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-12 w-auto" /></a>
        <a href="/menu" className="bg-teal-500 hover:bg-teal-400 text-black font-black px-5 py-2 rounded-full text-sm transition-colors">Full Menu</a>
      </nav>

      <div className="px-6 py-12 max-w-2xl mx-auto">
        <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-2">Mon · Tue · Thu</p>
        <h1 className="text-4xl font-black mb-2">The Dinner Drop</h1>
        <p className="text-zinc-400 mb-10">Delivered to your door. ${dinner?.price || 85} flat.</p>

        {!dinner || !isOpen ? (
          <div className="bg-zinc-900 rounded-2xl p-10 border border-zinc-800 text-center">
            <p className="text-2xl font-black mb-3">
              {dinner?.quantity_remaining === 0 ? "Sold out for tonight!" : "Ordering is not open right now."}
            </p>
            <p className="text-zinc-400 mb-6">Dinner ordering opens at 9PM the night before and closes at 12PM day of.</p>
            <a href="https://instagram.com/thehungryroostertx" target="_blank" className="inline-block border-2 border-teal-500 text-teal-400 font-black px-8 py-3 rounded-full hover:bg-teal-500 hover:text-black transition-colors">
              Follow us for the drop
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-3">
                {dinner.day_of_week} — {new Date(dinner.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </p>
              <div className="space-y-2 text-lg mb-4">
                <p><span className="text-zinc-400">Protein:</span> <span className="font-bold">{dinner.protein}</span></p>
                <p><span className="text-zinc-400">Side 1:</span> <span className="font-bold">{dinner.side1}</span></p>
                <p><span className="text-zinc-400">Side 2:</span> <span className="font-bold">{dinner.side2}</span></p>
                <p><span className="text-zinc-400">Side 3:</span> <span className="font-bold">{dinner.extra}</span></p>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-700 pt-4">
                <p className="text-teal-400 text-sm font-bold">{dinner.quantity_remaining} remaining · Closes at 12PM</p>
                <p className="text-white font-black text-2xl">${dinner.price || 85}</p>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h2 className="text-xl font-black mb-6">Delivery Info</h2>
              <div className="space-y-4">
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Full Name *</label><input type="text" placeholder="Jane Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500" /></div>
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Phone Number *</label><input type="tel" placeholder="(214) 555-0100" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500" /></div>
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Email</label><input type="email" placeholder="jane@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500" /></div>
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Delivery Address *</label><input type="text" placeholder="1234 Main St, Dallas, TX 75201" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500" /></div>
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Special Requests</label><textarea placeholder="Allergies, gate codes, anything we should know..." value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 resize-none h-20" /></div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.sms_opted_in} onChange={(e) => setForm({ ...form, sms_opted_in: e.target.checked })} className="mt-1 w-4 h-4 accent-teal-500 cursor-pointer" />
                  <span className="text-sm text-zinc-400">Text me order updates and weekly specials</span>
                </label>
              </div>
              {/* TIP */}
              <div className="mt-6">
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

              {/* ORDER SUMMARY */}
              <div className="mt-4 bg-zinc-800 rounded-xl p-4 text-sm space-y-1">
                <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>${(dinner?.price || 85).toFixed(2)}</span></div>
                <div className="flex justify-between text-zinc-400"><span>Sales Tax (8.25%)</span><span>${((dinner?.price || 85) * 0.0825).toFixed(2)}</span></div>
                {tipAmount > 0 && <div className="flex justify-between text-teal-400"><span>Driver Tip</span><span>${tipAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-white font-black border-t border-zinc-700 pt-2 mt-2">
                  <span>Total</span>
                  <span>${((dinner?.price || 85) * 1.0825 + tipAmount).toFixed(2)}</span>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
              <button onClick={handleSubmit} disabled={submitting} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-full text-lg transition-colors mt-6 disabled:opacity-50">
                {submitting ? "Redirecting to payment..." : `Pay $${((dinner?.price || 85) * 1.0825 + tipAmount).toFixed(2)} \u2014 Secure Checkout`}
              </button>
              <p className="text-zinc-600 text-xs text-center mt-3">Powered by Stripe. Your card info is never stored on our servers.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
