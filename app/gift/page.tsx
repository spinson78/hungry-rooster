"use client";
import { useState } from "react";

const DELIVERY_DAYS = [1, 2, 4, 5]; // Mon/Tue/Thu/Fri
function isDeliveryDay(dateStr: string): boolean {
  if (!dateStr) return false;
  return DELIVERY_DAYS.includes(new Date(dateStr + "T12:00:00").getDay());
}
function isFriday(dateStr: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr + "T12:00:00").getDay() === 5;
}
function isPastCutoff(dateStr: string): boolean {
  // Same-day orders must be placed before 12 PM (noon) Central Time
  const now = new Date();
  const todayCST = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
  const todayStr = todayCST.toISOString().split("T")[0];
  if (dateStr !== todayStr) return false;
  return todayCST.getHours() >= 12;
}

const GIFT_CARD_AMOUNTS = [25, 50, 75, 100, 150, 200];

const DINNER_PACKAGES = [
  { name: "Dinner for 4-6", price: 85, serves: "Serves 4-6", description: "Weekly rotation — beef, chicken, or fish. Menu posted on the website week of.", fridayOnly: false },
  { name: "Fish Dinner for 4-6", price: 100, serves: "Serves 4-6", description: "Always available. 6 pcs roasted salmon, mashed potatoes, roasted veggies, house salad. Great pick when the weekly dinner isn't fish.", fridayOnly: false },
  { name: "Shabbat Dinner for 2", price: 65, serves: "Serves 2", description: "Friday delivery only", fridayOnly: true },
  { name: "Shabbat Dinner for 4-6", price: 115, serves: "Serves 4-6", description: "Friday delivery only", fridayOnly: true },
];

const COOKIE_ADDON = { name: "A Dozen Mini Cookies", price: 24 };

type Tab = "gift_card" | "scheduled" | "claim_code";

