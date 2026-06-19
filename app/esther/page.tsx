"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type BakeryItem = {
  name: string;
  price: number;
  description: string;
  quantity?: number | null;
};

type BakeryMenu = {
  id: string;
  week_of: string;
  items: BakeryItem[];
  quantity_remaining: number;
  cutoff_time: string;
  is_active: boolean;
};

const MIN_ORDER = 50;

const SHABBAT_ADDONS = [
  { name: "House Greens Salad", price: 15, description: "Fresh house salad" },
  { name: "Roasted Salmon (6 pcs)", price: 48, description: "6 pieces of roasted salmon" },
  { name: "Roasted Chicken", price: 36, description: "Whole roasted chicken" },
  { name: "Chicken Nuggets", price: 28, description: "Crispy chicken nuggets" },
  { name: "Bourekas", price: 18, description: "Freshly baked bourekas" },
];

export default function EstherPage() {
  const [menu, setMenu] = useState<BakeryMenu | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addons, setAddons] = useState<Record<string, number>>({});

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    special_requests: "",
    sms_opted_in: false,
  });

  useEffect(() => {
    const fetchMenu = async () => {
      const now = new Date();
      const { data } = await supabase
        .from("bakery_menus")
        .select("*")
        .gte("cutoff_time", now.toISOString())
        .order("cutoff_time", { ascending: true })
        .limit(1);
      if (data && data.length > 0) {
        const m = data[0];
        setMenu(m);
        const cutoff = new Date(m.cutoff_time);
        setIsOpen(m.is_active && now < cutoff && m.quantity_remaining > 0);
      }
      setLoading(false);
    };
    fetchMenu();
  }, []);

  const setQty = (itemName: string, delta: number, maxQty: number | null | undefined) => {
    setQuantities((prev) => {
      const current = prev[itemName] || 0;
      const next = current + delta;
      if (next < 0) return prev;
      if (maxQty != null && next > maxQty) return prev;
      if (next === 0) {
        const updated = { ...prev };
        delete updated[itemName];
        return updated;
      }
      return { ...prev, [itemName]: next };
    });
  };

  const getBakerySubtotal = () => {
    if (!menu) return 0;
    return menu.items.reduce((sum, item) => {
      const qty = quantities[item.name] || 0;
      return sum + item.price * qty;
    }, 0);
  };

  const getAddonSubtotal = () =>
    SHABBAT_ADDONS.reduce((sum, a) => sum + (addons[a.name] || 0) * a.price, 0);

  const subtotal = getBakerySubtotal() + getAddonSubtotal();
  const meetsMinimum = subtotal >= MIN_ORDER;

  const buildLineItems = () => {
    if (!menu) return [];
    const bakeryItems = menu.items
      .filter((item) => (quantities[item.name] || 0) > 0)
      .map((item) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.name, description: item.description || "Esther's Friday Bakery" },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: quantities[item.name],
      }));
    const addonItems = SHABBAT_ADDONS
      .filter((a) => (addons[a.name] || 0) > 0)
      .map((a) => ({
        price_data: {
          currency: "usd",
          product_data: { name: a.name, description: a.description },
          unit_amount: Math.round(a.price * 100),
        },
        quantity: addons[a.name],
      }));
    return [...bakeryItems, ...addonItems];
  };

  const buildItems = () => {
    if (!menu) return [];
    const bakery = menu.items
      .filter((item) => (quantities[item.name] || 0) > 0)
      .map((item) => ({ name: item.name, description: item.description, quantity: quantities[item.name] }));
    const addonList = SHABBAT_ADDONS
      .filter((a) => (addons[a.name] || 0) > 0)
      .map((a) => ({ name: a.name, description: a.description, quantity: addons[a.name] }));
    return [...bakery, ...addonList];
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.address) {
      setError("Please fill in your name, phone, and delivery address.");
      return;
    }
    if (!meetsMinimum) {
      setError(`Minimum order is $${MIN_ORDER}. Add more items to continue.`);
      return;
    }
    if (!menu) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/bakery-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineItems: buildLineItems(),
          tipAmount,
          metadata: {
            order_type: "bakery",
            menu_id: menu.id,
            customer_name: form.name,
            customer_phone: form.phone,
            customer_email: form.email,
            customer_address: form.address,
            special_requests: form.special_requests,
            sms_opted_in: form.sms_opted_in,
            items: JSON.stringify(buildItems()),
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
        <p className="text-zinc-400">Loading this week's bakery menu...</p>
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
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
          <a href="/shabbat" className="hover:text-white transition-colors">Shabbat Box</a>
          <a href="/dinner" className="hover:text-white transition-colors">Dinner Drop</a>
        </div>
        <a href="/shabbat" className="text-zinc-400 hover:text-white font-bold text-sm transition-colors">
          ← Shabbat Box
        </a>
      </nav>

      <div className="px-6 py-12 max-w-2xl mx-auto">

        {/* HEADER */}
        <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-2">Every Friday</p>
        <h1 className="text-4xl font-black mb-1">Esther's Friday Bakery</h1>
        <p className="text-zinc-400 mb-2">Fresh-baked and delivered Friday. Order by Friday 9AM.</p>
        <p className="text-zinc-500 text-sm mb-10">
          Orders open Monday at 9PM with the Shabbat menu. Minimum order ${MIN_ORDER}.
        </p>

        {/* CLOSED STATE */}
        {!isOpen && !menu && (
          <div className="bg-zinc-900 rounded-2xl p-8 border border-yellow-400/30 text-center mb-8">
            <p className="text-3xl mb-3">🥐</p>
            <h2 className="text-2xl font-black mb-2">Orders Open Monday at 9PM</h2>
            <p className="text-zinc-300 font-bold mb-2">This week's bakery menu isn't live yet.</p>
            <p className="text-zinc-500 text-sm">Check back Monday evening — orders open alongside the Shabbat Box menu.</p>
            <a href="/shabbat" className="inline-block mt-6 border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-black px-8 py-3 rounded-full text-sm transition-colors">
              Order Shabbat Box
            </a>
          </div>
        )}

        {/* MENU + ORDER FORM */}
        {isOpen && menu && menu.items && menu.items.length > 0 && (
          <div className="space-y-6">

            {/* THIS WEEK'S BAKERY ITEMS */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-1">This Week's Bakery</p>
              <p className="text-zinc-500 text-xs mb-5">Add quantities — minimum ${MIN_ORDER} to order.</p>
              <div className="space-y-3">
                {menu.items.map((item) => {
                  const soldOut = item.quantity != null && item.quantity === 0;
                  const qty = quantities[item.name] || 0;
                  const maxQty = item.quantity ?? null;
                  const atMax = maxQty != null && qty >= maxQty;
                  return (
                    <div
                      key={item.name}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                        soldOut
                          ? "border-zinc-800 opacity-40"
                          : qty > 0
                          ? "border-yellow-400 bg-zinc-800"
                          : "border-zinc-700"
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-bold text-sm">
                          {item.name}
                          {soldOut && <span className="text-red-400 font-black text-xs ml-2">SOLD OUT</span>}
                        </p>
                        {item.description && <p className="text-zinc-500 text-xs">{item.description}</p>}
                        {!soldOut && maxQty != null && maxQty > 0 && maxQty <= 3 && (
                          <p className="text-red-400 text-xs font-bold">Only {maxQty} left</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-zinc-300 font-black text-sm">${item.price.toFixed(2)}</span>
                        {!soldOut && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setQty(item.name, -1, maxQty)}
                              disabled={qty === 0}
                              className="w-8 h-8 rounded-full border border-zinc-600 text-zinc-300 font-black text-lg leading-none flex items-center justify-center hover:border-yellow-400 hover:text-yellow-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              −
                            </button>
                            <span className="w-5 text-center font-black text-sm text-white">{qty}</span>
                            <button
                              onClick={() => setQty(item.name, 1, maxQty)}
                              disabled={atMax}
                              className="w-8 h-8 rounded-full border border-zinc-600 text-zinc-300 font-black text-lg leading-none flex items-center justify-center hover:border-yellow-400 hover:text-yellow-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* MINIMUM INDICATOR */}
              <div className="mt-4 flex items-center justify-between">
                <p className={`text-sm font-bold ${meetsMinimum ? "text-teal-400" : "text-zinc-500"}`}>
                  {meetsMinimum
                    ? `✓ Minimum met — great selection!`
                    : `$${(MIN_ORDER - subtotal).toFixed(2)} more to reach the $${MIN_ORDER} minimum`}
                </p>
                <p className="text-white font-black">${subtotal.toFixed(2)}</p>
              </div>
            </div>

            {/* SHABBAT ADD-ONS */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-1">Shabbat Add-Ons</p>
              <p className="text-zinc-500 text-xs mb-4">Mix and match to reach your $50 minimum.</p>
              <div className="space-y-3">
                {SHABBAT_ADDONS.map((addon) => {
                  const qty = addons[addon.name] || 0;
                  return (
                    <div
                      key={addon.name}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${qty > 0 ? "border-teal-400 bg-teal-400/10" : "border-zinc-700"}`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-bold text-sm">{addon.name}</p>
                        <p className="text-zinc-500 text-xs">{addon.description}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-zinc-300 font-black text-sm">${addon.price.toFixed(2)}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setAddons((prev) => {
                              const next = (prev[addon.name] || 0) - 1;
                              if (next <= 0) { const u = { ...prev }; delete u[addon.name]; return u; }
                              return { ...prev, [addon.name]: next };
                            })}
                            disabled={qty === 0}
                            className="w-8 h-8 rounded-full border border-zinc-600 text-zinc-300 font-black text-lg leading-none flex items-center justify-center hover:border-teal-400 hover:text-teal-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >−</button>
                          <span className="w-5 text-center font-black text-sm text-white">{qty}</span>
                          <button
                            onClick={() => setAddons((prev) => ({ ...prev, [addon.name]: (prev[addon.name] || 0) + 1 }))}
                            className="w-8 h-8 rounded-full border border-zinc-600 text-zinc-300 font-black text-lg leading-none flex items-center justify-center hover:border-teal-400 hover:text-teal-400 transition-colors"
                          >+</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DELIVERY INFO */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h2 className="text-xl font-black mb-6">Delivery Info</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Full Name *</label>
                  <input type="text" placeholder="Jane Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Phone Number *</label>
                  <input type="tel" placeholder="(214) 555-0100" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Email</label>
                  <input type="email" placeholder="jane@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Delivery Address *</label>
                  <input type="text" placeholder="1234 Main St, Dallas, TX 75201" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Special Requests</label>
                  <textarea placeholder="Allergies, gate codes, anything we should know..." value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 resize-none h-20" />
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.sms_opted_in} onChange={(e) => setForm({ ...form, sms_opted_in: e.target.checked })} className="mt-1 w-4 h-4 accent-yellow-400 cursor-pointer" />
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
                <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-zinc-400"><span>Sales Tax (8.25%)</span><span>${(subtotal * 0.0825).toFixed(2)}</span></div>
                {tipAmount > 0 && <div className="flex justify-between text-teal-400"><span>Driver Tip</span><span>${tipAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-white font-black border-t border-zinc-700 pt-2 mt-2">
                  <span>Total</span><span>${(subtotal * 1.0825 + tipAmount).toFixed(2)}</span>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={submitting || !meetsMinimum || subtotal === 0}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-full text-lg transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? "Redirecting to payment..."
                  : subtotal === 0
                  ? "Add items to continue"
                  : !meetsMinimum
                  ? `Add $${(MIN_ORDER - subtotal).toFixed(2)} more to checkout`
                  : `Pay $${(subtotal * 1.0825 + tipAmount).toFixed(2)} — Secure Checkout`}
              </button>
              <p className="text-zinc-600 text-xs text-center mt-3">Powered by Stripe. Your card info is never stored on our servers.</p>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 px-6 py-10 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-8 w-auto opacity-50" />
          <p className="text-zinc-600 text-xs text-center">
            Esther is a Hungry Rooster concept. Dallas, TX.
          </p>
          <a href="/" className="text-zinc-400 hover:text-white text-sm font-bold transition-colors">
            ← Back to The Hungry Rooster
          </a>
        </div>
      </footer>

    </main>
  );
}
