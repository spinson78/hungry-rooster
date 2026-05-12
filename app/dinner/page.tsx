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
};

export default function DinnerPage() {
  const [dinner, setDinner] = useState<DinnerMenu | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    special_requests: "",
  });

  useEffect(() => {
    const fetchDinner = async () => {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date();

      const { data } = await supabase
        .from("dinner_menus")
        .select("*")
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(1);

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

    const { error: dbError } = await supabase.from("orders").insert({
      order_type: "dinner",
      menu_id: dinner.id,
      customer_name: form.name,
      customer_email: form.email,
      customer_phone: form.phone,
      customer_address: form.address,
      special_requests: form.special_requests,
      items: [{ name: "Dinner Drop", protein: dinner.protein, side1: dinner.side1, side2: dinner.side2, extra: dinner.extra }],
      total: 85,
      status: "pending",
    });

    if (dbError) {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    // Decrement quantity
    await supabase
      .from("dinner_menus")
      .update({ quantity_remaining: dinner.quantity_remaining - 1 })
      .eq("id", dinner.id);

    // Send notification email
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_type: "dinner",
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email,
        customer_address: form.address,
        special_requests: form.special_requests,
        items: [{ name: "Dinner Drop", protein: dinner.protein, side1: dinner.side1, side2: dinner.side2, extra: dinner.extra }],
        total: 85,
      }),
    });

    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <main className="bg-black text-white min-h-screen flex items-center justify-center">
        <p className="text-zinc-400">Loading tonight's dinner...</p>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="bg-black text-white min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🐓</div>
          <h1 className="text-4xl font-black mb-4">Order received!</h1>
          <p className="text-zinc-400 text-lg mb-2">Fred is on it. We'll be in touch with delivery details.</p>
          <p className="text-zinc-500 text-sm mb-8">Check your phone for a confirmation text.</p>
          <a href="/" className="bg-teal-500 hover:bg-teal-400 text-black font-black px-8 py-4 rounded-full text-lg transition-colors inline-block">
            Back to Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-black text-white min-h-screen">
      {/* NAVBAR */}
      <nav className="bg-black border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <a href="/">
          <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-12 w-auto" />
        </a>
        <a href="/menu" className="bg-teal-500 hover:bg-teal-400 text-black font-black px-5 py-2 rounded-full text-sm transition-colors">
          Full Menu
        </a>
      </nav>

      <div className="px-6 py-12 max-w-2xl mx-auto">
        <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-2">Mon · Tue · Thu</p>
        <h1 className="text-4xl font-black mb-2">The Dinner Drop</h1>
        <p className="text-zinc-400 mb-10">Delivered to your door. $85 flat.</p>

        {!dinner || !isOpen ? (
          <div className="bg-zinc-900 rounded-2xl p-10 border border-zinc-800 text-center">
            <p className="text-2xl font-black mb-3">
              {dinner?.quantity_remaining === 0 ? "Sold out for tonight!" : "Ordering is not open right now."}
            </p>
            <p className="text-zinc-400">Dinner ordering opens at 9PM the night before and closes at 12PM day of.</p>
            <a href="https://instagram.com/thehungryroostertx" target="_blank" className="mt-6 inline-block border-2 border-teal-500 text-teal-400 font-black px-8 py-3 rounded-full hover:bg-teal-500 hover:text-black transition-colors">
              Follow us for the drop
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* MENU CARD */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-3">
                {dinner.day_of_week} — {new Date(dinner.date).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </p>
              <div className="space-y-2 text-lg mb-4">
                <p><span className="text-zinc-400">Protein:</span> <span className="font-bold">{dinner.protein}</span></p>
                <p><span className="text-zinc-400">Side 1:</span> <span className="font-bold">{dinner.side1}</span></p>
                <p><span className="text-zinc-400">Side 2:</span> <span className="font-bold">{dinner.side2}</span></p>
                <p><span className="text-zinc-400">Side 3:</span> <span className="font-bold">{dinner.extra}</span></p>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-700 pt-4">
                <p className="text-teal-400 text-sm font-bold">{dinner.quantity_remaining} remaining · Closes at 12PM</p>
                <p className="text-white font-black text-2xl">$85</p>
              </div>
            </div>

            {/* ORDER FORM */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h2 className="text-xl font-black mb-6">Delivery Info</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="(214) 555-0100"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Email</label>
                  <input
                    type="email"
                    placeholder="jane@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Delivery Address *</label>
                  <input
                    type="text"
                    placeholder="1234 Main St, Dallas, TX 75201"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Special Requests</label>
                  <textarea
                    placeholder="Allergies, gate codes, anything we should know..."
                    value={form.special_requests}
                    onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 resize-none h-20"
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-full text-lg transition-colors mt-6 disabled:opacity-50"
              >
                {submitting ? "Placing order..." : "Place Order — $85"}
              </button>
              <p className="text-zinc-600 text-xs text-center mt-3">Payment collected on delivery. We'll confirm by text.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
