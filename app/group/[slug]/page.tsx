"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Location = {
  id: string;
  name: string;
  address: string;
  slug: string;
};

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
};

const GROUP_MENU: MenuItem[] = [
  // Sandwiches
  { id: "freds-sandwich", name: "Fred's Sandwich", description: "Crispy fried chicken with Fred's sauce on house bread · served with fries", price: 16.50, category: "Sandwiches" },
  { id: "brisket-sandwich", name: "House Brisket Sandwich", description: "Slow-smoked brisket on house bread · served with chips", price: 16.50, category: "Sandwiches" },
  // Wraps
  { id: "spicy-bbq-wrap", name: "Spicy BBQ Chicken Wrap", description: "Spicy BBQ chicken, lettuce, tomato · served with chips", price: 16.50, category: "Wraps" },
  { id: "caesar-salmon-wrap", name: "Caesar Salmon Wrap", description: "Crisp romaine, parmesan, salmon, Caesar dressing · served with chips", price: 16.50, category: "Wraps" },
  // Mains
  { id: "big-cluck-burrito", name: "Big Cluck Burrito", description: "Loaded chicken burrito · served with roasted potatoes", price: 16, category: "Mains" },
  { id: "fish-tacos", name: "Fish Tacos", description: "Beer-battered fish tacos with house slaw", price: 18, category: "Mains" },
  // Salads
  { id: "caesar-salad", name: "Caesar Salad", description: "Crisp romaine, parmesan, croutons, house Caesar dressing", price: 15, category: "Salads" },
  { id: "harvest-salad", name: "Harvest Salad", description: "Seasonal greens with harvest toppings and house dressing", price: 18, category: "Salads" },
  { id: "cauliflower-salad", name: "Cauliflower Salad", description: "Roasted cauliflower with house dressing and toppings", price: 18, category: "Salads" },
  // Protein Add-ons
  { id: "protein-salmon", name: "Add Salmon", description: "Glazed salmon fillet — add to any salad", price: 8, category: "Protein Add-ons" },
  { id: "protein-chicken", name: "Add Grilled Chicken", description: "Grilled chicken — add to any salad", price: 6, category: "Protein Add-ons" },
  { id: "protein-egg", name: "Add Hard Boiled Egg", description: "Add to any salad", price: 2, category: "Protein Add-ons" },
  { id: "protein-tuna", name: "Add Tuna Salad", description: "House tuna salad — add to any salad", price: 5, category: "Protein Add-ons" },
  // Group Exclusive
  { id: "teriyaki-drip", name: "Teriyaki Drip ✦ Exclusive", description: "Chilled sesame noodles in soy ginger sauce, topped with cucumbers, green onion & sesame seeds · glazed teriyaki salmon · group orders only", price: 18.50, category: "Group Exclusive" },
  // Desserts & Sides
  { id: "cookie-sprinkle", name: "Cookie – Sprinkle", description: "Fresh-baked sprinkle sugar cookie", price: 3, category: "Desserts & Sides" },
  { id: "cookie-bullseye", name: "Cookie – Chocolate Bullseye", description: "Rich chocolate chip cookie", price: 3, category: "Desserts & Sides" },
  { id: "brownie", name: "Brownie", description: "Dense fudge brownie", price: 3, category: "Desserts & Sides" },
  { id: "boureka", name: "Potato Boureka", description: "Flaky pastry with savory potato filling", price: 4, category: "Desserts & Sides" },
  // Drinks
  { id: "soda-coke", name: "Coke", description: "Ice cold can", price: 2, category: "Drinks" },
  { id: "soda-diet", name: "Diet Coke", description: "Ice cold can", price: 2, category: "Drinks" },
  { id: "soda-drpepper", name: "Dr Pepper", description: "Ice cold can", price: 2, category: "Drinks" },
  { id: "soda-sprite", name: "Sprite", description: "Ice cold can", price: 2, category: "Drinks" },
  { id: "soda-rootbeer", name: "Root Beer", description: "Ice cold can", price: 2, category: "Drinks" },
];

const CATEGORY_ORDER = ["Sandwiches", "Wraps", "Mains", "Salads", "Protein Add-ons", "Group Exclusive", "Desserts & Sides", "Drinks"];
const DESSERT_IDS = ["cookie-sprinkle", "cookie-bullseye", "brownie", "boureka"];
const DRINK_IDS = ["soda-coke", "soda-diet", "soda-drpepper", "soda-sprite", "soda-rootbeer"];
const MIN_TOTAL = 165;

