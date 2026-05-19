"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ShabbatMenu = {
  id: string;
  week_of: string;
  protein: string;
  side1: string;
  side2: string;
  extra: string;
  quantity_remaining: number;
  cutoff_time: string;
  is_active: boolean;
};

const SIZES = [
  { label: "2 Person", price: 65, description: "Perfect for two" },
  { label: "4-6 Person", price: 115, description: "The classic box" },
  { label: "10-12 Person", price: 225, description: "Feed the whole table" },
];

export default function ShabbatPage() {
  const [menu, setMenu] = useState<ShabbatMenu | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderType, setOrderType] = useState<"box" | "snackpack" | null>(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellShown, setUpsellShown] = useState(false);
  const [tipAmount, setTipAmount] = useState<number>(0);

  const [selectedSize, setSelectedSize] = useState(SIZES[1]);
  const [addons, setAddons] = useState({
    greens: { selected: false, choice: "Kale" },
    dessert: { selected: false },
    babka: { selected: false, choice: "Chocolate" },
    salmon: { selected: false },
  });

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    special_requests: "",
  });

  useEffect(() => {
    const fetchMenu = async () => {
      const now = new Date();
      const { data } = await supabase
        .from("shabbat_menus")
        .select("*")
        .gte("cutoff_time", now.toISOString())
        .order("cutoff_time", { ascending: true })
        .limit(1);
      if (data && data.length > 0) {
        const shabbat = data[0];
        setMenu(shabbat);
        const cutoff = new Date(shabbat.cutoff_time);
        setIsOpen(shabbat.is_active && now < cutoff && shabbat.quantity_remaining > 0);
      }
      setLoading(false);
    };
    fetchMenu();
  }, []);

  const getTotal = () => {
    if (orderType === "snackpack") return 100;
    let total = selectedSize.price;
    if (addons.greens.selected) total += 15;
    if (addons.dessert.selected) total += 25;
    if (addons.babka.selected) total += 18;
    if (addons.salmon.selected) total += 48;
    return total;
  };

  const buildLineItems = () => {
    if (orderType === "snackpack") {
      return [{ price_data: { currency: "usd", product_data: { name: "Shabbat Snack Pack", description: "Chicken nuggets, potato bourekas, sesame noodles & brownies" }, unit_amount: 10000 }, quantity: 1 }];
    }
    const items = [{ price_data: { currency: "usd", product_data: { name: `Shabbat Box — ${selectedSize.label}`, description: `${menu?.protein}, ${menu?.side1}, ${menu?.side2}, ${menu?.extra}` }, unit_amount: selectedSize.price * 100 }, quantity: 1 }];
    if (addons.greens.selected) items.push({ price_data: { currency: "usd", product_data: { name: `Certified Greens (${addons.greens.choice})`, description: "Choice of kale or romaine" }, unit_amount: 1500 }, quantity: 1 });
    if (addons.dessert.selected) items.push({ price_data: { currency: "usd", product_data: { name: "Friday Night Dessert Add On", description: "Check socials for this week" }, unit_amount: 2500 }, quantity: 1 });
    if (addons.babka.selected) items.push({ price_data: { currency: "usd", product_data: { name: `Signature Babka (${addons.babka.choice})`, description: "Chocolate or cinnamon" }, unit_amount: 1800 }, quantity: 1 });
    if (addons.salmon.selected) items.push({ price_data: { currency: "usd", product_data: { name: "Roasted Salmon Add On (6 filets)", description: "6 x 6oz filets" }, unit_amount: 4800 }, quantity: 1 });
    return items;
  };

  const buildItems = () => {
    if (orderType === "snackpack") return [{ name: "Shabbat Snack Pack", description: "Chicken nuggets, potato bourekas, sesame noodles, brownies" }];
    return [
      { name: `Shabbat Box — ${selectedSize.label}`, protein: menu?.protein, side1: menu?.side1, side2: menu?.side2, extra: menu?.extra },
      ...(addons.greens.selected ? [{ name: `Certified Greens — ${addons.greens.choice}` }] : []),
      ...(addons.dessert.selected ? [{ name: "Friday Night Dessert Add On" }] : []),
      ...(addons.babka.selected ? [{ name: `Signature Babka — ${addons.babka.choice}` }] : []),
      ...(addons.salmon.selected ? [{ name: "Roasted Salmon Add On (6 filets)" }] : []),
    ];
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.address) {
      setError("Please fill in your name, phone, and delivery address.");
      return;
    }
    if (!menu && orderType !== "snackpack") return;

    if (orderType === "box" && !upsellShown) {
      const missingAny = !addons.greens.selected || !addons.babka.selected || !addons.salmon.selected;
      if (missingAny) {
        setUpsellShown(true);
        setShowUpsell(true);
        return;
      }
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/shabbat-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineItems: buildLineItems(),
          tipAmount,
          metadata: {
            order_type: orderType === "snackpack" ? "snackpack" : "shabbat",
            menu_id: menu?.id || "",
            customer_name: form.name,
            customer_phone: form.phone,
            customer_email: form.email,
            customer_address: form.address,
            special_requests: form.special_requests,
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
        <p className="text-zinc-400">Loading this week's Shabbat menu...</p>
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
        <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-2">Every Friday</p>
        <h1 className="text-4xl font-black mb-2">Shabbat Box</h1>
        <p className="text-zinc-400 mb-10">Delivered Friday. Free delivery on orders $100+. Order by Friday 9AM.</p>

        {!isOpen && !menu && (
          <div className="bg-zinc-900 rounded-2xl p-8 border border-yellow-400/30 text-center mb-8">
            <p className="text-3xl mb-3">🌸</p>
            <h2 className="text-2xl font-black mb-2">Chag Sameach!</h2>
            <p className="text-zinc-300 font-bold mb-2">No Shabbat Box this week in honor of Shavuot.</p>
            <p className="text-zinc-500 text-sm">We'll be back next week — follow us on Instagram for the drop announcement.</p>
            <a href="https://instagram.com/thehungryroostertx" target="_blank" className="inline-block mt-6 border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-black px-8 py-3 rounded-full text-sm transition-colors">
              Follow @thehungryroostertx
            </a>
          </div>
        )}

        {!orderType && (
          <div className="space-y-4">
            <p className="text-zinc-300 font-bold mb-4">What would you like to order?</p>
            {isOpen && menu && (
              <button onClick={() => setOrderType("box")} className="w-full bg-zinc-900 border border-zinc-700 hover:border-yellow-400 rounded-2xl p-6 text-left transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-xl mb-1">Shabbat Box</p>
                    <p className="text-zinc-400 text-sm">Protein, 2 sides, side 3 + add-ons available</p>
                    <p className="text-zinc-500 text-xs mt-2">
                      {menu.quantity_remaining === 0 ? <span className="text-red-500 font-black">SOLD OUT</span>
                        : menu.quantity_remaining <= 2 ? <span className="text-red-400 font-bold">Only {menu.quantity_remaining} left</span>
                        : "Available this week"}
                    </p>
                  </div>
                  <span className="text-yellow-400 font-black text-lg">from $65</span>
                </div>
              </button>
            )}
            <button onClick={() => setOrderType("snackpack")} className="w-full bg-zinc-900 border border-zinc-700 hover:border-yellow-400 rounded-2xl p-6 text-left transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-black text-xl mb-1">Shabbat Snack Pack</p>
                  <p className="text-zinc-400 text-sm">Chicken nuggets, potato bourekas, sesame noodles & brownies</p>
                  <p className="text-zinc-500 text-xs mt-2">Can be ordered on its own</p>
                </div>
                <span className="text-yellow-400 font-black text-lg">$100</span>
              </div>
            </button>
            {!isOpen && (
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 text-center">
                <p className="font-bold mb-2">Shabbat Box ordering opens Monday at 9PM</p>
                <p className="text-zinc-500 text-sm">The Snack Pack is available to order anytime above.</p>
              </div>
            )}
          </div>
        )}

        {orderType === "box" && menu && (
          <div className="space-y-6">
            <button onClick={() => setOrderType(null)} className="text-zinc-400 hover:text-white text-sm mb-2">← Back</button>
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-3">This week's menu</p>
              <div className="space-y-1 text-base">
                <p><span className="text-zinc-400">Protein:</span> <span className="font-bold">{menu.protein}</span></p>
                <p><span className="text-zinc-400">Side 1:</span> <span className="font-bold">{menu.side1}</span></p>
                <p><span className="text-zinc-400">Side 2:</span> <span className="font-bold">{menu.side2}</span></p>
                <p><span className="text-zinc-400">Side 3:</span> <span className="font-bold">{menu.extra}</span></p>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <p className="font-bold mb-4 text-sm uppercase tracking-wide text-zinc-300">Choose your size</p>
              <div className="space-y-3">
                {SIZES.map((size) => (
                  <label key={size.label} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${selectedSize.label === size.label ? "border-yellow-400 bg-zinc-800" : "border-zinc-700 hover:border-yellow-400"}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="size" checked={selectedSize.label === size.label} onChange={() => setSelectedSize(size)} className="accent-yellow-400" />
                      <div>
                        <p className="font-bold text-sm">{size.label}</p>
                        <p className="text-zinc-500 text-xs">{size.description}</p>
                      </div>
                    </div>
                    <span className="font-black text-white">${size.price}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <p className="font-bold mb-4 text-sm uppercase tracking-wide text-zinc-300">Add-ons</p>
              <div className="space-y-3">
                <div className={`p-4 rounded-xl border transition-colors ${addons.greens.selected ? "border-yellow-400 bg-zinc-800" : "border-zinc-700"}`}>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={addons.greens.selected} onChange={(e) => setAddons({ ...addons, greens: { ...addons.greens, selected: e.target.checked } })} className="accent-yellow-400" />
                      <div><p className="font-bold text-sm">Certified Greens</p><p className="text-zinc-500 text-xs">Choice of kale or romaine</p></div>
                    </div>
                    <span className="text-zinc-400 text-sm">+$15</span>
                  </label>
                  {addons.greens.selected && (
                    <div className="flex gap-3 mt-3 ml-7">
                      {["Kale", "Romaine"].map((g) => (
                        <label key={g} className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer text-sm transition-colors ${addons.greens.choice === g ? "border-yellow-400 text-yellow-400" : "border-zinc-600 text-zinc-400"}`}>
                          <input type="radio" name="greens" checked={addons.greens.choice === g} onChange={() => setAddons({ ...addons, greens: { ...addons.greens, choice: g } })} className="hidden" />{g}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${addons.dessert.selected ? "border-yellow-400 bg-zinc-800" : "border-zinc-700"}`}>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={addons.dessert.selected} onChange={(e) => setAddons({ ...addons, dessert: { selected: e.target.checked } })} className="accent-yellow-400" />
                    <div><p className="font-bold text-sm">Friday Night Dessert</p><p className="text-zinc-500 text-xs">Check our socials for this week's dessert</p></div>
                  </div>
                  <span className="text-zinc-400 text-sm">+$25</span>
                </label>
                <div className={`p-4 rounded-xl border transition-colors ${addons.babka.selected ? "border-yellow-400 bg-zinc-800" : "border-zinc-700"}`}>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={addons.babka.selected} onChange={(e) => setAddons({ ...addons, babka: { ...addons.babka, selected: e.target.checked } })} className="accent-yellow-400" />
                      <div><p className="font-bold text-sm">Signature Babka</p><p className="text-zinc-500 text-xs">Choice of chocolate or cinnamon</p></div>
                    </div>
                    <span className="text-zinc-400 text-sm">+$18</span>
                  </label>
                  {addons.babka.selected && (
                    <div className="flex gap-3 mt-3 ml-7">
                      {["Chocolate", "Cinnamon"].map((b) => (
                        <label key={b} className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer text-sm transition-colors ${addons.babka.choice === b ? "border-yellow-400 text-yellow-400" : "border-zinc-600 text-zinc-400"}`}>
                          <input type="radio" name="babka" checked={addons.babka.choice === b} onChange={() => setAddons({ ...addons, babka: { ...addons.babka, choice: b } })} className="hidden" />{b}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${addons.salmon.selected ? "border-yellow-400 bg-zinc-800" : "border-zinc-700"}`}>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={addons.salmon.selected} onChange={(e) => setAddons({ ...addons, salmon: { selected: e.target.checked } })} className="accent-yellow-400" />
                    <div><p className="font-bold text-sm">Roasted Salmon Add On</p><p className="text-zinc-500 text-xs">6 x 6oz filets</p></div>
                  </div>
                  <span className="text-zinc-400 text-sm">+$48</span>
                </label>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h2 className="text-xl font-black mb-6">Delivery Info</h2>
              <div className="space-y-4">
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Full Name *</label><input type="text" placeholder="Jane Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" /></div>
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Phone Number *</label><input type="tel" placeholder="(214) 555-0100" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" /></div>
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Email</label><input type="email" placeholder="jane@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" /></div>
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Delivery Address *</label><input type="text" placeholder="1234 Main St, Dallas, TX 75201" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" /></div>
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Special Requests</label><textarea placeholder="Allergies, gate codes, anything we should know..." value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 resize-none h-20" /></div>
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
                <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>${getTotal().toFixed(2)}</span></div>
                <div className="flex justify-between text-zinc-400"><span>Sales Tax (8.25%)</span><span>${(getTotal() * 0.0825).toFixed(2)}</span></div>
                {tipAmount > 0 && <div className="flex justify-between text-teal-400"><span>Driver Tip</span><span>${tipAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-white font-black border-t border-zinc-700 pt-2 mt-2">
                  <span>Total</span><span>${(getTotal() * 1.0825 + tipAmount).toFixed(2)}</span>
                </div>
              </div>
              {getTotal() < 100 && <p className="text-zinc-500 text-xs mt-2">Add more to reach $100 for free delivery.</p>}

              {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
              <button onClick={handleSubmit} disabled={submitting} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-full text-lg transition-colors mt-6 disabled:opacity-50">
                {submitting ? "Redirecting to payment..." : `Pay $${(getTotal() * 1.0825 + tipAmount).toFixed(2)} — Secure Checkout`}
              </button>
              <p className="text-zinc-600 text-xs text-center mt-3">Powered by Stripe. Your card info is never stored on our servers.</p>
            </div>
          </div>
        )}

        {orderType === "snackpack" && (
          <div className="space-y-6">
            <button onClick={() => setOrderType(null)} className="text-zinc-400 hover:text-white text-sm mb-2">← Back</button>
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-3">Shabbat Snack Pack</p>
              <ul className="text-base space-y-1 mb-4">
                <li className="font-bold">Chicken Nuggets</li>
                <li className="font-bold">Potato Bourekas</li>
                <li className="font-bold">Sesame Noodles</li>
                <li className="font-bold">Brownies</li>
              </ul>
              <div className="flex items-center justify-between border-t border-zinc-700 pt-4">
                <p className="text-teal-400 text-sm font-bold">Includes free delivery</p>
                <p className="text-white font-black text-2xl">$100</p>
              </div>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h2 className="text-xl font-black mb-6">Delivery Info</h2>
              <div className="space-y-4">
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Full Name *</label><input type="text" placeholder="Jane Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" /></div>
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Phone Number *</label><input type="tel" placeholder="(214) 555-0100" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" /></div>
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Email</label><input type="email" placeholder="jane@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" /></div>
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Delivery Address *</label><input type="text" placeholder="1234 Main St, Dallas, TX 75201" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" /></div>
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Special Requests</label><textarea placeholder="Gate codes, anything we should know..." value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 resize-none h-20" /></div>
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
                <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>$100.00</span></div>
                <div className="flex justify-between text-zinc-400"><span>Sales Tax (8.25%)</span><span>$8.25</span></div>
                {tipAmount > 0 && <div className="flex justify-between text-teal-400"><span>Driver Tip</span><span>${tipAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-white font-black border-t border-zinc-700 pt-2 mt-2">
                  <span>Total</span><span>${(108.25 + tipAmount).toFixed(2)}</span>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
              <button onClick={handleSubmit} disabled={submitting} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-full text-lg transition-colors mt-6 disabled:opacity-50">
                {submitting ? "Redirecting to payment..." : `Pay $${(108.25 + tipAmount).toFixed(2)} — Secure Checkout`}
              </button>
              <p className="text-zinc-600 text-xs text-center mt-3">Powered by Stripe. Your card info is never stored on our servers.</p>
            </div>
          </div>
        )}
      </div>

      {showUpsell && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <img src="/THR%20round%20final.png" alt="The Hungry Rooster" className="w-20 mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-2">Shabbat Shalom!</h2>
            <p className="text-zinc-300 font-bold mb-1">Is your table complete?</p>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">Don't forget — you can add our Certified Greens, Signature Babka, and Roasted Salmon to complete your Shabbat spread.</p>
            <div className="space-y-3 mb-6 text-left">
              {!addons.greens.selected && (
                <button onClick={() => { setAddons({ ...addons, greens: { ...addons.greens, selected: true } }); setShowUpsell(false); }} className="w-full flex items-center justify-between bg-zinc-800 hover:border-yellow-400 border border-zinc-700 rounded-xl px-4 py-3 transition-colors">
                  <span className="font-bold text-sm">Add Certified Greens</span><span className="text-yellow-400 font-black text-sm">+$15</span>
                </button>
              )}
              {!addons.babka.selected && (
                <button onClick={() => { setAddons({ ...addons, babka: { ...addons.babka, selected: true } }); setShowUpsell(false); }} className="w-full flex items-center justify-between bg-zinc-800 hover:border-yellow-400 border border-zinc-700 rounded-xl px-4 py-3 transition-colors">
                  <span className="font-bold text-sm">Add Signature Babka</span><span className="text-yellow-400 font-black text-sm">+$18</span>
                </button>
              )}
              {!addons.salmon.selected && (
                <button onClick={() => { setAddons({ ...addons, salmon: { selected: true } }); setShowUpsell(false); }} className="w-full flex items-center justify-between bg-zinc-800 hover:border-yellow-400 border border-zinc-700 rounded-xl px-4 py-3 transition-colors">
                  <span className="font-bold text-sm">Add Roasted Salmon (6 filets)</span><span className="text-yellow-400 font-black text-sm">+$48</span>
                </button>
              )}
            </div>
            <button onClick={() => { setShowUpsell(false); handleSubmit(); }} className="w-full border-2 border-zinc-600 hover:border-zinc-400 text-zinc-300 font-bold py-3 rounded-full text-sm transition-colors">
              No thanks — proceed to payment
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
