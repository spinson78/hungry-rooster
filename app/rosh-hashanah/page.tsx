"use client";
import { useState } from "react";
import SimanimPopup from "@/app/components/SimanimPopup";

// ── Menu data ──────────────────────────────────────────────────────────────

const BOX_SIZES = [
  { id: "box_2", label: "2 Person", price: 65, description: "Serves 2" },
  { id: "box_4", label: "4–6 Person", price: 115, description: "Serves 4–6" },
  { id: "box_10", label: "10–12 Person", price: 225, description: "Serves 10–12" },
];

const BOX_CONTENTS = [
  "2 Fresh Round Challahs",
  "Honey Herb Roasted Chicken",
  "Glazed Sweet Potatoes & Carrots",
  "Garlicky Green Beans",
  "Apple, Pomegranate & Greens Salad",
];

type AddonItem = { id: string; label: string; detail?: string; price: number };
type AddonCategory = { label: string; emoji: string; items: AddonItem[] };

const ADDON_CATEGORIES: AddonCategory[] = [
  {
    label: "Dessert",
    emoji: "🍎",
    items: [
      { id: "apple_blondies", label: "Apple Blondies", price: 25 },
    ],
  },
  {
    label: "Sweets & Pastries",
    emoji: "🍰",
    items: [
      { id: "honey_cake", label: "Honey Cake", price: 25 },
      { id: "apple_pie", label: "Apple Pie", price: 25 },
      { id: "apple_crumb_cake", label: "Apple Crumb Cake", price: 25 },
      { id: "brioche_buns", label: "Caramel Apple Brioche Buns", price: 25 },
      { id: "honey_apple_babka", label: "Honey Apple Babka", price: 25 },
      { id: "chocolate_babka", label: "Chocolate Babka", price: 18 },
      { id: "cinnamon_babka", label: "Cinnamon Babka", price: 18 },
    ],
  },
  {
    label: "Specialty Challahs",
    emoji: "🍞",
    items: [
      { id: "apple_stuffed_challah", label: "Apple-Stuffed Crumb Challah", price: 9.50 },
      { id: "onion_challah", label: "Caramelized Onion & Garlic Stuffed Challah", price: 9.50 },
    ],
  },
  {
    label: "Savory",
    emoji: "🍽️",
    items: [
      { id: "salmon", label: "Honey Pomegranate Roasted Salmon", detail: "6 pc", price: 60 },
      { id: "jeweled_rice", label: "Jeweled Rice", price: 30 },
      { id: "roasted_veg", label: "Roasted Seasonal Vegetables", price: 25 },
      { id: "noodle_kugel", label: "Sweet Apple Noodle Kugel", price: 25 },
      { id: "brisket", label: "Honey BBQ Brisket", detail: "6 servings", price: 45 },
      { id: "chicken_breast", label: "Honey Apple Chicken Breast", detail: "6 pc", price: 45 },
      { id: "nuggets", label: "Signature Rooster Nuggets", price: 30 },
      { id: "dip_clique", label: "Holiday Dip Clique", price: 25 },
    ],
  },
];

// Standalone — rendered as the page closer, not in the add-on list
const SIMANIM = { id: "focaccia_board", label: "Edible Focaccia Simanim Board", price: 200 };

// ── Cutoff / delivery helpers ───────────────────────────────────────────────

const CUTOFF = new Date("2026-09-10T05:00:00Z"); // midnight Sep 9 CDT
const DELIVERY = "Friday, September 11, 2026";