export default function GroupOrderPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [location, setLocation] = useState<Location | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [personName, setPersonName] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [error, setError] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  // Drawer + upsell state
  const [showDrawer, setShowDrawer] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchData = async () => {
      const { data: loc } = await supabase
        .from("group_locations")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!loc) { setNotFound(true); setLoading(false); return; }
      setLocation(loc);

      const { data: orderData } = await supabase
        .from("group_orders")
        .select("total")
        .eq("location_slug", slug)
        .eq("delivery_date", today)
        .eq("status", "paid");

      const totalSoFar = (orderData || []).reduce((sum, o) => sum + (o.total || 0), 0);
      setOrderCount(totalSoFar);
      setLoading(false);
    };
    fetchData();
  }, [slug]);

  const getTotal = () =>
    Object.entries(quantities).reduce((sum, [id, qty]) => {
      const item = GROUP_MENU.find(i => i.id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0);

  const getCartItems = () =>
    Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = GROUP_MENU.find(i => i.id === id)!;
        return { ...item, qty, subtotal: item.price * qty };
      });

  const getTotalItems = () =>
    Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  const setQty = (id: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const hasDessert = () => DESSERT_IDS.some(id => (quantities[id] || 0) > 0);
  const hasDrink = () => DRINK_IDS.some(id => (quantities[id] || 0) > 0);

  const handleReviewOrder = () => {
    if (!personName.trim()) { setError("Please enter your name."); return; }
    setError("");

    // Show upsell if missing dessert or drink
    if (!hasDessert() || !hasDrink()) {
      setShowUpsell(true);
    } else {
      doCheckout();
    }
  };

  const doCheckout = async () => {
    setShowUpsell(false);
    setCheckingOut(true);

    const cartItems = getCartItems();
    const res = await fetch("/api/group-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cartItems,
        personName,
        specialRequests,
        locationId: location!.id,
        locationSlug: slug,
        locationName: location!.name,
        deliveryDate: today,
      }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError("Something went wrong. Please try again.");
      setCheckingOut(false);
    }
  };

  if (loading) return (
    <main className="bg-black text-white min-h-screen flex items-center justify-center">
      <p className="text-zinc-400">Loading...</p>
    </main>
  );

  if (notFound) return (
    <main className="bg-black text-white min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-5xl mb-4">🐓</p>
        <h1 className="text-3xl font-black mb-3">Location not found</h1>
        <p className="text-zinc-400 mb-6">This group order link isn't active. Check with your office manager.</p>
        <a href="/group" className="bg-teal-500 text-black font-black px-8 py-3 rounded-full">Group Orders Home</a>
      </div>
    </main>
  );

  const cartItems = getCartItems();
  const total = getTotal();
  const totalItems = getTotalItems();
  const meetsMinimum = orderCount >= MIN_TOTAL;

  return (
    <main className="bg-black text-white min-h-screen pb-32">
      <nav className="bg-black border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <a href="/group"><img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-12 w-auto" /></a>
        <span className="text-zinc-400 text-sm font-bold">{location?.name}</span>
      </nav>

      <div className="px-6 py-10 max-w-2xl mx-auto">
        {/* LOCATION HEADER */}
        <div className="mb-8">
          <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-1">Group Order</p>
          <h1 className="text-3xl font-black mb-1">{location?.name}</h1>
          <p className="text-zinc-400 text-sm">📍 {location?.address}</p>
        </div>

        {/* ORDER COUNTER */}
        <div className={`rounded-2xl p-5 border mb-8 ${meetsMinimum ? "bg-teal-900/30 border-teal-500" : "bg-zinc-900 border-zinc-700"}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-black text-lg">
              {meetsMinimum ? "✅ Minimum met!" : `$${orderCount.toFixed(0)} of $${MIN_TOTAL} minimum`}
            </p>
            <span className="text-2xl font-black text-teal-400">${orderCount.toFixed(0)}</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="bg-teal-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (orderCount / MIN_TOTAL) * 100)}%` }}
            />
          </div>
          {!meetsMinimum && (
            <p className="text-zinc-400 text-xs mt-2">${(MIN_TOTAL - orderCount).toFixed(0)} more needed to confirm today&apos;s delivery. Your card is only charged when the minimum is met.</p>
          )}
          {meetsMinimum && (
            <p className="text-teal-400 text-xs mt-2 font-bold">Delivery confirmed for today. Order now!</p>
          )}
        </div>

        {/* NAME (stays visible so user fills it while browsing) */}
        <div className="mb-8">
          <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Your Name *</label>
          <input
            type="text"
            placeholder="First & last name"
            value={personName}
            onChange={e => { setPersonName(e.target.value); setError(""); }}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 text-sm"
          />
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>

        {/* MENU */}
        <div className="space-y-8">
          {CATEGORY_ORDER.map(cat => {
            const items = GROUP_MENU.filter(i => i.category === cat);
            if (!items.length) return null;
            return (
              <div key={cat}>
                <h2 className={`text-xs font-black uppercase tracking-widest mb-3 ${cat === "Group Exclusive" ? "text-yellow-400" : cat === "Protein Add-ons" ? "text-teal-400" : "text-yellow-400"}`}>
                  {cat === "Group Exclusive" ? "⭐ " + cat : cat}
                </h2>
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${cat === "Group Exclusive" ? "bg-yellow-400/5 border-yellow-400/40" : "bg-zinc-900 border-zinc-800"}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-zinc-500 text-xs leading-snug">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-white font-black text-sm">${item.price}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setQty(item.id, -1)}
                            className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white font-black text-lg flex items-center justify-center transition-colors"
                          >−</button>
                          <span className="w-5 text-center font-black text-sm">{quantities[item.id] || 0}</span>
                          <button
                            onClick={() => setQty(item.id, 1)}
                            className="w-8 h-8 rounded-full bg-teal-500 hover:bg-teal-400 text-black font-black text-lg flex items-center justify-center transition-colors"
                          >+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STICKY CART BAR — shows when items are added */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-6 pt-3 bg-gradient-to-t from-black via-black/95 to-transparent">
          <button
            onClick={() => setShowDrawer(true)}
            className="w-full max-w-2xl mx-auto flex items-center justify-between bg-teal-500 hover:bg-teal-400 text-black font-black px-6 py-4 rounded-full text-base transition-colors shadow-2xl"
          >
            <span className="bg-black/20 text-black font-black rounded-full w-7 h-7 flex items-center justify-center text-sm">{totalItems}</span>
            <span>Review My Order</span>
            <span>${total.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* ORDER REVIEW DRAWER */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowDrawer(false)} />
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-t-3xl w-full max-w-2xl p-6 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black">Your Order</h2>
              <button onClick={() => setShowDrawer(false)} className="text-zinc-500 hover:text-white text-xl">✕</button>
            </div>

            {/* Cart items */}
            <div className="space-y-2 mb-5">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setQty(item.id, -1)} className="w-7 h-7 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white font-black text-base flex items-center justify-center">−</button>
                      <span className="w-4 text-center font-black text-sm">{item.qty}</span>
                      <button onClick={() => setQty(item.id, 1)} className="w-7 h-7 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white font-black text-base flex items-center justify-center">+</button>
                    </div>
                    <span className="text-sm text-zinc-200">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold">${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-black text-base border-t border-zinc-700 pt-3 mt-3">
                <span>Total</span>
                <span className="text-teal-400">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Special requests */}
            <textarea
              placeholder="Special requests (allergies, modifications...)"
              value={specialRequests}
              onChange={e => setSpecialRequests(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 resize-none h-16 text-sm mb-4"
            />

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <button
              onClick={handleReviewOrder}
              disabled={checkingOut}
              className="w-full bg-teal-500 hover:bg-teal-400 text-black font-black py-4 rounded-full text-lg transition-colors disabled:opacity-50"
            >
              {checkingOut ? "Redirecting to payment..." : `Pay $${total.toFixed(2)} — Secure Checkout`}
            </button>
            <p className="text-zinc-600 text-xs text-center mt-2">Only charged if minimum is met. Powered by Stripe.</p>
          </div>
        </div>
      )}

      {/* UPSELL POPUP — did you forget dessert and a drink? */}
      {showUpsell && (
        <div className="fixed inset-0 z-60 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-3xl p-7 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-5">
              <p className="text-3xl mb-2">🍪</p>
              <h2 className="text-xl font-black mb-1">Don't forget dessert & a drink!</h2>
              <p className="text-zinc-400 text-sm">Add something sweet and something cold before you pay.</p>
            </div>

            {/* Quick-add dessert section */}
            {!hasDessert() && (
              <div className="mb-4">
                <p className="text-xs font-black uppercase tracking-widest text-yellow-400 mb-2">Desserts & Sides</p>
                <div className="space-y-2">
                  {GROUP_MENU.filter(i => DESSERT_IDS.includes(i.id)).map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-2">
                      <div>
                        <p className="text-sm font-bold">{item.name}</p>
                        <p className="text-xs text-zinc-500">${item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setQty(item.id, -1)} className="w-7 h-7 rounded-full bg-zinc-700 text-white font-black text-base flex items-center justify-center">−</button>
                        <span className="w-4 text-center font-black text-sm">{quantities[item.id] || 0}</span>
                        <button onClick={() => setQty(item.id, 1)} className="w-7 h-7 rounded-full bg-yellow-400 text-black font-black text-base flex items-center justify-center">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick-add drinks section */}
            {!hasDrink() && (
              <div className="mb-5">
                <p className="text-xs font-black uppercase tracking-widest text-yellow-400 mb-2">Drinks</p>
                <div className="space-y-2">
                  {GROUP_MENU.filter(i => DRINK_IDS.includes(i.id)).map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-2">
                      <div>
                        <p className="text-sm font-bold">{item.name}</p>
                        <p className="text-xs text-zinc-500">${item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setQty(item.id, -1)} className="w-7 h-7 rounded-full bg-zinc-700 text-white font-black text-base flex items-center justify-center">−</button>
                        <span className="w-4 text-center font-black text-sm">{quantities[item.id] || 0}</span>
                        <button onClick={() => setQty(item.id, 1)} className="w-7 h-7 rounded-full bg-yellow-400 text-black font-black text-base flex items-center justify-center">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={doCheckout}
              disabled={checkingOut}
              className="w-full bg-teal-500 hover:bg-teal-400 text-black font-black py-3 rounded-full text-base transition-colors disabled:opacity-50 mb-3"
            >
              {checkingOut ? "Redirecting..." : `Yes, add & pay $${getTotal().toFixed(2)}`}
            </button>
            <button
              onClick={doCheckout}
              className="w-full text-zinc-500 hover:text-zinc-300 text-sm py-2 transition-colors"
            >
              No thanks — just take my money
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