export default function GiftPage() {
  const [tab, setTab] = useState<Tab>("gift_card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Gift card state
  const [gcAmount, setGcAmount] = useState<number | "custom">(50);
  const [gcCustom, setGcCustom] = useState("");
  const [gcForm, setGcForm] = useState({ purchaserName: "", purchaserEmail: "", recipientName: "", recipientEmail: "", message: "" });

  // Dinner gift shared state
  const [selectedPackage, setSelectedPackage] = useState(DINNER_PACKAGES[0]);
  const [addCookies, setAddCookies] = useState(false);
  const [dinnerForm, setDinnerForm] = useState({ purchaserName: "", purchaserEmail: "", recipientName: "", recipientEmail: "", recipientPhone: "", message: "" });

  // Scheduled-only state
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCityZip, setDeliveryCityZip] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const packageTotal = selectedPackage.price + (addCookies ? COOKIE_ADDON.price : 0);

  const deliveryDateError = () => {
    if (!deliveryDate) return "";
    if (!isDeliveryDay(deliveryDate)) return "We deliver Mon, Tue, Thu & Fri only.";
    if (selectedPackage.fridayOnly && !isFriday(deliveryDate)) return "Shabbat orders deliver Friday only.";
    if (isPastCutoff(deliveryDate)) return "Same-day orders must be placed before 12 PM. Please choose a future date.";
    return "";
  };

  const handleGiftCard = async () => {
    setError("");
    const amount = gcAmount === "custom" ? parseFloat(gcCustom) : gcAmount;
    if (!amount || amount < 10) { setError("Minimum gift card amount is $10."); return; }
    if (!gcForm.purchaserName.trim() || !gcForm.purchaserEmail.trim()) { setError("Please enter your name and email."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/gift-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftType: "gift_card", amount: String(amount), ...gcForm }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || "Something went wrong.");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const handleDinnerGift = async () => {
    setError("");
    if (!dinnerForm.purchaserName.trim() || !dinnerForm.purchaserEmail.trim()) { setError("Please enter your name and email."); return; }
    if (!dinnerForm.recipientName.trim()) { setError("Please enter the recipient\'s name."); return; }
    if (tab === "scheduled") {
      if (!deliveryDate) { setError("Please pick a delivery date."); return; }
      const dateErr = deliveryDateError();
      if (dateErr) { setError(dateErr); return; }
      if (!deliveryAddress.trim() || !deliveryCityZip.trim()) { setError("Please enter the delivery address."); return; }
    } else {
      if (!dinnerForm.recipientEmail.trim()) { setError("Please enter the recipient\'s email so we can send their claim link."); return; }
    }
    setLoading(true);
    try {
      const res = await fetch("/api/gift-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftType: "dinner_gift",
          dinnerGiftType: tab,
          packageName: selectedPackage.name,
          packagePrice: String(selectedPackage.price),
          serves: selectedPackage.serves,
          addCookies,
          ...dinnerForm,
          deliveryDate: tab === "scheduled" ? deliveryDate : "",
          deliveryAddress: tab === "scheduled" ? deliveryAddress : "",
          deliveryCityZip: tab === "scheduled" ? deliveryCityZip : "",
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || "Something went wrong.");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const gcFinalAmount = gcAmount === "custom" ? parseFloat(gcCustom) || 0 : gcAmount;

  const PackageSelector = () => (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <h2 className="font-black text-xl mb-4">Choose a Package</h2>
      <div className="space-y-3 mb-4">
        {DINNER_PACKAGES.map((pkg) => (
          <button
            key={pkg.name}
            onClick={() => { setSelectedPackage(pkg); setAddCookies(false); }}
            className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${selectedPackage.name === pkg.name ? "border-teal-400 bg-teal-400/10" : "border-zinc-700 hover:border-zinc-500"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-black">{pkg.name}</p>
                  {pkg.fridayOnly && <span className="text-xs bg-yellow-400/20 text-yellow-400 font-bold px-2 py-0.5 rounded-full">Friday only</span>}
                </div>
                <p className="text-zinc-400 text-sm mt-0.5">{pkg.description}</p>
              </div>
              <span className="font-black text-xl text-teal-400 shrink-0 ml-4">${pkg.price}</span>
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={() => setAddCookies(!addCookies)}
        className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${addCookies ? "border-yellow-400 bg-yellow-400/10" : "border-zinc-700 hover:border-zinc-500"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${addCookies ? "border-yellow-400 bg-yellow-400" : "border-zinc-500"}`}>
              {addCookies && <span className="text-black text-xs font-black">+</span>}
            </div>
            <div>
              <p className="font-black text-sm">Add-on: A Dozen Mini Cookies</p>
              <p className="text-zinc-400 text-xs">Freshly baked, delivered with the order</p>
            </div>
          </div>
          <span className="font-black text-yellow-400 shrink-0 ml-4">+$24</span>
        </div>
      </button>
    </div>
  );

  const OrderSummary = ({ onSubmit, label }: { onSubmit: () => void; label: string }) => (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-1">
        <span className="text-zinc-400">{selectedPackage.name}</span>
        <span className="font-black">${selectedPackage.price.toFixed(2)}</span>
      </div>
      {addCookies && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-zinc-400">{COOKIE_ADDON.name}</span>
          <span className="font-black">${COOKIE_ADDON.price.toFixed(2)}</span>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <span className="text-zinc-400">Tax (8.25%)</span>
        <span className="font-black">${(packageTotal * 0.0825).toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between text-xl font-black mb-5 border-t border-zinc-700 pt-4">
        <span>Total</span>
        <span className="text-teal-400">${(packageTotal * 1.0825).toFixed(2)}</span>
      </div>
      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-4 rounded-full text-lg transition-colors"
      >
        {loading ? "Redirecting to payment..." : label}
      </button>
    </div>
  );

  return (
    <main className="bg-black text-white min-h-screen relative overflow-x-hidden">

      {/* Fred Flowers floating background decoration */}
      <div className="pointer-events-none fixed bottom-0 right-0 w-72 md:w-96 opacity-[0.07] select-none z-0" aria-hidden="true">
        <img src="/fred%20flowers.png" alt="" className="w-full object-contain" />
      </div>

      {/* Nav */}
      <nav className="bg-black border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <a href="/">
          <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-12 w-auto" />
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
          <a href="/menu" className="hover:text-white transition-colors">Menu</a>
          <a href="/catering" className="hover:text-white transition-colors">Catering</a>
          <a href="/gift" className="text-yellow-400">Gift Cards</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-10 max-w-3xl mx-auto text-center relative z-10">
        <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-3">The Hungry Rooster</p>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">
          Why send flowers<br />when you can send dinner?
        </h1>
        <p className="text-white text-lg max-w-xl mx-auto">
          Gift cards, surprise deliveries, or a dinner coupon they claim on their own schedule.
          Fred-approved, every time.
        </p>
      </section>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-6 mb-8 relative z-10">
        <div className="flex rounded-xl overflow-hidden border border-zinc-800">
          <button
            onClick={() => setTab("gift_card")}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${tab === "gift_card" ? "bg-yellow-400 text-black" : "bg-zinc-900 text-zinc-400 hover:text-white"}`}
          >
            Gift Card
          </button>
          <button
            onClick={() => setTab("scheduled")}
            className={`flex-1 py-3 text-sm font-bold transition-colors border-l border-zinc-800 ${tab === "scheduled" ? "bg-teal-500 text-black" : "bg-zinc-900 text-zinc-400 hover:text-white"}`}
          >
            Send a Dinner
          </button>
          <button
            onClick={() => setTab("claim_code")}
            className={`flex-1 py-3 text-sm font-bold transition-colors border-l border-zinc-800 ${tab === "claim_code" ? "bg-teal-500 text-black" : "bg-zinc-900 text-zinc-400 hover:text-white"}`}
          >
            Dinner Coupon
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-20 relative z-10">

        {/* GIFT CARD */}
        {tab === "gift_card" && (
          <div className="space-y-8">
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h2 className="font-black text-xl mb-1">Choose an Amount</h2>
              <p className="text-zinc-400 text-sm mb-5">Good on any order. No expiration.</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {GIFT_CARD_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => { setGcAmount(amt); setGcCustom(""); }}
                    className={`py-3 rounded-xl font-black text-lg transition-colors border-2 ${gcAmount === amt ? "border-yellow-400 bg-yellow-400/10 text-yellow-400" : "border-zinc-700 text-zinc-300 hover:border-zinc-500"}`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setGcAmount("custom")}
                className={`w-full py-3 rounded-xl font-bold text-sm border-2 transition-colors ${gcAmount === "custom" ? "border-yellow-400 bg-yellow-400/10 text-yellow-400" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
              >
                Custom Amount
              </button>
              {gcAmount === "custom" && (
                <div className="mt-3 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                  <input
                    type="number" min="10" placeholder="Enter amount (min $10)"
                    value={gcCustom} onChange={(e) => setGcCustom(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 pl-8 py-3 text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>
              )}
            </div>

            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
              <h2 className="font-black text-xl">Your Info</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Your Name</label>
                  <input value={gcForm.purchaserName} onChange={(e) => setGcForm({ ...gcForm, purchaserName: e.target.value })}
                    className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400" placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Your Email</label>
                  <input type="email" value={gcForm.purchaserEmail} onChange={(e) => setGcForm({ ...gcForm, purchaserEmail: e.target.value })}
                    className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400" placeholder="you@email.com" />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
              <h2 className="font-black text-xl">Recipient Info <span className="text-zinc-500 text-sm font-normal">(optional)</span></h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Recipient Name</label>
                  <input value={gcForm.recipientName} onChange={(e) => setGcForm({ ...gcForm, recipientName: e.target.value })}
                    className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400" placeholder="Friend's name" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Recipient Email</label>
                  <input type="email" value={gcForm.recipientEmail} onChange={(e) => setGcForm({ ...gcForm, recipientEmail: e.target.value })}
                    className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400" placeholder="We'll email the code" />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Personal Message <span className="font-normal">(optional)</span></label>
                <textarea value={gcForm.message} onChange={(e) => setGcForm({ ...gcForm, message: e.target.value })}
                  rows={3} placeholder="Add a note to include with their gift card..."
                  className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400 resize-none" />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}

            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-zinc-400">Gift Card Value</span>
                <span className="font-black text-xl">{gcFinalAmount > 0 ? `$${gcFinalAmount.toFixed(2)}` : "—"}</span>
              </div>
              <button
                onClick={handleGiftCard}
                disabled={loading || gcFinalAmount < 10}
                className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-4 rounded-full text-lg transition-colors"
              >
                {loading ? "Redirecting to payment..." : `Buy $${gcFinalAmount > 0 ? gcFinalAmount.toFixed(2) : "—"} Gift Card`}
              </button>
            </div>
          </div>
        )}

        {/* SCHEDULED DINNER */}
        {tab === "scheduled" && (
          <div className="space-y-8">
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h2 className="font-black text-xl mb-1">Send a Surprise Dinner</h2>
              <p className="text-zinc-400 text-sm">You pick the package, date, and address. We show up. They're surprised. Like flowers — but better.</p>
            </div>

            <PackageSelector />

            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
              <h2 className="font-black text-xl">Delivery Details</h2>
              <div>
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Delivery Date</label>
                <input type="date" min={today} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                  className={`mt-1 w-full bg-zinc-800 border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-400 ${deliveryDate && deliveryDateError() ? "border-red-500" : "border-zinc-700"}`} />
                {deliveryDate && deliveryDateError()
                  ? <p className="text-red-400 text-xs mt-1">{deliveryDateError()}</p>
                  : <p className="text-zinc-500 text-xs mt-1">{selectedPackage.fridayOnly ? "Friday delivery only" : "Available Mon, Tue, Thu & Fri"}</p>
                }
              </div>
              <div>
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Street Address</label>
                <input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-400" placeholder="1234 Oak Lane" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">City, State ZIP</label>
                <input value={deliveryCityZip} onChange={(e) => setDeliveryCityZip(e.target.value)}
                  className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-400" placeholder="Dallas, TX 75201" />
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
              <h2 className="font-black text-xl">Recipient Info</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Recipient Name</label>
                  <input value={dinnerForm.recipientName} onChange={(e) => setDinnerForm({ ...dinnerForm, recipientName: e.target.value })}
                    className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-400" placeholder="Who's getting dinner?" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Their Phone <span className="font-normal">(optional)</span></label>
                  <input type="tel" value={dinnerForm.recipientPhone} onChange={(e) => setDinnerForm({ ...dinnerForm, recipientPhone: e.target.value })}
                    className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-400" placeholder="For delivery updates" />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Their Email <span className="font-normal">(optional)</span></label>
                <input type="email" value={dinnerForm.recipientEmail} onChange={(e) => setDinnerForm({ ...dinnerForm, recipientEmail: e.target.value })}
                  className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-400" placeholder="recipient@email.com" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Personal Message <span className="font-normal">(optional)</span></label>
                <textarea value={dinnerForm.message} onChange={(e) => setDinnerForm({ ...dinnerForm, message: e.target.value })}
                  rows={3} placeholder="We'll include this with the delivery..."
                  className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-400 resize-none" />
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
              <h2 className="font-black text-xl">Your Info</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Your Name</label>
                  <input value={dinnerForm.purchaserName} onChange={(e) => setDinnerForm({ ...dinnerForm, purchaserName: e.target.value })}
                    className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-400" placeholder="Your name" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Your Email</label>
                  <input type="email" value={dinnerForm.purchaserEmail} onChange={(e) => setDinnerForm({ ...dinnerForm, purchaserEmail: e.target.value })}
                    className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-400" placeholder="For your receipt" />
                </div>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}
            <OrderSummary onSubmit={handleDinnerGift} label="Send This Dinner" />
          </div>
        )}

        {/* DINNER COUPON */}
        {tab === "claim_code" && (
          <div className="space-y-8">
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h2 className="font-black text-xl mb-1">Dinner Coupon</h2>
              <p className="text-zinc-400 text-sm">You pay, they get a claim link in their email. They pick their date, enter their address, and we deliver. Perfect when you don't know their schedule.</p>
            </div>

            <PackageSelector />

            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
              <h2 className="font-black text-xl">Recipient Info</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Recipient Name</label>
                  <input value={dinnerForm.recipientName} onChange={(e) => setDinnerForm({ ...dinnerForm, recipientName: e.target.value })}
                    className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-400" placeholder="Who's getting dinner?" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Recipient Email *</label>
                  <input type="email" value={dinnerForm.recipientEmail} onChange={(e) => setDinnerForm({ ...dinnerForm, recipientEmail: e.target.value })}
                    className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-400" placeholder="We'll send their claim link here" />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Personal Message <span className="font-normal">(optional)</span></label>
                <textarea value={dinnerForm.message} onChange={(e) => setDinnerForm({ ...dinnerForm, message: e.target.value })}
                  rows={3} placeholder="We'll include this in their email..."
                  className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-400 resize-none" />
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
              <h2 className="font-black text-xl">Your Info</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Your Name</label>
                  <input value={dinnerForm.purchaserName} onChange={(e) => setDinnerForm({ ...dinnerForm, purchaserName: e.target.value })}
                    className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-400" placeholder="Your name" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Your Email</label>
                  <input type="email" value={dinnerForm.purchaserEmail} onChange={(e) => setDinnerForm({ ...dinnerForm, purchaserEmail: e.target.value })}
                    className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-400" placeholder="For your receipt" />
                </div>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}
            <OrderSummary onSubmit={handleDinnerGift} label="Send Dinner Coupon" />
          </div>
        )}
      </div>
    </main>
  );
}