function isClosed(): boolean {
  return new Date() >= CUTOFF;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function RoshHashanahPage() {
  const [boxQtys, setBoxQtys] = useState<Record<string, number>>({});
  const [addonQtys, setAddonQtys] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", special_requests: "" });
  const [tipAmount, setTipAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellShown, setUpsellShown] = useState(false);

  const closed = isClosed();

  // ── Totals ────────────────────────────────────────────────────────────────

  const boxTotal = BOX_SIZES.reduce((sum, b) => sum + b.price * (boxQtys[b.id] || 0), 0);
  const addonTotal = ADDON_CATEGORIES.flatMap(c => c.items).reduce(
    (sum, a) => sum + a.price * (addonQtys[a.id] || 0), 0
  );
  const simanimQty = addonQtys[SIMANIM.id] || 0;
  const subtotal = boxTotal + addonTotal + SIMANIM.price * simanimQty;
  const tax = subtotal * 0.0825;
  const grandTotal = subtotal + tax + tipAmount;
  const totalBoxes = Object.values(boxQtys).reduce((a, b) => a + b, 0);

  const adjustBox = (id: string, delta: number) =>
    setBoxQtys(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));

  const adjustAddon = (id: string, delta: number) =>
    setAddonQtys(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));

  // ── Build Stripe line items ────────────────────────────────────────────────

  const buildLineItems = () => {
    const items: { price_data: { currency: string; product_data: { name: string; description: string }; unit_amount: number }; quantity: number }[] = [];

    BOX_SIZES.forEach(b => {
      const qty = boxQtys[b.id] || 0;
      if (qty > 0) items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `Rosh Hashanah Box — ${b.label}`,
            description: BOX_CONTENTS.join(", "),
          },
          unit_amount: b.price * 100,
        },
        quantity: qty,
      });
    });

    ADDON_CATEGORIES.flatMap(c => c.items).forEach(a => {
      const qty = addonQtys[a.id] || 0;
      if (qty > 0) items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: a.label + (a.detail ? ` (${a.detail})` : ""),
            description: "Rosh Hashanah Add-On",
          },
          unit_amount: Math.round(a.price * 100),
        },
        quantity: qty,
      });
    });

    if (simanimQty > 0) items.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: SIMANIM.label,
          description: "Rosh Hashanah Showstopper",
        },
        unit_amount: SIMANIM.price * 100,
      },
      quantity: simanimQty,
    });

    return items;
  };

  const buildSummaries = () => {
    const boxes = BOX_SIZES.filter(b => (boxQtys[b.id] || 0) > 0)
      .map(b => `${boxQtys[b.id]}× ${b.label}`).join(", ");
    const addonParts = ADDON_CATEGORIES.flatMap(c => c.items)
      .filter(a => (addonQtys[a.id] || 0) > 0)
      .map(a => `${addonQtys[a.id]}× ${a.label}`);
    if (simanimQty > 0) addonParts.push(`${simanimQty}× ${SIMANIM.label}`);
    const addons = addonParts.join(", ");
    return { boxes, addons };
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const doCheckout = async () => {
    setError("");
    setSubmitting(true);
    const { boxes, addons } = buildSummaries();
    const lineItems = buildLineItems();

    const res = await fetch("/api/rosh-hashanah/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lineItems,
        tipAmount,
        metadata: {
          order_type: "rosh_hashanah",
          customer_name: form.name,
          customer_phone: form.phone,
          customer_email: form.email,
          customer_address: form.address,
          special_requests: form.special_requests,
          boxes_summary: boxes,
          addons_summary: addons,
          subtotal: subtotal.toFixed(2),
          tax_amount: tax.toFixed(2),
          tip_amount: tipAmount.toFixed(2),
        },
      }),
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
    if (subtotal < 50) { setError("Minimum order is $50. Add a few more items to continue."); return; }
    if (!form.name || !form.phone || !form.address) { setError("Please fill in your name, phone, and delivery address."); return; }

    // Upsell check — salmon, brisket, or honey cake not added
    if (!upsellShown) {
      const missingSavory = (addonQtys["salmon"] || 0) === 0 && (addonQtys["brisket"] || 0) === 0;
      const missingSweet = (addonQtys["honey_cake"] || 0) === 0 && (addonQtys["apple_blondies"] || 0) === 0;
      if (missingSavory || missingSweet) {
        setUpsellShown(true);
        setShowUpsell(true);
        return;
      }
    }
    await doCheckout();
  };

  if (closed) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <h1 className="text-3xl font-black mb-2 text-center">Ordering is Closed</h1>
        <p className="text-zinc-400 text-center max-w-md">
          Rosh Hashanah ordering closed September 9th. We hope you have a sweet and happy new year!
        </p>
        <p className="text-yellow-400 font-bold mt-4">Shana Tova! 🎉</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">

      <SimanimPopup orderHref="#order" />

      {/* Header */}
      <div className="bg-zinc-950 border-b border-zinc-800 px-6 py-10 text-center">
        <p className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-3">Holiday Catering by The Hungry Rooster</p>
        <h1 className="text-4xl font-black tracking-tight">Rosh Hashanah</h1>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
          <span className="bg-zinc-900 text-green-400 border border-zinc-700 text-xs font-bold px-4 py-2 rounded-full">
            Orders Open Now
          </span>
          <span className="bg-zinc-900 text-zinc-400 border border-zinc-800 text-xs font-bold px-4 py-2 rounded-full">
            Order by Tuesday Sep 9 at Midnight · Delivery Friday Sep 11
          </span>
        </div>
      </div>

      <div className="px-6 py-8 max-w-2xl mx-auto space-y-8">

        {/* What's in the box */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <p className="font-black text-lg mb-0.5">Shabbat Box</p>
          <p className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-3">Every Box Includes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BOX_CONTENTS.map(item => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <span className="text-yellow-400">✦</span>
                <span className="text-zinc-200">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Min order + free delivery callout */}
        <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3">
          <p className="text-sm text-zinc-300"><span className="font-black text-white">$50 minimum order.</span> Mix and match anything on the page — no box required.</p>
          <span className="ml-4 shrink-0 text-green-400 font-black text-sm">Free Delivery</span>
        </div>

        {/* Box sizes */}
        <div id="order">
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Choose Your Box Size</h2>
          <div className="space-y-3">
            {BOX_SIZES.map(box => {
              const qty = boxQtys[box.id] || 0;
              return (
                <div key={box.id} className={`border-2 rounded-2xl p-5 transition-all ${qty > 0 ? "border-yellow-400 bg-yellow-400/5" : "border-zinc-800 bg-zinc-950"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-lg">{box.label}</p>
                      <p className="text-zinc-500 text-sm">{box.description} · <span className="text-yellow-400 font-bold">${box.price}</span> each</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => adjustBox(box.id, -1)} disabled={qty === 0}
                        className="w-9 h-9 rounded-full border border-zinc-700 font-black text-lg disabled:opacity-30 hover:border-yellow-400 transition-colors flex items-center justify-center">−</button>
                      <span className="w-6 text-center font-black text-xl text-yellow-400">{qty}</span>
                      <button onClick={() => adjustBox(box.id, 1)}
                        className="w-9 h-9 rounded-full border border-zinc-700 font-black text-lg hover:border-yellow-400 transition-colors flex items-center justify-center">+</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add-ons by category */}
        {ADDON_CATEGORIES.map(cat => (
          <div key={cat.label}>
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">
              {cat.emoji} {cat.label}
            </h2>
            <div className="space-y-3">
              {cat.items.map(item => {
                const qty = addonQtys[item.id] || 0;
                return (
                  <div key={item.id} className={`border rounded-2xl p-4 transition-all ${qty > 0 ? "border-yellow-400 bg-yellow-400/5" : "border-zinc-800 bg-zinc-950"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm">{item.label}</p>
                        {item.detail && <p className="text-zinc-500 text-xs">{item.detail}</p>}
                        <p className="text-yellow-400 text-xs font-bold mt-0.5">+${item.price % 1 === 0 ? item.price : item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => adjustAddon(item.id, -1)} disabled={qty === 0}
                          className="w-8 h-8 rounded-full border border-zinc-700 font-black disabled:opacity-30 hover:border-yellow-400 transition-colors flex items-center justify-center text-sm">−</button>
                        <span className="w-5 text-center font-black text-yellow-400">{qty}</span>
                        <button onClick={() => adjustAddon(item.id, 1)}
                          className="w-8 h-8 rounded-full border border-zinc-700 font-black hover:border-yellow-400 transition-colors flex items-center justify-center text-sm">+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Customer info + order summary (shown when anything is selected) */}
        {subtotal > 0 && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-5">
            <h3 className="font-black text-sm uppercase tracking-widest text-zinc-400">Delivery Info</h3>

            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Full Name *</label>
              <input type="text" placeholder="Jane Smith" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Phone *</label>
              <input type="tel" placeholder="(214) 555-0100" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Email</label>
              <input type="email" placeholder="jane@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Delivery Address *</label>
              <input type="text" placeholder="1234 Main St, Dallas TX 75201" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Special Requests</label>
              <textarea placeholder="Allergies, gate codes, anything we should know..." value={form.special_requests} onChange={e => setForm({ ...form, special_requests: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm resize-none h-20" />
            </div>

            {/* Tip */}
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Driver Tip (optional)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={tipAmount || ""} onChange={e => setTipAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-8 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm" />
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t border-zinc-800 pt-4 space-y-2">
              {BOX_SIZES.filter(b => (boxQtys[b.id] || 0) > 0).map(b => (
                <div key={b.id} className="flex justify-between text-sm">
                  <span className="text-zinc-400">{boxQtys[b.id]}× {b.label} Box</span>
                  <span className="font-bold">${(b.price * (boxQtys[b.id] || 0)).toFixed(2)}</span>
                </div>
              ))}
              {ADDON_CATEGORIES.flatMap(c => c.items).filter(a => (addonQtys[a.id] || 0) > 0).map(a => (
                <div key={a.id} className="flex justify-between text-sm">
                  <span className="text-zinc-400">{addonQtys[a.id]}× {a.label}</span>
                  <span className="font-bold">${(a.price * (addonQtys[a.id] || 0)).toFixed(2)}</span>
                </div>
              ))}
              {simanimQty > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">{simanimQty}× {SIMANIM.label}</span>
                  <span className="font-bold">${(SIMANIM.price * simanimQty).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm text-zinc-500 pt-2 border-t border-zinc-800">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-400">
                <span>Delivery</span><span>Free</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Tax (8.25%)</span><span>${tax.toFixed(2)}</span>
              </div>
              {tipAmount > 0 && (
                <div className="flex justify-between text-sm text-teal-400">
                  <span>Driver Tip</span><span>${tipAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                <span className="text-zinc-400 text-sm">Total</span>
                <span className="text-yellow-400 font-black text-2xl">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm font-bold">{error}</p>}

            <button onClick={handleSubmit} disabled={submitting}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black py-4 rounded-full text-base transition-colors">
              {submitting ? "Redirecting to checkout…" : `Pay $${grandTotal.toFixed(2)} — Secure Checkout →`}
            </button>
            <p className="text-zinc-600 text-xs text-center">Powered by Stripe · Delivered {DELIVERY}</p>
          </div>
        )}

        {/* Simanim Board — page closer */}
        <div className="rounded-2xl overflow-hidden border border-zinc-800">
          <img
            src="/simanim.png"
            alt="Edible Focaccia Simanim Board"
            className="w-full h-auto block"
          />
          <div className="bg-zinc-900 px-6 py-6 space-y-3">
            <p className="text-yellow-400 font-bold text-xs uppercase tracking-widest">Meet the Rosh Hashanah Showstopper!</p>
            <div className="flex items-baseline justify-between">
              <p className="font-black text-xl">Edible Focaccia Simanim Board</p>
              <p className="text-yellow-400 font-black text-lg">$200</p>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">
              The gift that shows off <em>and</em> feeds the table — a full sheet of house-made focaccia loaded with holiday magic:
            </p>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Roasted Apple Chutney · Pomegranate Vinaigrette · Date Harissa · Texas Caviar · Beet Hummus · Caramelized Leek Confit · Squash Baba Ganoush · Cracked Pepper Pickled Herring · Moroccan Carrot Salad · Classic Honey Jar
            </p>
            <p className="text-zinc-300 text-sm font-bold">
              Always fun. Always innovative. Always delicious.{" "}
              <span className="font-normal text-zinc-500">One giant sheet of yumminess. One seriously unforgettable Rosh Hashanah table.</span>
            </p>

            {/* Qty selector */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <p className="text-sm text-zinc-400 font-bold">Add to my order</p>
              <div className="flex items-center gap-3">
                <button onClick={() => adjustAddon(SIMANIM.id, -1)} disabled={simanimQty === 0}
                  className="w-9 h-9 rounded-full border border-zinc-700 font-black text-lg disabled:opacity-30 hover:border-yellow-400 transition-colors flex items-center justify-center">−</button>
                <span className="w-6 text-center font-black text-xl text-yellow-400">{simanimQty}</span>
                <button onClick={() => adjustAddon(SIMANIM.id, 1)}
                  className="w-9 h-9 rounded-full border border-zinc-700 font-black text-lg hover:border-yellow-400 transition-colors flex items-center justify-center">+</button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Upsell Modal */}
      {showUpsell && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-950 border-2 border-yellow-400/40 rounded-3xl p-7 max-w-sm w-full">
            <p className="text-4xl mb-3 text-center">🍎🍯</p>
            <h3 className="font-black text-xl mb-1 text-center">Is your table complete?</h3>
            <p className="text-zinc-400 text-sm mb-5 text-center">Don't miss these Rosh Hashanah favorites!</p>
            <div className="space-y-3 mb-5">
              {(addonQtys["salmon"] || 0) === 0 && (addonQtys["brisket"] || 0) === 0 && (
                <button onClick={() => { setAddonQtys(p => ({ ...p, salmon: 1 })); setShowUpsell(false); }}
                  className="w-full flex items-center justify-between bg-zinc-900 hover:border-yellow-400 border border-zinc-700 rounded-xl px-4 py-3 transition-colors">
                  <span className="font-bold text-sm">Add Honey Pomegranate Salmon</span>
                  <span className="text-yellow-400 font-black text-sm">+$60</span>
                </button>
              )}
              {(addonQtys["honey_cake"] || 0) === 0 && (addonQtys["apple_blondies"] || 0) === 0 && (
                <button onClick={() => { setAddonQtys(p => ({ ...p, apple_blondies: 1 })); setShowUpsell(false); }}
                  className="w-full flex items-center justify-between bg-zinc-900 hover:border-yellow-400 border border-zinc-700 rounded-xl px-4 py-3 transition-colors">
                  <span className="font-bold text-sm">Add Apple Blondies</span>
                  <span className="text-yellow-400 font-black text-sm">+$25</span>
                </button>
              )}
            </div>
            <button onClick={() => { setShowUpsell(false); doCheckout(); }}
              className="w-full border border-zinc-600 hover:border-zinc-400 text-zinc-300 font-bold py-3 rounded-full text-sm transition-colors">
              No thanks — proceed to payment
            </button>
          </div>
        </div>
      )}

      <div className="text-center pb-10 pt-4 text-zinc-700 text-xs">
        Rosh Hashanah 5787 · The Hungry Rooster · Dallas, TX · Shana Tova! 🍎
      </div>
    </main>
  );
}
