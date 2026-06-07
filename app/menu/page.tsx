"use client";
import { useState } from "react";

const menu = {
  Breakfast: [
    {
      name: "Big Cluck Burrito",
      price: 16,
      description: "Flour tortilla, scrambled eggs, peppers & onions, crispy hashbrowns, jalapeño and charred green onion sauce. Served with homestyle potatoes & red salsa.",
      tag: "Fan Favorite",
      addons: [
        { label: "Add Vegan Cheese", price: 2 },
        { label: "Sub Egg Whites", price: 2 },
      ],
    },
    {
      name: "Side Chick Sandwich",
      price: 13,
      description: "Scrambled eggs, sautéed onion, spicy mayo on your choice of bread. Served with homestyle potatoes.",
      tag: "",
      sizes: [
        { label: "English Muffin", price: 0 },
        { label: "House Bread", price: 0 },
        { label: "Wrap", price: 0 },
      ],
      addons: [
        { label: "Add Vegan Cheese", price: 2 },
        { label: "Sub Egg Whites", price: 2 },
      ],
    },
    {
      name: "Chicken & Waffles",
      price: 18,
      description: "Waffles, house-seasoned fried boneless chicken thighs, Fred's sauce, and maple syrup.",
      tag: "Fred Approved",
      addons: [],
    },
    {
      name: "Hangover Burrito",
      price: 17,
      description: "Flour tortilla, beef bacon, scrambled eggs, vegan cheese, pepper, onion, pico de gallo, charred green onion sauce. Served with homestyle potatoes.",
      tag: "",
      addons: [],
    },
  ],
  Lunch: [
    {
      name: "Fish Taco",
      price: 18,
      description: "Flour tortillas, battered red snapper, lime cabbage slaw, pickled purple onion, pico de gallo, spicy aioli, and sliced fresh avocado. (3 to an order)",
      tag: "Fresh Daily",
      addons: [],
    },
    {
      name: "Caesar Salmon Wrap",
      price: 16.5,
      description: "Tortilla, grilled salmon, spiced chickpeas, romaine lettuce, caesar dressing. Served with chips and a pickle.",
      tag: "",
      addons: [],
    },
    {
      name: "Tuna Sandwich",
      price: 16.5,
      description: "House bread, white albacore tuna salad, lettuce, tomato, and purple onion. Served with chips and a pickle.",
      tag: "",
      addons: [],
    },
    {
      name: "Classic Fried Chicken Sandwich",
      price: 16.5,
      description: "House bun, fried chicken breast, shredded lettuce, tomato, Fred's sauce with French fries on the side.",
      tag: "",
      addons: [],
    },
    {
      name: "Spicy Fried Chicken Sandwich",
      price: 16.5,
      description: "House bun, fried chicken breast tossed in hot honey BBQ, lettuce, and tomato served with fries.",
      tag: "🔥 Spicy",
      addons: [],
    },
    {
      name: "Fish Sandwich",
      price: 18,
      description: "Bread, beer battered white fish, lettuce, tomato, pickles, spicy aioli. Served with chips.",
      tag: "Fred Approved",
      addons: [],
    },
    {
      name: "Caesar Chicken Wrap",
      price: 16,
      description: "Tortilla, grilled chicken breast, lettuce, garlic herb croutons, romaine, Caesar dressing, with French fries on the side.",
      tag: "",
      addons: [],
    },
    {
      name: "Chicken Combo Meal",
      price: 14,
      description: "Chicken fingers, French fries, garlic toast, cucumber dill salad, and Fred's sauce.",
      tag: "",
      addons: [],
      sizes: [
        { label: "3 Pieces", price: 0 },
        { label: "5 Pieces", price: 4 },
        { label: "8 Pieces", price: 8 },
        { label: "12 Pieces", price: 13 },
      ],
    },
    {
      name: "Brisket Sandwich",
      price: 16.5,
      description: "BBQ brisket on a house made bun. Served with chips and a pickle.",
      tag: "",
      addons: [],
    },
    {
      name: "Kids Fish Sticks & Fries",
      price: 8,
      description: "Classic fish sticks served with French fries.",
      tag: "Kids",
      addons: [],
    },
  ],
  Salads: [
    {
      name: "Caesar Salad",
      price: 15,
      description: "Romaine, garlic herb croutons, spiced chickpeas, Caesar dressing.",
      tag: "",
      addons: [
        { label: "Vegan Cheese + Bacon Bits", price: 3 },
        { label: "Salmon", price: 8 },
        { label: "Tuna Salad", price: 5 },
        { label: "Hard Boiled Egg", price: 2 },
        { label: "Grilled Chicken", price: 6 },
        { label: "Crispy Fried Chicken", price: 6 },
      ],
    },
    {
      name: "Hen House Harvest",
      price: 18,
      description: "Romaine, shredded carrots, chickpeas, cherry tomatoes, cucumber, hard-boiled egg, red onion, bell peppers, mushrooms, croutons, honey mustard dressing.",
      tag: "Fan Favorite",
      addons: [
        { label: "Vegan Cheese + Bacon Bits", price: 3 },
        { label: "Salmon", price: 8 },
        { label: "Tuna Salad", price: 5 },
        { label: "Hard Boiled Egg", price: 2 },
        { label: "Grilled Chicken", price: 6 },
        { label: "Crispy Fried Chicken", price: 6 },
      ],
    },
    {
      name: "Southwest Salad",
      price: 18,
      description: "Romaine, cherry tomatoes, pico, avocado, fried tortilla strips, roasted corn & black bean salsa, charred green onion dressing.",
      tag: "",
      addons: [
        { label: "Vegan Cheese + Bacon Bits", price: 3 },
        { label: "Salmon", price: 8 },
        { label: "Tuna Salad", price: 5 },
        { label: "Hard Boiled Egg", price: 2 },
        { label: "Grilled Chicken", price: 6 },
        { label: "Crispy Fried Chicken", price: 6 },
      ],
    },
    {
      name: "Cauliflower Salad",
      price: 18,
      description: "Kale, roasted cauliflower, cucumber, chickpeas, hard-boiled egg, avocado, pickled purple onion, and tahini lime vinaigrette.",
      tag: "",
      addons: [
        { label: "Vegan Cheese + Bacon Bits", price: 3 },
        { label: "Salmon", price: 8 },
        { label: "Tuna Salad", price: 5 },
        { label: "Hard Boiled Egg", price: 2 },
        { label: "Grilled Chicken", price: 6 },
        { label: "Crispy Fried Chicken", price: 6 },
      ],
    },
  ],
  Drinks: [
    { name: "Coke", price: 2, description: "12oz can", tag: "", addons: [] },
    { name: "Diet Coke", price: 2, description: "12oz can", tag: "", addons: [] },
    { name: "Dr Pepper", price: 2, description: "12oz can", tag: "", addons: [] },
    { name: "Root Beer", price: 2, description: "12oz can", tag: "", addons: [] },
    { name: "Sprite", price: 2, description: "12oz can", tag: "", addons: [] },
    { name: "Sunkist", price: 2, description: "12oz can", tag: "", addons: [] },
    { name: "Sweet Tea", price: 2, description: "Bottle", tag: "", addons: [] },
    { name: "Water", price: 2, description: "Bottle", tag: "", addons: [] },
  ],
};

