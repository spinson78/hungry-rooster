"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const SIZES = [
  { label: "4–6 people", price: 115 },
  { label: "8–10 people", price: 200 },
  { label: "12–15 people", price: 265 },
];

const PACKAGES = [
  {
    id: "showstopper",
    name: "The Showstopper",
    category: "Parve Breakfast",
    categoryColor: "teal",
    description: "Wake up and nosh like royalty. Fred's got the lox on lock.",
    items: ["Bagels and spread", "House-cured gravlax platter", "Scrambled eggs", "Assorted fruit salad", "Morning tea sweets platter"],
    choices: [] as { key: string; label: string; options: string[] }[],
  },
  {
    id: "meat-greet",
    name: "Fred's Meat and Greet",
    category: "Meat Breakfast",
    categoryColor: "yellow",
    description: "Turkey sausage, eggs, and a crispy side — your official cluck-in to the day.",
    items: ["Scrambled Eggs", "Turkey Breakfast Sausage Patties", "Fresh Fruit Salad", "Mini Challah Rolls or Toasted Bagels"],
    choices: [{ key: "potato", label: "Choose your potato side", options: ["Breakfast Potatoes", "Hash Browns"] }],
  },
  {
    id: "strut-stuff",
    name: "The Strut and Stuff",
    category: "Meat Brunch",
    categoryColor: "yellow",
    description: "Wraps, skewers, and savory bites. Brunch with a bold attitude and a full belly guaranteed.",
    items: ["BBQ Chicken Salad Wrap Halves", "Potato Wedges with Maple Chili Glaze", "Fruit Skewers", "Parve Muffin Bites"],
    choices: [],
  },
  {
    id: "golden-plate",
    name: "The Golden Plate",
    category: "Parve Dinner",
    categoryColor: "teal",
    description: "Cozy up with a wholesome spread that brings the whole flock to the table.",
    items: ["Lemon herb roasted salmon", "House roasted veggies", "Garlic mashed potatoes", "Garden Salad"],
    choices: [],
  },
  {
    id: "pasta-la-vista",
    name: "Pasta La Vista",
    category: "Parve Dinner",
    categoryColor: "teal",
    description: "Pasta night just got an upgrade!",
    items: ["Choice of pasta", "Garden salad", "Garlic breadsticks", "Cookies"],
    choices: [{ key: "pasta", label: "Choose your pasta sauce", options: ["Pesto", "Marinara"] }],
  },
  {
    id: "roost-roast",
    name: "Roost and Roast",
    category: "Meat Dinner",
    categoryColor: "yellow",
    description: "Golden. Juicy. Served with love. Fred's take on the classic roast.",
    items: ["Roasted herb chicken", "House roasted veggies", "Rice Pilaf", "Garden salad"],
    choices: [],
  },
  {
    id: "saucy-flock",
    name: "The Saucy Flock",
    category: "Meat Dinner",
    categoryColor: "yellow",
    description: "Meatballs made with love, pasta with purpose. Twirl it like you mean it.",
    items: ["Spaghetti and meatballs", "Garden salad", "Breadsticks", "Cookies"],
    choices: [],
  },
  {
    id: "cluckin-smash",
    name: "The Cluckin Smash",
    category: "Meat Dinner",
    categoryColor: "yellow",
    description: "Stack it, sauce it, smash it. Burger night just hit the coop.",
    items: ["Smash burger bar (patties, housemade buns, lettuce, tomato, onion, pickles, Fred sauce, mustard, mayo, ketchup)", "House seasoned fries", "Cookies"],
    choices: [],
  },
  {
    id: "gettin-strippy",
    name: "Gettin' Strippy with It",
    category: "Meat Dinner",
    categoryColor: "yellow",
    description: "Crispy, golden, and ready to dip. No shame in gettin' strippy with it.",
    items: ["Fried chicken strips with Fred sauce", "House seasoned fries", "Cookies"],
    choices: [],
  },
];

const CATEGORIES = ["All", "Parve Breakfast", "Meat Breakfast", "Meat Brunch", "Parve Dinner", "Meat Dinner"];

const getMinDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

type Flow = "choose" | "order" | "quote";

