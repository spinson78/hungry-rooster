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
  dessert?: string | null;
  quantity_remaining: number;
  cutoff_time: string;
  is_active: boolean;
};

type Props = {
  initialMenu?: ShabbatMenu | null;
  initialIsOpen?: boolean;
};

const SIZES = [
  { label: "2 Person", price: 65, description: "Protein + 3 sides, serves 2" },
  { label: "4-6 Person", price: 115, description: "Protein + 3 sides, serves 4–6" },
  { label: "10-12 Person", price: 225, description: "Protein + 3 sides, serves 10–12" },
];

export default function ShabbatCheckout({ initialMenu, initialIsOpen }: Props) {
  const [menu, setMenu] = useState<ShabbatMenu | null>(initialMenu ?? null);
  const [isOpen, setIsOpen] = useState(initialIsOpen ?? false);
  const [loading, setLoading] = useState(false); // never block SSR — server always passes initialMenu or null
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellShown, setUpsellShown] = useState(false);
  const [showBakeryUpsell, setShowBakeryUpsell] = useState(false);
  const [bakeryUpsellShown, setBakeryUpsellShown] = useState(false);
  const [bakeryMenu, setBakeryMenu] = useState<{ id: string; items: { name: string; price: number; description: string }[] } | null>(null);
  const [selectedBakery, setSelectedBakery] = useState<Record<string, boolean>>({});
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [giftCode, setGiftCode] = useState("");
  const [giftDiscount, setGiftDiscount] = useState(0);
  const [giftCodeMsg, setGiftCodeMsg] = useState("");
  const [giftCodeErr, setGiftCodeErr] = useState("");
  const [checkingGift, setCheckingGift] = useState(false);

  const [selectedSize, setSelectedSize] = useState<typeof SIZES[0]>(SIZES[0]);
  const [addons, setAddons] = useState({
    greens:  { qty: 0, choice: "Kale" },
    dessert: { qty: 0 },
    babka:   { qty: 0, choice: "Chocolate" },
    salmon:  { qty: 0 },
    chicken: { qty: 0 },
    nuggets: { qty: 0 },
    boureka: { qty: 0 },
    caesar:  { qty: 0 },
  });

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

    const fetchBakery = async () => {
      const now = new Date();
      const { data } = await supabase
        .from("bakery_menus")
        .select("*")
        .gte("cutoff_time", now.toISOString())
        .order("cutoff_time", { ascending: true })
        .limit(1);
      if (data && data.length > 0 && data[0].items?.length > 0) {
        setBakeryMenu({ id: data[0].id, items: data[0].items });
      }
    };
    fetchBakery();
  }, []);

  const getTotal = () => {
    let total = selectedSize.price;
    total += 15    * addons.greens.qty;
    total += 25    * addons.dessert.qty;
    total += 18    * addons.babka.qty;
    total += 48    * addons.salmon.qty;
    total += 36    * addons.chicken.qty;
    total += 28    * addons.nuggets.qty;
    total += 18    * addons.boureka.qty;
    total += 6.50  * addons.caesar.qty;
    return total;
  };

  const buildLineItems = () => {
    const items: { price_data: { currency: string; product_data: { name: string; description: string }; unit_amount: number }; quantity: number }[] = [];
    items.push({ price_data: { currency: "usd", product_data: { name: `Shabbat Box — ${selectedSize.label}`, description: `${menu?.protein}, ${menu?.side1}, ${menu?.side2}, ${menu?.extra}` }, unit_amount: selectedSize.price * 100 }, quantity: 1 });
    if (addons.greens.qty > 0)   items.push({ price_data: { currency: "usd", product_data: { name: `Certified Greens (${addons.greens.choice})`, description: "Choice of kale or romaine" }, unit_amount: 1500 }, quantity: addons.greens.qty });
    if (addons.dessert.qty > 0)  items.push({ price_data: { currency: "usd", product_data: { name: menu?.dessert ? `Friday Night Dessert — ${menu.dessert}` : "Friday Night Dessert Add On", description: menu?.dessert || "Check socials for this week" }, unit_amount: 2500 }, quantity: addons.dessert.qty });
    if (addons.babka.qty > 0)    items.push({ price_data: { currency: "usd", product_data: { name: `Signature Babka (${addons.babka.choice})`, description: "Chocolate or cinnamon" }, unit_amount: 1800 }, quantity: addons.babka.qty });
    if (addons.salmon.qty > 0)   items.push({ price_data: { currency: "usd", product_data: { name: "Roasted Salmon Add On (6 filets)", description: "6 x 6oz filets" }, unit_amount: 4800 }, quantity: addons.salmon.qty });
    if (addons.chicken.qty > 0)  items.push({ price_data: { currency: "usd", product_data: { name: "6pc Grilled Chicken", description: "6 pieces grilled chicken" }, unit_amount: 3600 }, quantity: addons.chicken.qty });
    if (addons.nuggets.qty > 0)  items.push({ price_data: { currency: "usd", product_data: { name: "30pc Chicken Nuggets", description: "30 piece chicken nuggets" }, unit_amount: 2800 }, quantity: addons.nuggets.qty });
    if (addons.boureka.qty > 0)  items.push({ price_data: { currency: "usd", product_data: { name: "Boureka Box", description: "4 large Potato & Onion Bourekas" }, unit_amount: 1800 }, quantity: addons.boureka.qty });
    if (addons.caesar.qty > 0)   items.push({ price_data: { currency: "usd", product_data: { name: "8 oz Caesar Dressing", description: "House Caesar dressing, 8 oz" }, unit_amount: 650 }, quantity: addons.caesar.qty });
    if (bakeryMenu) {
      bakeryMenu.items.filter(i => selectedBakery[i.name]).forEach(i => {
        items.push({ price_data: { currency: "usd", product_data: { name: `🥐 ${i.name}`, description: i.description || "Esther's Friday Bakery" }, unit_amount: Math.round(i.price * 100) }, quantity: 1 });
      });
    }
    return items;
  };

  const buildItems = () => {
    const bakeryAddons = bakeryMenu ? bakeryMenu.items.filter(i => selectedBakery[i.name]).map(i => ({ name: `🥐 ${i.name}` })) : [];
    return [
      { name: `Shabbat Box — ${selectedSize.label}`, protein: menu?.protein, side1: menu?.side1, side2: menu?.side2, extra: menu?.extra },
      ...(addons.greens.qty > 0  ? [{ name: `${addons.greens.qty}× Certified Greens — ${addons.greens.choice}` }] : []),
      ...(addons.dessert.qty > 0 ? [{ name: `${addons.dessert.qty}× ` + (menu?.dessert ? `Friday Night Dessert — ${menu.dessert}` : "Friday Night Dessert Add On") }] : []),
      ...(addons.babka.qty > 0   ? [{ name: `${addons.babka.qty}× Signature Babka — ${addons.babka.choice}` }] : []),
      ...(addons.salmon.qty > 0  ? [{ name: `${addons.salmon.qty}× Roasted Salmon Add On (6 filets)` }] : []),
      ...(addons.chicken.qty > 0 ? [{ name: `${addons.chicken.qty}× 6pc Grilled Chicken` }] : []),
      ...(addons.nuggets.qty > 0 ? [{ name: `${addons.nuggets.qty}× 30pc Chicken Nuggets` }] : []),
      ...(addons.boureka.qty > 0 ? [{ name: `${addons.boureka.qty}× Boureka Box` }] : []),
      ...(addons.caesar.qty > 0  ? [{ name: `${addons.caesar.qty}× 8 oz Caesar Dressing` }] : []),
      ...bakeryAddons,
    ];
  };

  const applyGiftCard = async () => {
    if (!giftCode.trim()) return;
    setCheckingGift(true);
    setGiftCodeMsg("");
    setGiftCodeErr("");
    try {
      const res = await fetch(`/api/gift-validate?code=${encodeURIComponent(giftCode.trim().toUpperCase())}`);
      const data = await res.json();
      if (data.valid) {
        const rawTotal = getTotal() * 1.0825 + tipAmount;
        const discount = Math.min(parseFloat(data.balance), rawTotal);
        setGiftDiscount(discount);
        setGiftCodeMsg(`✓ $${parseFloat(data.balance).toFixed(2)} available — $${discount.toFixed(2)} applied`);
      } else {
        setGiftCodeErr(data.message || "Invalid gift card");
        setGiftDiscount(0);
      }
    } catch {
      setGiftCodeErr("Could not validate gift card. Try again.");
    }
    setCheckingGift(false);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.address) {
      setError("Please fill in your name, phone, and delivery address.");
      return;
    }
    if (!menu) return;
    if (!upsellShown) {
      const missingAny = addons.greens.qty === 0 || addons.babka.qty === 0 || addons.salmon.qty === 0;
      if (missingAny) {
        setUpsellShown(true);
        setShowUpsell(true);
        return;
      }
    }

    if (!bakeryUpsellShown && bakeryMenu && bakeryMenu.items.length > 0) {
      setBakeryUpsellShown(true);
      setShowBakeryUpsell(true);
      return;
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
          gift_code: giftCode.trim().toUpperCase(),
          gift_discount: giftDiscount,
          metadata: {
            order_type: "shabbat",
            menu_id: menu?.id || "",
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
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ordering is now closed.");
        setIsOpen(false);
        setSubmitting(false);
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-400">Loading this week&apos;s menu...</p>
      </div>
    );
  }

  return (
    <div>
      {!isOpen ? (
        <div className="bg-zinc-900 rounded-2xl p-8 border border-yellow-400/30 text-center mb-8">
          <p className="text-3xl mb-3">🕯️</p>
          <h2 className="text-2xl font-black mb-2">Shabbat Shalom!</h2>
          <p className="text-zinc-300 font-bold mb-2">
            {menu?.quantity_remaining === 0 ? "Sold out for this week." : "Ordering is not open right now."}
          </p>
          <p className="text-zinc-500 text-sm">Orders open Monday at 9PM and close Friday at 9AM.</p>
          <a href="https://instagram.com/thehungryroostertx" target="_blank" className="inline-block mt-6 border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-black px-8 py-3 rounded-full text-sm transition-colors">
            Follow @thehungryroostertx
          </a>
        </div>
      ) : (
        <div className="space-y-6">

          {/* This week's menu */}
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-3">This week&apos;s menu</p>
            <div className="space-y-1 text-base">
              <p><span className="text-zinc-400">Protein:</span> <span className="font-bold">{menu?.protein}</span></p>
              <p><span className="text-zinc-400">Side 1:</span> <span className="font-bold">{menu?.side1}</span></p>
              <p><span className="text-zinc-400">Side 2:</span> <span className="font-bold">{menu?.side2}</span></p>
              <p><span className="text-zinc-400">Side 3:</span> <span className="font-bold">{menu?.extra}</span></p>
            </div>
          </div>

          {/* Size selection */}
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-sm uppercase tracking-wide text-zinc-300">Choose Your Box</p>
            </div>
            <div className="space-y-3">
              {SIZES.map((size) => (
                <label key={size.label} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${selectedSize?.label === size.label ? "border-yellow-400 bg-zinc-800" : "border-zinc-700 hover:border-yellow-400"}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="size" checked={selectedSize?.label === size.label} onChange={() => setSelectedSize(size)} className="accent-yellow-400" />
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

          {/* Add-ons */}
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <p className="font-bold mb-4 text-sm uppercase tracking-wide text-zinc-300">Add-ons</p>
            <div className="space-y-3">

              {/* Certified Greens */}
              <div className={`p-4 rounded-xl border transition-colors ${addons.greens.qty > 0 ? "border-yellow-400 bg-zinc-800/50" : "border-zinc-700"}`}>
                <div className="flex items-center justify-between">
                  <div><p className="font-bold text-sm">Certified Greens</p><p className="text-zinc-500 text-xs">Choice of kale or romaine · +$15 each</p></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setAddons({ ...addons, greens: { ...addons.greens, qty: Math.max(0, addons.greens.qty - 1) } })} disabled={addons.greens.qty === 0}
                      className="w-8 h-8 rounded-full border border-zinc-600 font-black disabled:opacity-30 hover:border-yellow-400 transition-colors flex items-center justify-center text-sm">−</button>
                    <span className="w-5 text-center font-black text-yellow-400 text-sm">{addons.greens.qty}</span>
                    <button onClick={() => setAddons({ ...addons, greens: { ...addons.greens, qty: addons.greens.qty + 1 } })}
                      className="w-8 h-8 rounded-full border border-zinc-600 font-black hover:border-yellow-400 transition-colors flex items-center justify-center text-sm">+</button>
                  </div>
                </div>
                {addons.greens.qty > 0 && (
                  <div className="flex gap-3 mt-3">
                    {["Kale", "Romaine"].map((g) => (
                      <label key={g} className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer text-sm transition-colors ${addons.greens.choice === g ? "border-yellow-400 text-yellow-400" : "border-zinc-600 text-zinc-400"}`}>
                        <input type="radio" name="greens" checked={addons.greens.choice === g} onChange={() => setAddons({ ...addons, greens: { ...addons.greens, choice: g } })} className="hidden" />{g}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Friday Night Dessert */}
              <div className={`p-4 rounded-xl border transition-colors ${addons.dessert.qty > 0 ? "border-yellow-400 bg-zinc-800/50" : "border-zinc-700"}`}>
                <div className="flex items-center justify-between">
                  <div><p className="font-bold text-sm">Friday Night Dessert{menu?.dessert ? ` — ${menu.dessert}` : ""}</p><p className="text-zinc-500 text-xs">{menu?.dessert ? "This week's featured dessert" : "Check our socials for this week's dessert"} · +$25 each</p></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setAddons({ ...addons, dessert: { qty: Math.max(0, addons.dessert.qty - 1) } })} disabled={addons.dessert.qty === 0}
                      className="w-8 h-8 rounded-full border border-zinc-600 font-black disabled:opacity-30 hover:border-yellow-400 transition-colors flex items-center justify-center text-sm">−</button>
                    <span className="w-5 text-center font-black text-yellow-400 text-sm">{addons.dessert.qty}</span>
                    <button onClick={() => setAddons({ ...addons, dessert: { qty: addons.dessert.qty + 1 } })}
                      className="w-8 h-8 rounded-full border border-zinc-600 font-black hover:border-yellow-400 transition-colors flex items-center justify-center text-sm">+</button>
                  </div>
                </div>
              </div>

              {/* Signature Babka */}
              <div className={`p-4 rounded-xl border transition-colors ${addons.babka.qty > 0 ? "border-yellow-400 bg-zinc-800/50" : "border-zinc-700"}`}>
                <div className="flex items-center justify-between">
                  <div><p className="font-bold text-sm">Signature Babka</p><p className="text-zinc-500 text-xs">Choice of chocolate or cinnamon · +$18 each</p></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setAddons({ ...addons, babka: { ...addons.babka, qty: Math.max(0, addons.babka.qty - 1) } })} disabled={addons.babka.qty === 0}
                      className="w-8 h-8 rounded-full border border-zinc-600 font-black disabled:opacity-30 hover:border-yellow-400 transition-colors flex items-center justify-center text-sm">−</button>
                    <span className="w-5 text-center font-black text-yellow-400 text-sm">{addons.babka.qty}</span>
                    <button onClick={() => setAddons({ ...addons, babka: { ...addons.babka, qty: addons.babka.qty + 1 } })}
                      className="w-8 h-8 rounded-full border border-zinc-600 font-black hover:border-yellow-400 transition-colors flex items-center justify-center text-sm">+</button>
                  </div>
                </div>
                {addons.babka.qty > 0 && (
                  <div className="flex gap-3 mt-3">
                    {["Chocolate", "Cinnamon"].map((b) => (
                      <label key={b} className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer text-sm transition-colors ${addons.babka.choice === b ? "border-yellow-400 text-yellow-400" : "border-zinc-600 text-zinc-400"}`}>
                        <input type="radio" name="babka" checked={addons.babka.choice === b} onChange={() => setAddons({ ...addons, babka: { ...addons.babka, choice: b } })} className="hidden" />{b}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Roasted Salmon */}
              <div className={`p-4 rounded-xl border transition-colors ${addons.salmon.qty > 0 ? "border-yellow-400 bg-zinc-800/50" : "border-zinc-700"}`}>
                <div className="flex items-center justify-between">
                  <div><p className="font-bold text-sm">Roasted Salmon Add On</p><p className="text-zinc-500 text-xs">6 x 6oz filets · +$48 each</p></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setAddons({ ...addons, salmon: { qty: Math.max(0, addons.salmon.qty - 1) } })} disabled={addons.salmon.qty === 0}
                      className="w-8 h-8 rounded-full border border-zinc-600 font-black disabled:opacity-30 hover:border-yellow-400 transition-colors flex items-center justify-center text-sm">−</button>
                    <span className="w-5 text-center font-black text-yellow-400 text-sm">{addons.salmon.qty}</span>
                    <button onClick={() => setAddons({ ...addons, salmon: { qty: addons.salmon.qty + 1 } })}
                      className="w-8 h-8 rounded-full border border-zinc-600 font-black hover:border-yellow-400 transition-colors flex items-center justify-center text-sm">+</button>
                  </div>
                </div>
              </div>

              {/* 6pc Grilled Chicken */}
              <div className={`p-4 rounded-xl border transition-colors ${addons.chicken.qty > 0 ? "border-yellow-400 bg-zinc-800/50" : "border-zinc-700"}`}>
                <div className="flex items-center justify-between">
                  <div><p className="font-bold text-sm">6pc Grilled Chicken</p><p className="text-zinc-500 text-xs">6 pieces of grilled chicken · +$36 each</p></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setAddons({ ...addons, chicken: { qty: Math.max(0, addons.chicken.qty - 1) } })} disabled={addons.chicken.qty === 0}
                      className="w-8 h-8 rounded-full border border-zinc-600 font-black disabled:opacity-30 hover:border-yellow-400 transition-colors flex items-center justify-center text-sm">−</button>
                    <span className="w-5 text-center font-black text-yellow-400 text-sm">{addons.chicken.qty}</span>
                    <button onClick={() => setAddons({ ...addons, chicken: { qty: addons.chicken.qty + 1 } })}
                      className="w-8 h-8 rounded-full border border-zinc-600 font-black hover:border-yellow-400 transition-colors flex items-center justify-center text-sm">+</button>
                  </div>
                </div>
              </div>

              {/* 30pc Chicken Nuggets */}
              <div className={`p-4 rounded-xl border transition-colors ${addons.nuggets.qty > 0 ? "border-yellow-400 bg-zinc-800/50" : "border-zinc-700"}`}>
                <div className="flex items-center justify-between">
                  <div><p className="font-bold text-sm">30pc Chicken Nuggets</p><p className="text-zinc-500 text-xs">30 piece chicken nuggets · +$28 each</p></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setAddons({ ...addons, nuggets: { qty: Math.max(0, addons.nuggets.qty - 1) } })} disabled={addons.nuggets.qty === 0}
                      className="w-8 h-8 rounded-full border border-zinc-600 font-black disabled:opacity-30 hover:border-yellow-400 transition-colors flex items-center justify-center text-sm">−</button>
                    <span className="w-5 text-center font-black text-yellow-400 text-sm">{addons.nuggets.qty}</span>
                    <button onClick={() => setAddons({ ...addons, nuggets: { qty: addons.nuggets.qty + 1 } })}
                      className="w-8 h-8 rounded-full border border-zinc-600 font-black hover:border-yellow-400 transition-colors flex items-center justify-center text-sm">+</button>
                  </div>
                </div>
              </div>

              {/* Boureka Box */}
              <div className={`p-4 rounded-xl border transition-colors ${addons.boureka.qty > 0 ? "border-yellow-400 bg-zinc-800/50" : "border-zinc-700"}`}>
                <div className="flex items-center justify-between">
                  <div><p className="font-bold text-sm">Boureka Box</p><p className="text-zinc-500 text-xs">4 large Potato &amp; Onion Bourekas · +$18 each</p></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setAddons({ ...addons, boureka: { qty: Math.max(0, addons.boureka.qty - 1) } })} disabled={addons.boureka.qty === 0}
                      className="w-8 h-8 rounded-full border border-zinc-600 font-black disabled:opacity-30 hover:border-yellow-400 transition-colors flex items-center justify-center text-sm">−</button>
                    <span className="w-5 text-center font-black text-yellow-400 text-sm">{addons.boureka.qty}</span>
                    <button onClick={() => setAddons({ ...addons, boureka: { qty: addons.boureka.qty + 1 } })}
                      className="w-8 h-8 rounded-full border border-zinc-600 font-black hover:border-yellow-400 transition-colors flex items-center justify-center text-sm">+</button>
                  </div>
                </div>
              </div>

              {/* Caesar Dressing */}
              <div className={`p-4 rounded-xl border transition-colors ${addons.caesar.qty > 0 ? "border-yellow-400 bg-zinc-800/50" : "border-zinc-700"}`}>
                <div className="flex items-center justify-between">
                  <div><p className="font-bold text-sm">8 oz Caesar Dressing</p><p className="text-zinc-500 text-xs">House Caesar dressing, 8 oz · +$6.50 each</p></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setAddons({ ...addons, caesar: { qty: Math.max(0, addons.caesar.qty - 1) } })} disabled={addons.caesar.qty === 0}
                      className="w-8 h-8 rounded-full border border-zinc-600 font-black disabled:opacity-30 hover:border-yellow-400 transition-colors flex items-center justify-center text-sm">−</button>
                    <span className="w-5 text-center font-black text-yellow-400 text-sm">{addons.caesar.qty}</span>
                    <button onClick={() => setAddons({ ...addons, caesar: { qty: addons.caesar.qty + 1 } })}
                      className="w-8 h-8 rounded-full border border-zinc-600 font-black hover:border-yellow-400 transition-colors flex items-center justify-center text-sm">+</button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <h2 className="text-xl font-black mb-6">Delivery Info</h2>
            <div className="space-y-4">
              <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Full Name *</label><input type="text" placeholder="Jane Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" /></div>
              <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Phone Number *</label><input type="tel" placeholder="(214) 555-0100" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" /></div>
              <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Email</label><input type="email" placeholder="jane@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" /></div>
              <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Delivery Address *</label><input type="text" placeholder="1234 Main St, Dallas, TX 75201" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" /></div>
              <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Special Requests</label><textarea placeholder="Allergies, gate codes, anything we should know..." value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 resize-none h-20" /></div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.sms_opted_in} onChange={(e) => setForm({ ...form, sms_opted_in: e.target.checked })} className="mt-1 w-4 h-4 accent-yellow-400 cursor-pointer" />
                <span className="text-sm text-zinc-400">Yes, send me order confirmations and special offers via text. Msg frequency varies. Reply STOP to cancel. Msg and data rates may apply. <a href="/privacy" className="underline text-yellow-400">Privacy Policy</a></span>
              </label>
            </div>

            {/* Driver Tip */}
            <div className="mt-6">
              <label className="text-xs text-zinc-400 uppercase tracking-wide mb-2 block">Driver Tip (optional)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={tipAmount || ""} onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500" />
              </div>
            </div>

            {/* Gift Card */}
            <div className="mt-6">
              <label className="text-xs text-zinc-400 uppercase tracking-wide mb-2 block">Gift Card (optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="THR-XXXX-XXXX"
                  value={giftCode}
                  onChange={(e) => { setGiftCode(e.target.value.toUpperCase()); setGiftCodeMsg(""); setGiftCodeErr(""); setGiftDiscount(0); }}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 text-sm font-mono"
                />
                <button
                  onClick={applyGiftCard}
                  disabled={checkingGift || !giftCode.trim()}
                  className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black px-4 rounded-xl text-sm transition-colors"
                >
                  {checkingGift ? "..." : "Apply"}
                </button>
              </div>
              {giftCodeMsg && <p className="text-yellow-400 text-xs mt-1">{giftCodeMsg}</p>}
              {giftCodeErr && <p className="text-red-400 text-xs mt-1">{giftCodeErr}</p>}
            </div>

            {/* Order Summary */}
            <div className="mt-4 bg-zinc-800 rounded-xl p-4 text-sm space-y-1">
              <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>${getTotal().toFixed(2)}</span></div>
              <div className="flex justify-between text-zinc-400"><span>Sales Tax (8.25%)</span><span>${(getTotal() * 0.0825).toFixed(2)}</span></div>
              {tipAmount > 0 && <div className="flex justify-between text-teal-400"><span>Driver Tip</span><span>${tipAmount.toFixed(2)}</span></div>}
              {giftDiscount > 0 && (
                <div className="flex justify-between text-yellow-400"><span>🎁 Gift Card</span><span>−${giftDiscount.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between text-white font-black border-t border-zinc-700 pt-2 mt-2">
                <span>Total</span><span>${Math.max(0, getTotal() * 1.0825 + tipAmount - giftDiscount).toFixed(2)}</span>
              </div>
            </div>
            {getTotal() < 100 && (
              <p className="text-zinc-500 text-xs mt-2">Add more to reach $100 for free delivery.</p>
            )}

            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
            <button onClick={handleSubmit} disabled={submitting} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-full text-lg transition-colors mt-6 disabled:opacity-50">
              {submitting ? "Redirecting to payment..." : `Pay $${Math.max(0, getTotal() * 1.0825 + tipAmount - giftDiscount).toFixed(2)} — Secure Checkout`}
            </button>
            <p className="text-zinc-600 text-xs text-center mt-3">Powered by Stripe. Your card info is never stored on our servers.</p>
          </div>
        </div>
      )}

      {/* Bakery Upsell Modal */}
      {showBakeryUpsell && bakeryMenu && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="text-4xl mb-4">🥐</div>
            <h2 className="text-2xl font-black mb-1">Is your Shabbat table complete?</h2>
            <p className="text-zinc-300 font-bold mb-1">What about Kiddush?</p>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">Add Esther&apos;s fresh-baked Friday Bakery items to your order — delivered alongside your Shabbat Box.</p>
            <div className="space-y-3 mb-6 text-left">
              {bakeryMenu.items.map((item) => (
                <label key={item.name} className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-colors ${selectedBakery[item.name] ? "border-yellow-400 bg-zinc-800" : "border-zinc-700 hover:border-yellow-400/50"}`}>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={!!selectedBakery[item.name]} onChange={(e) => setSelectedBakery({ ...selectedBakery, [item.name]: e.target.checked })} className="accent-yellow-400" />
                    <div>
                      <p className="font-bold text-sm">{item.name}</p>
                      {item.description && <p className="text-zinc-500 text-xs">{item.description}</p>}
                    </div>
                  </div>
                  <span className="text-yellow-400 font-black text-sm ml-4 shrink-0">+${item.price.toFixed(2)}</span>
                </label>
              ))}
            </div>
            <button onClick={() => { setShowBakeryUpsell(false); handleSubmit(); }} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-3 rounded-full text-sm transition-colors mb-3">
              {Object.values(selectedBakery).some(Boolean) ? "Add to Order & Checkout" : "Proceed to Payment"}
            </button>
            <button onClick={() => { setShowBakeryUpsell(false); handleSubmit(); }} className="w-full border-2 border-zinc-600 hover:border-zinc-400 text-zinc-300 font-bold py-3 rounded-full text-sm transition-colors">
              No thanks — just the Shabbat order
            </button>
          </div>
        </div>
      )}

      {/* Add-ons Upsell Modal */}
      {showUpsell && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <img src="/THR%20round%20final.png" alt="The Hungry Rooster" className="w-20 mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-2">Shabbat Shalom!</h2>
            <p className="text-zinc-300 font-bold mb-1">Is your table complete?</p>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">Don&apos;t forget — you can add Certified Greens, Signature Babka, and Roasted Salmon to complete your Shabbat spread.</p>
            <div className="space-y-3 mb-6 text-left">
              {addons.greens.qty === 0 && (
                <button onClick={() => { setAddons({ ...addons, greens: { ...addons.greens, qty: 1 } }); setShowUpsell(false); }} className="w-full flex items-center justify-between bg-zinc-800 hover:border-yellow-400 border border-zinc-700 rounded-xl px-4 py-3 transition-colors">
                  <span className="font-bold text-sm">Add Certified Greens</span><span className="text-yellow-400 font-black text-sm">+$15</span>
                </button>
              )}
              {addons.babka.qty === 0 && (
                <button onClick={() => { setAddons({ ...addons, babka: { ...addons.babka, qty: 1 } }); setShowUpsell(false); }} className="w-full flex items-center justify-between bg-zinc-800 hover:border-yellow-400 border border-zinc-700 rounded-xl px-4 py-3 transition-colors">
                  <span className="font-bold text-sm">Add Signature Babka</span><span className="text-yellow-400 font-black text-sm">+$18</span>
                </button>
              )}
              {addons.salmon.qty === 0 && (
                <button onClick={() => { setAddons({ ...addons, salmon: { qty: 1 } }); setShowUpsell(false); }} className="w-full flex items-center justify-between bg-zinc-800 hover:border-yellow-400 border border-zinc-700 rounded-xl px-4 py-3 transition-colors">
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
    </div>
  );
}