type CartItem = {
  name: string;
  unit_price: number;  // price for 1 item (no qty multiplier)
  price: number;       // total = unit_price * qty
  mods: string;
  size?: string;
  addons: string[];
  qty: number;
};

type MenuItem = {
  name: string;
  price: number;
  description: string;
  tag: string;
  addons: { label: string; price: number }[];
  sizes?: { label: string; price: number }[];
};

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("Breakfast");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modal, setModal] = useState<MenuItem | null>(null);
  const [mods, setMods] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [addDessert, setAddDessert] = useState(false);
  const [qty, setQty] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [upsellShown, setUpsellShown] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutNote, setCheckoutNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ order_number: string } | null>(null);
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [tipAmount, setTipAmount] = useState<number>(0);

  const categories = Object.keys(menu);

  const openModal = (item: MenuItem) => {
    setModal(item);
    setMods("");
    setSelectedSize(item.sizes ? item.sizes[0].label : "");
    setSelectedAddons([]);
    setAddDessert(false);
    setQty(1);
  };

  const toggleAddon = (label: string) => {
    setSelectedAddons((prev) =>
      prev.includes(label) ? prev.filter((a) => a !== label) : [...prev, label]
    );
  };

  const getItemTotal = () => {
    if (!modal) return 0;
    let total = modal.price * qty;
    if (modal.sizes && selectedSize) {
      const size = modal.sizes.find((s) => s.label === selectedSize);
      if (size) total += size.price * qty;
    }
    if (modal.addons) {
      modal.addons.forEach((a) => {
        if (selectedAddons.includes(a.label)) total += a.price * qty;
      });
    }
    if (addDessert) total += 4 * qty;
    return total;
  };

  const addToCart = () => {
    if (!modal) return;
    const total = getItemTotal();
    const unit_price = qty > 0 ? total / qty : total;
    const newItem: CartItem = {
      name: modal.name,
      unit_price,
      price: total,
      mods,
      size: selectedSize,
      addons: addDessert ? [...selectedAddons, "Dessert of the day"] : selectedAddons,
      qty,
    };
    setCart((prev) => [...prev, newItem]);
    setJustAdded(true);
    setTimeout(() => {
      setModal(null);
      setJustAdded(false);
    }, 600);
  };

  const updateCartQty = (index: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        updated.splice(index, 1);
      } else {
        item.qty = newQty;
        item.price = item.unit_price * newQty;
        updated[index] = item;
      }
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const TAX_RATE = 0.0825;
  const cartSubtotal = cart.reduce((sum, item) => sum + item.unit_price * item.qty, 0);
  const cartTax = cartSubtotal * TAX_RATE;
  const cartTotal = cartSubtotal + cartTax + (Number(tipAmount) || 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const hasDrink = cart.some((item) => ["Coke","Diet Coke","Dr Pepper","Root Beer","Sprite","Sunkist","Sweet Tea","Water"].includes(item.name));
  const hasDessert = cart.some((item) => item.addons.includes("Dessert of the day"));

  const handlePlaceOrder = () => {
    if (!upsellShown && (!hasDrink || !hasDessert)) {
      setUpsellOpen(true);
      setUpsellShown(true);
    } else {
      setUpsellOpen(false);
      setCheckoutOpen(true);
    }
  };

  const submitOrder = async () => {
    if (!checkoutName.trim()) return;
    if (fulfillment === "delivery" && !deliveryAddress.trim()) return;
    setSubmitting(true);
    const items = cart.map(item => ({
      name: item.name,
      qty: item.qty,
      size: item.size || null,
      addons: item.addons,
      mods: item.mods || null,
      price: item.unit_price * item.qty,
    }));
    const tip = Number(tipAmount) || 0;
    const res = await fetch("/api/menu-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: checkoutName,
        customer_phone: checkoutPhone,
        customer_address: fulfillment === "delivery" ? deliveryAddress : "Pickup",
        items,
        subtotal: cartSubtotal,
        tax: cartTax,
        tip,
        total: cartTotal,
        special_requests: checkoutNote,
        fulfillment_type: fulfillment,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.success) {
      setCart([]);
      setCheckoutOpen(false);
      setTipAmount(0);
      setDeliveryAddress("");
      setFulfillment("pickup");
      setConfirmed({ order_number: data.order_number });
    }
  };

  const addQuickDrink = () => {
    setCart((prev) => [...prev, { name: "Coke", unit_price: 2, price: 2, mods: "", size: "", addons: [], qty: 1 }]);
  };

  const addQuickDessert = () => {
    setCart((prev) => [...prev, { name: "Dessert of the day", unit_price: 4, price: 4, mods: "", size: "", addons: [], qty: 1 }]);
  };

  return (
    <main className="bg-black text-white min-h-screen">
      {/* NAVBAR */}
      <nav className="bg-black border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <a href="/">
          <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-12 w-auto" />
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
          <a href="/" className="hover:text-white transition-colors">Home</a>
          <a href="/menu" className="text-white">Menu</a>
          <a href="/#catering" className="hover:text-white transition-colors">Catering</a>
          <a href="/#shabbat" className="hover:text-white transition-colors">Shabbat</a>
        </div>
        <button
          onClick={() => setCartOpen(true)}
          className={`font-black px-5 py-2 rounded-full text-sm transition-all ${justAdded ? "bg-green-400 text-black scale-110" : "bg-teal-500 hover:bg-teal-400 text-black"}`}
        >
          Cart {cartCount > 0 && <span className="ml-1">({cartCount})</span>}
        </button>
      </nav>

      {/* PAGE HEADER */}
      <div className="px-6 py-10 max-w-6xl mx-auto">
        <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-2">Mon - Fri, 9am - 2pm CST</p>
        <h1 className="text-4xl md:text-5xl font-black mb-2">The Menu</h1>
        <p className="text-zinc-400">Scratch-made. Chef-driven. Fred approved.</p>
      </div>

      {/* CATEGORY TABS */}
      <div className="px-6 max-w-6xl mx-auto mb-8 flex gap-3 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full font-bold text-sm transition-colors ${
              activeCategory === cat
                ? "bg-teal-500 text-black"
                : "border border-zinc-700 text-zinc-400 hover:border-teal-500 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* MENU ITEMS */}
      <div className="px-6 max-w-6xl mx-auto pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(menu[activeCategory as keyof typeof menu] as MenuItem[]).map((item) => (
            <div
              key={item.name}
              className="bg-zinc-900 border border-zinc-800 hover:border-teal-500 rounded-2xl p-6 flex justify-between items-start gap-4 transition-colors cursor-pointer"
              onClick={() => openModal(item)}
            >
              <div className="flex-1">
                {item.tag && (
                  <span className="text-yellow-400 text-xs font-bold uppercase tracking-wide">{item.tag}</span>
                )}
                <h3 className="text-lg font-black mt-1 mb-2">{item.name}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{item.description}</p>
              </div>
              <div className="flex flex-col items-end gap-3 shrink-0">
                <span className="text-white font-black text-lg">${item.price.toFixed(2)}</span>
                <button className="bg-teal-500 hover:bg-teal-400 text-black font-black w-9 h-9 rounded-full text-xl transition-colors flex items-center justify-center">
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ITEM MODAL */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-zinc-700">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-black">{modal.name}</h2>
                <button onClick={() => setModal(null)} className="text-zinc-400 hover:text-white text-2xl leading-none">×</button>
              </div>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{modal.description}</p>

              {/* SIZE OPTIONS */}
              {modal.sizes && (
                <div className="mb-6">
                  <p className="font-bold mb-3 text-sm uppercase tracking-wide text-zinc-300">Choose size</p>
                  <div className="space-y-2">
                    {modal.sizes.map((s) => (
                      <label key={s.label} className="flex items-center justify-between p-3 rounded-xl border border-zinc-700 cursor-pointer hover:border-teal-500 transition-colors">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="size"
                            value={s.label}
                            checked={selectedSize === s.label}
                            onChange={() => setSelectedSize(s.label)}
                            className="accent-teal-500"
                          />
                          <span className="text-sm font-semibold">{s.label}</span>
                        </div>
                        <span className="text-sm text-zinc-400">{s.price > 0 ? `+$${s.price.toFixed(2)}` : "included"}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* ADD-ONS */}
              {modal.addons && modal.addons.length > 0 && (
                <div className="mb-6">
                  <p className="font-bold mb-3 text-sm uppercase tracking-wide text-zinc-300">Add / Sub</p>
                  <div className="space-y-2">
                    {modal.addons.map((a) => (
                      <label key={a.label} className="flex items-center justify-between p-3 rounded-xl border border-zinc-700 cursor-pointer hover:border-teal-500 transition-colors">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedAddons.includes(a.label)}
                            onChange={() => toggleAddon(a.label)}
                            className="accent-teal-500"
                          />
                          <span className="text-sm font-semibold">{a.label}</span>
                        </div>
                        <span className="text-sm text-zinc-400">+${a.price.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* DESSERT */}
              <div className="mb-6">
                <p className="font-bold mb-3 text-sm uppercase tracking-wide text-zinc-300">Add dessert</p>
                <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-700 cursor-pointer hover:border-teal-500 transition-colors">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={addDessert}
                      onChange={() => setAddDessert(!addDessert)}
                      className="accent-teal-500"
                    />
                    <div>
                      <span className="text-sm font-semibold">Dessert of the day</span>
                      <p className="text-xs text-zinc-500">Check our socials for today's dessert</p>
                    </div>
                  </div>
                  <span className="text-sm text-zinc-400">+$4.00</span>
                </label>
              </div>

              {/* SPECIAL REQUESTS */}
              <div className="mb-6">
                <p className="font-bold mb-2 text-sm uppercase tracking-wide text-zinc-300">Special requests</p>
                <textarea
                  value={mods}
                  onChange={(e) => setMods(e.target.value)}
                  placeholder="No tomatoes, extra sauce, dressing on the side..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 resize-none h-20"
                />
              </div>

              {/* QTY + ADD */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-zinc-800 rounded-full px-4 py-2">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-xl font-bold text-zinc-400 hover:text-white">−</button>
                  <span className="font-black w-4 text-center">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="text-xl font-bold text-zinc-400 hover:text-white">+</button>
                </div>
                <button
                  onClick={addToCart}
                  disabled={justAdded}
                  className={`flex-1 font-black py-3 rounded-full transition-all ${justAdded ? "bg-green-400 text-black scale-95" : "bg-teal-500 hover:bg-teal-400 text-black"}`}
                >
                  {justAdded ? "✓ Added!" : `Add to order — $${getItemTotal().toFixed(2)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {cartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-end">
          <div className="bg-zinc-900 w-full max-w-sm h-full flex flex-col border-l border-zinc-800">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-black">Your Order</h2>
              <button onClick={() => setCartOpen(false)} className="text-zinc-400 hover:text-white text-2xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <p className="text-zinc-500 text-sm">Nothing in your cart yet.</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, i) => (
                    <div key={i} className="border border-zinc-800 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span className="font-bold text-sm flex-1">{item.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-sm text-white">${(item.unit_price * item.qty).toFixed(2)}</span>
                          <button onClick={() => removeFromCart(i)} className="text-zinc-600 hover:text-red-400 text-lg leading-none transition-colors">×</button>
                        </div>
                      </div>
                      {item.size && <p className="text-zinc-400 text-xs mb-1">{item.size}</p>}
                      {item.addons.length > 0 && <p className="text-zinc-400 text-xs mb-1">+ {item.addons.join(", ")}</p>}
                      {item.mods && <p className="text-orange-300 text-xs italic mb-1">⚠ {item.mods}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <button onClick={() => updateCartQty(i, -1)} className="w-7 h-7 rounded-full border border-zinc-600 text-zinc-300 font-black flex items-center justify-center hover:border-teal-500 hover:text-teal-400 transition-colors text-base leading-none">−</button>
                        <span className="font-black text-sm text-white w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateCartQty(i, 1)} className="w-7 h-7 rounded-full border border-zinc-600 text-zinc-300 font-black flex items-center justify-center hover:border-teal-500 hover:text-teal-400 transition-colors text-base leading-none">+</button>
                        {item.unit_price > 0 && item.qty > 1 && <span className="text-zinc-600 text-xs">${item.unit_price.toFixed(2)} each</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-6 border-t border-zinc-800">
                <div className="space-y-1 text-sm mb-3">
                  <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>${cartSubtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-zinc-400"><span>Tax (8.25%)</span><span>${cartTax.toFixed(2)}</span></div>
                </div>
                <div className="flex justify-between mb-4 font-black text-white border-t border-zinc-700 pt-2">
                  <span>Total</span>
                  <span className="text-teal-400">${cartTotal.toFixed(2)}</span>
                </div>
                <button onClick={handlePlaceOrder} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-full text-lg transition-colors">
                  Place Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* UPSELL POPUP */}
      {upsellOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-sm border border-zinc-700 p-6">
            <h2 className="text-xl font-black mb-1">Did you forget something?</h2>
            <p className="text-zinc-400 text-sm mb-6">Fred wants to make sure you have everything you need.</p>

            <div className="space-y-3 mb-6">
              {!hasDrink && (
                <div className="flex items-center justify-between bg-zinc-800 rounded-xl p-4 border border-zinc-700">
                  <div>
                    <p className="font-bold text-sm">A drink</p>
                    <p className="text-zinc-500 text-xs">Coke, Sprite, Sweet Tea & more — $2</p>
                  </div>
                  <button
                    onClick={() => { addQuickDrink(); }}
                    className="bg-teal-500 hover:bg-teal-400 text-black font-black px-4 py-2 rounded-full text-sm transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}
              {!hasDessert && (
                <div className="flex items-center justify-between bg-zinc-800 rounded-xl p-4 border border-zinc-700">
                  <div>
                    <p className="font-bold text-sm">Dessert of the day</p>
                    <p className="text-zinc-500 text-xs">Check our socials for today's treat — $4</p>
                  </div>
                  <button
                    onClick={() => { addQuickDessert(); }}
                    className="bg-teal-500 hover:bg-teal-400 text-black font-black px-4 py-2 rounded-full text-sm transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => { setUpsellOpen(false); setCheckoutOpen(true); }}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-3 rounded-full transition-colors"
            >
              No thanks, place my order
            </button>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {checkoutOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-sm border border-zinc-700 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-black">Checkout</h2>
              <button onClick={() => setCheckoutOpen(false)} className="text-zinc-400 hover:text-white text-2xl">×</button>
            </div>

            {/* Pickup / Delivery */}
            <div className="mb-5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Fulfillment</label>
              <div className="flex gap-2">
                {(["pickup", "delivery"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFulfillment(type)}
                    className={`flex-1 py-2.5 rounded-full font-black text-sm border transition-colors ${fulfillment === type ? "bg-yellow-400 border-yellow-400 text-black" : "border-zinc-700 text-zinc-400 hover:text-white"}`}
                  >
                    {type === "pickup" ? "🏪 Pickup" : "🚗 Delivery"}
                  </button>
                ))}
              </div>
              {fulfillment === "delivery" && (
                <input type="text" placeholder="Delivery address" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 text-sm mt-3" />
              )}
            </div>

            {/* Name + Phone */}
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Your Name *</label>
                <input type="text" placeholder="Jane Smith" value={checkoutName} onChange={e => setCheckoutName(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Phone Number</label>
                <input type="tel" placeholder="(214) 555-0100" value={checkoutPhone} onChange={e => setCheckoutPhone(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Order Notes</label>
                <textarea placeholder="Any notes for the kitchen..." value={checkoutNote} onChange={e => setCheckoutNote(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 text-sm resize-none h-16" />
              </div>
            </div>

            {/* Driver Tip */}
            <div className="mb-5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Driver Tip (optional)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">$</span>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={tipAmount || ""} onChange={e => setTipAmount(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 text-sm" />
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-zinc-800 rounded-xl p-4 mb-5 space-y-1.5 text-sm">
              <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>${cartSubtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-zinc-400"><span>Tax (8.25%)</span><span>${cartTax.toFixed(2)}</span></div>
              {(Number(tipAmount) || 0) > 0 && <div className="flex justify-between text-teal-400"><span>Driver Tip</span><span>${(Number(tipAmount)).toFixed(2)}</span></div>}
              <div className="flex justify-between text-white font-black border-t border-zinc-700 pt-2 mt-1">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={submitOrder}
              disabled={submitting || !checkoutName.trim() || (fulfillment === "delivery" && !deliveryAddress.trim())}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-full text-lg transition-colors disabled:opacity-50"
            >
              {submitting ? "Placing order..." : `Place Order — $${cartTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}

      {/* ORDER CONFIRMED */}
      {confirmed && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <p className="text-6xl mb-4">🐓</p>
            <h2 className="text-3xl font-black mb-2">Order Placed!</h2>
            <p className="text-teal-400 font-black text-xl mb-2">{confirmed.order_number}</p>
            <p className="text-zinc-400 mb-8">Your order is in the kitchen. We&apos;ll have it ready shortly.</p>
            <button onClick={() => { setConfirmed(null); setCartOpen(false); setUpsellShown(false); }} className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-10 py-4 rounded-full text-lg transition-colors">
              Done
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