export default function CateringPage() {
  const [flow, setFlow] = useState<Flow>("choose");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedPackage, setSelectedPackage] = useState<typeof PACKAGES[0] | null>(null);
  const [selectedSize, setSelectedSize] = useState(SIZES[0]);
  const [packageChoices, setPackageChoices] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [orderForm, setOrderForm] = useState({
    name: "", phone: "", email: "", address: "", event_date: "", special_requests: "",
  });

  const [quoteForm, setQuoteForm] = useState({
    name: "", phone: "", email: "", event_date: "", headcount: "", event_type: "", location: "", budget: "", notes: "",
  });

  const filtered = categoryFilter === "All" ? PACKAGES : PACKAGES.filter(p => p.category === categoryFilter);

  const handleSelectPackage = (pkg: typeof PACKAGES[0]) => {
    setSelectedPackage(pkg);
    const defaults: Record<string, string> = {};
    pkg.choices.forEach(c => { defaults[c.key] = c.options[0]; });
    setPackageChoices(defaults);
  };

  const handleOrderSubmit = async () => {
    if (!orderForm.name || !orderForm.phone || !orderForm.address || !orderForm.event_date) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!selectedPackage) return;

    setSubmitting(true);
    setError("");

    const choicesSummary = Object.entries(packageChoices).map(([k, v]) => {
      const choice = selectedPackage.choices.find(c => c.key === k);
      return `${choice?.label}: ${v}`;
    });

    const items = [{
      name: selectedPackage.name,
      category: selectedPackage.category,
      size: selectedSize.label,
      includes: selectedPackage.items,
      choices: choicesSummary,
    }];

    const { error: dbError } = await supabase.from("orders").insert({
      order_type: "catering",
      customer_name: orderForm.name,
      customer_email: orderForm.email,
      customer_phone: orderForm.phone,
      customer_address: orderForm.address,
      special_requests: `Event date: ${orderForm.event_date}${orderForm.special_requests ? " · " + orderForm.special_requests : ""}`,
      items,
      total: selectedSize.price,
      status: "pending",
    });

    if (dbError) { setError("Something went wrong. Please try again."); setSubmitting(false); return; }

    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_type: "catering",
        customer_name: orderForm.name,
        customer_phone: orderForm.phone,
        customer_email: orderForm.email,
        customer_address: orderForm.address,
        special_requests: `Event date: ${orderForm.event_date}${orderForm.special_requests ? " · " + orderForm.special_requests : ""}`,
        items,
        total: selectedSize.price,
      }),
    });

    setSubmitted(true);
    setSubmitting(false);
  };

  const handleQuoteSubmit = async () => {
    if (!quoteForm.name || !quoteForm.phone || !quoteForm.email || !quoteForm.event_date) {
      setError("Please fill in your name, phone, email, and event date.");
      return;
    }
    setSubmitting(true);
    setError("");

    const items = [{
      name: "Catering Inquiry",
      event_type: quoteForm.event_type,
      headcount: quoteForm.headcount,
      location: quoteForm.location,
      budget: quoteForm.budget,
      notes: quoteForm.notes,
    }];

    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_type: "catering_inquiry",
        customer_name: quoteForm.name,
        customer_phone: quoteForm.phone,
        customer_email: quoteForm.email,
        customer_address: quoteForm.location || "TBD",
        special_requests: `Event: ${quoteForm.event_type} · Headcount: ${quoteForm.headcount} · Budget: ${quoteForm.budget} · Notes: ${quoteForm.notes}`,
        items,
        total: 0,
      }),
    });

    setSubmitted(true);
    setSubmitting(false);
  };

  // SUCCESS
  if (submitted) {
    return (
      <main className="bg-black text-white min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🐓</div>
          <h1 className="text-4xl font-black mb-4">
            {flow === "quote" ? "We got your inquiry!" : "Order received!"}
          </h1>
          <p className="text-zinc-400 text-lg mb-2">
            {flow === "quote"
              ? "Our sales team will be in touch within 24 hours to build your perfect event."
              : "Fred is on it. We'll confirm your catering order by phone."}
          </p>
          <a href="/" className="mt-8 inline-block bg-teal-500 hover:bg-teal-400 text-black font-black px-8 py-4 rounded-full text-lg transition-colors">
            Back to Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-black text-white min-h-screen">
      <nav className="bg-black border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <a href="/"><img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-12 w-auto" /></a>
        <a href="/menu" className="bg-teal-500 hover:bg-teal-400 text-black font-black px-5 py-2 rounded-full text-sm transition-colors">Full Menu</a>
      </nav>

      <div className="px-6 py-12 max-w-3xl mx-auto">
        <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-2">Catering</p>
        <h1 className="text-4xl font-black mb-2">We pull up and feed your people.</h1>
        <p className="text-zinc-400 mb-10">Corporate. Schools. Weddings. Shiva. Whatever the occasion — we show up with food that hits. 24-hour lead time required.</p>

        {/* FLOW SELECTOR */}
        {flow === "choose" && (
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => setFlow("order")}
              className="bg-zinc-900 border border-zinc-700 hover:border-teal-500 rounded-2xl p-8 text-left transition-colors"
            >
              <p className="text-3xl mb-4">📦</p>
              <p className="font-black text-xl mb-2">Order a Package</p>
              <p className="text-zinc-400 text-sm mb-4">Pick from our family-style meal packages. Serves 4–15 people. Order online in minutes.</p>
              <span className="text-teal-400 font-bold text-sm">Starting at $115 →</span>
            </button>
            <button
              onClick={() => setFlow("quote")}
              className="bg-zinc-900 border border-zinc-700 hover:border-yellow-400 rounded-2xl p-8 text-left transition-colors"
            >
              <p className="text-3xl mb-4">📋</p>
              <p className="font-black text-xl mb-2">Get a Custom Quote</p>
              <p className="text-zinc-400 text-sm mb-4">Larger events, custom menus, or specific needs. Our sales team will build something just for you.</p>
              <span className="text-yellow-400 font-bold text-sm">Contact sales →</span>
            </button>
          </div>
        )}

        {/* PACKAGE ORDER FLOW */}
        {flow === "order" && (
          <div>
            <button onClick={() => { setFlow("choose"); setSelectedPackage(null); }} className="text-zinc-400 hover:text-white text-sm mb-8">← Back</button>

            {!selectedPackage ? (
              <>
                {/* CATEGORY FILTER */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${categoryFilter === cat ? "bg-teal-500 text-black" : "bg-zinc-900 text-zinc-400 border border-zinc-700 hover:text-white"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {filtered.map(pkg => (
                    <button
                      key={pkg.id}
                      onClick={() => handleSelectPackage(pkg)}
                      className="w-full bg-zinc-900 border border-zinc-700 hover:border-teal-500 rounded-2xl p-6 text-left transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className={`text-xs font-black uppercase tracking-widest ${pkg.categoryColor === "teal" ? "text-teal-400" : "text-yellow-400"}`}>
                            {pkg.category}
                          </span>
                          <p className="font-black text-lg">{pkg.name}</p>
                        </div>
                        <span className="text-white font-black text-sm whitespace-nowrap ml-4">from $115</span>
                      </div>
                      <p className="text-zinc-400 text-sm mb-3">{pkg.description}</p>
                      <p className="text-zinc-500 text-xs">{pkg.items.join(" · ")}</p>
                      {pkg.choices.length > 0 && (
                        <p className="text-teal-400 text-xs mt-2 font-bold">⚙ Includes a selection</p>
                      )}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <button onClick={() => setSelectedPackage(null)} className="text-zinc-400 hover:text-white text-sm">← Choose a different package</button>

                {/* PACKAGE SUMMARY */}
                <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                  <span className={`text-xs font-black uppercase tracking-widest ${selectedPackage.categoryColor === "teal" ? "text-teal-400" : "text-yellow-400"}`}>
                    {selectedPackage.category}
                  </span>
                  <h2 className="text-2xl font-black mb-1">{selectedPackage.name}</h2>
                  <p className="text-zinc-400 text-sm mb-4">{selectedPackage.description}</p>
                  <ul className="space-y-1">
                    {selectedPackage.items.map(item => (
                      <li key={item} className="text-sm text-zinc-300">• {item}</li>
                    ))}
                  </ul>
                </div>

                {/* CHOICES */}
                {selectedPackage.choices.map(choice => (
                  <div key={choice.key} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                    <p className="font-bold mb-4 text-sm uppercase tracking-wide text-zinc-300">{choice.label}</p>
                    <div className="flex flex-wrap gap-3">
                      {choice.options.map(opt => (
                        <button
                          key={opt}
                          onClick={() => setPackageChoices({ ...packageChoices, [choice.key]: opt })}
                          className={`px-6 py-3 rounded-full font-bold text-sm border transition-colors ${packageChoices[choice.key] === opt ? "border-teal-500 bg-teal-500/20 text-teal-300" : "border-zinc-600 text-zinc-400 hover:border-zinc-400"}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* SIZE */}
                <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                  <p className="font-bold mb-4 text-sm uppercase tracking-wide text-zinc-300">Choose your size</p>
                  <div className="space-y-3">
                    {SIZES.map(size => (
                      <label key={size.label} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${selectedSize.label === size.label ? "border-teal-500 bg-zinc-800" : "border-zinc-700 hover:border-teal-500"}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" checked={selectedSize.label === size.label} onChange={() => setSelectedSize(size)} className="accent-teal-500" />
                          <span className="font-bold text-sm">{size.label}</span>
                        </div>
                        <span className="font-black text-white">${size.price}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* ORDER FORM */}
                <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                  <h2 className="text-xl font-black mb-6">Delivery / Event Info</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Full Name *</label>
                        <input type="text" placeholder="Jane Smith" value={orderForm.name} onChange={e => setOrderForm({ ...orderForm, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Phone *</label>
                        <input type="tel" placeholder="(214) 555-0100" value={orderForm.phone} onChange={e => setOrderForm({ ...orderForm, phone: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Email</label>
                      <input type="email" placeholder="jane@email.com" value={orderForm.email} onChange={e => setOrderForm({ ...orderForm, email: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Delivery Address *</label>
                      <input type="text" placeholder="1234 Main St, Dallas, TX 75201" value={orderForm.address} onChange={e => setOrderForm({ ...orderForm, address: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Event Date * <span className="text-zinc-500 normal-case font-normal">(24-hour lead time required)</span></label>
                      <input type="date" min={getMinDate()} value={orderForm.event_date} onChange={e => setOrderForm({ ...orderForm, event_date: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Special Requests</label>
                      <textarea placeholder="Allergies, setup notes, gate codes..." value={orderForm.special_requests} onChange={e => setOrderForm({ ...orderForm, special_requests: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 resize-none h-20 text-sm" />
                    </div>
                  </div>
                  {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
                  <div className="flex items-center justify-between mt-6 mb-3">
                    <span className="text-zinc-400 font-bold">Order total</span>
                    <span className="text-white font-black text-2xl">${selectedSize.price}</span>
                  </div>
                  <button onClick={handleOrderSubmit} disabled={submitting} className="w-full bg-teal-500 hover:bg-teal-400 text-black font-black py-4 rounded-full text-lg transition-colors disabled:opacity-50">
                    {submitting ? "Placing order..." : `Place Catering Order — $${selectedSize.price}`}
                  </button>
                  <p className="text-zinc-600 text-xs text-center mt-3">Payment collected on delivery. We'll confirm by phone.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* QUOTE / CONTACT FORM */}
        {flow === "quote" && (
          <div>
            <button onClick={() => setFlow("choose")} className="text-zinc-400 hover:text-white text-sm mb-8">← Back</button>
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h2 className="text-xl font-black mb-2">Tell us about your event</h2>
              <p className="text-zinc-400 text-sm mb-6">Our sales team will reach out within 24 hours to put together a custom proposal.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Full Name *</label>
                    <input type="text" placeholder="Jane Smith" value={quoteForm.name} onChange={e => setQuoteForm({ ...quoteForm, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Phone *</label>
                    <input type="tel" placeholder="(214) 555-0100" value={quoteForm.phone} onChange={e => setQuoteForm({ ...quoteForm, phone: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Email *</label>
                  <input type="email" placeholder="jane@email.com" value={quoteForm.email} onChange={e => setQuoteForm({ ...quoteForm, email: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Event Date *</label>
                    <input type="date" value={quoteForm.event_date} onChange={e => setQuoteForm({ ...quoteForm, event_date: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Headcount</label>
                    <input type="text" placeholder="e.g. 50 people" value={quoteForm.headcount} onChange={e => setQuoteForm({ ...quoteForm, headcount: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Event Type</label>
                  <input type="text" placeholder="e.g. Corporate lunch, Wedding, Shiva, School event..." value={quoteForm.event_type} onChange={e => setQuoteForm({ ...quoteForm, event_type: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Event Location</label>
                  <input type="text" placeholder="Address or venue name" value={quoteForm.location} onChange={e => setQuoteForm({ ...quoteForm, location: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Budget Range</label>
                  <select value={quoteForm.budget} onChange={e => setQuoteForm({ ...quoteForm, budget: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400 text-sm">
                    <option value="">Select a range...</option>
                    <option>Under $500</option>
                    <option>$500 – $1,000</option>
                    <option>$1,000 – $2,500</option>
                    <option>$2,500 – $5,000</option>
                    <option>$5,000+</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Anything else we should know?</label>
                  <textarea placeholder="Dietary restrictions, vibe, special requests..." value={quoteForm.notes} onChange={e => setQuoteForm({ ...quoteForm, notes: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 resize-none h-24 text-sm" />
                </div>
              </div>
              {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
              <button onClick={handleQuoteSubmit} disabled={submitting} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-full text-lg transition-colors mt-6 disabled:opacity-50">
                {submitting ? "Sending..." : "Send My Catering Inquiry"}
              </button>
              <p className="text-zinc-600 text-xs text-center mt-3">We'll be in touch within 24 hours. No commitment required.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
