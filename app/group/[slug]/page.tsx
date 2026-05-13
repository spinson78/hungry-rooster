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

// Placeholder group menu — replace with real items next session
const GROUP_MENU: MenuItem[] = [
  { id: "tots", name: "Breakfast Tots", description: "Fred's famous tots with dipping sauce", price: 8, category: "Breakfast" },
  { id: "side-chick", name: "Side Chick Sandwich", description: "Crispy chicken on house bread", price: 12, category: "Sandwiches" },
  { id: "fish-sandwich", name: "Fish Sandwich", description: "Beer-battered, Fred-approved", price: 13, category: "Sandwiches" },
  { id: "caesar-wrap", name: "Caesar Salmon Wrap", description: "Fresh daily, light and crisp", price: 13, category: "Wraps & Salads" },
  { id: "greek-salad", name: "Greek Salad", description: "Classic Greek with house dressing", price: 11, category: "Wraps & Salads" },
  { id: "chicken-tenders", name: "Chicken Tenders (3pc)", description: "Crispy tenders with Fred sauce", price: 10, category: "Mains" },
  { id: "soda", name: "Can Soda", description: "Coke, Diet Coke, Dr Pepper, Sprite, Root Beer", price: 2, category: "Drinks" },
];

const CATEGORIES = [...new Set(GROUP_MENU.map(i => i.category))];
const MIN_ORDERS = 10;

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

      const { count } = await supabase
        .from("group_orders")
        .select("*", { count: "exact", head: true })
        .eq("location_slug", slug)
        .eq("delivery_date", today)
        .eq("status", "paid");

      setOrderCount(count || 0);
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

  const setQty = (id: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleCheckout = async () => {
    if (!personName.trim()) { setError("Please enter your name."); return; }
    if (getTotal() === 0) { setError("Please add at least one item."); return; }
    setError("");
    setCheckingOut(true);

    const cartItems = getCartItems();

    // Create Stripe checkout session
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
  const meetsMinimum = orderCount >= MIN_ORDERS;

  return (
    <main className="bg-black text-white min-h-screen">
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
              {meetsMinimum ? "✅ Minimum met!" : `${orderCount} / ${MIN_ORDERS} orders placed today`}
            </p>
            <span className="text-2xl font-black text-teal-400">{orderCount}</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="bg-teal-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (orderCount / MIN_ORDERS) * 100)}%` }}
            />
          </div>
          {!meetsMinimum && (
            <p className="text-zinc-400 text-xs mt-2">{MIN_ORDERS - orderCount} more orders needed to confirm today's delivery. Your order is only charged when minimum is met.</p>
          )}
          {meetsMinimum && (
            <p className="text-teal-400 text-xs mt-2 font-bold">Delivery confirmed for today. Order now!</p>
          )}
        </div>

        {/* MENU */}
        <div className="space-y-8 mb-8">
          {CATEGORIES.map(cat => (
            <div key={cat}>
              <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400 mb-3">{cat}</h2>
              <div className="space-y-3">
                {GROUP_MENU.filter(i => i.category === cat).map(item => (
                  <div key={item.id} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-sm">{item.name}</p>
                      <p className="text-zinc-500 text-xs">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-white font-black text-sm">${item.price}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setQty(item.id, -1)} className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white font-black text-lg flex items-center justify-center transition-colors">−</button>
                        <span className="w-5 text-center font-black text-sm">{quantities[item.id] || 0}</span>
                        <button onClick={() => setQty(item.id, 1)} className="w-8 h-8 rounded-full bg-teal-500 hover:bg-teal-400 text-black font-black text-lg flex items-center justify-center transition-colors">+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* YOUR INFO + CHECKOUT */}
        {cartItems.length > 0 && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 sticky bottom-6">
            <h2 className="font-black text-lg mb-4">Your order</h2>
            <div className="space-y-1 mb-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-zinc-300">{item.qty}× {item.name}</span>
                  <span className="text-white font-bold">${item.subtotal}</span>
                </div>
              ))}
              <div className="flex justify-between font-black text-base border-t border-zinc-700 pt-2 mt-2">
                <span>Total</span>
                <span className="text-teal-400">${total}</span>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              <input
                type="text"
                placeholder="Your name *"
                value={personName}
                onChange={e => setPersonName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 text-sm"
              />
              <textarea
                placeholder="Special requests (allergies, modifications...)"
                value={specialRequests}
                onChange={e => setSpecialRequests(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 resize-none h-16 text-sm"
              />
            </div>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full bg-teal-500 hover:bg-teal-400 text-black font-black py-4 rounded-full text-lg transition-colors disabled:opacity-50"
            >
              {checkingOut ? "Redirecting to payment..." : `Pay $${total} & Join the Order`}
            </button>
            <p className="text-zinc-600 text-xs text-center mt-2">Secure payment via Stripe. Only charged if minimum is met.</p>
          </div>
        )}
      </div>
    </main>
  );
}
