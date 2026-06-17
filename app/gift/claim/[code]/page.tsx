"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const DELIVERY_DAYS = [1, 2, 4, 5]; // Mon/Tue/Thu/Fri
function isDeliveryDay(dateStr: string): boolean {
  if (!dateStr) return false;
  return DELIVERY_DAYS.includes(new Date(dateStr + "T12:00:00").getDay());
}

type GiftData = {
  package_name: string;
  serves: string;
  purchaser_name: string;
  recipient_name: string;
  message: string;
  claim_code: string;
};

export default function ClaimPage() {
  const params = useParams();
  const code = (params?.code as string || "").toUpperCase();

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [gift, setGift] = useState<GiftData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCityZip, setDeliveryCityZip] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!code) { setLoading(false); setErrorMsg("No gift code found."); return; }
    fetch(`/api/gift-claim?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) { setGift(data); setValid(true); }
        else setErrorMsg(data.message || "Gift not found.");
      })
      .catch(() => setErrorMsg("Could not load gift details."))
      .finally(() => setLoading(false));
  }, [code]);

  const handleClaim = async () => {
    if (!deliveryDate) { setErrorMsg("Please pick a delivery date."); return; }
    if (!isDeliveryDay(deliveryDate)) { setErrorMsg("We deliver Mon, Tue, Thu & Fri only. Please pick one of those days."); return; }
    if (!deliveryAddress.trim() || !deliveryCityZip.trim()) { setErrorMsg("Please enter your delivery address."); return; }
    setErrorMsg("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/gift-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, deliveryDate, deliveryAddress, deliveryCityZip }),
      });
      const data = await res.json();
      if (data.success) setClaimed(true);
      else setErrorMsg(data.message || "Could not claim gift. Please contact us.");
    } catch { setErrorMsg("Network error. Please try again."); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <main className="bg-black text-white min-h-screen flex items-center justify-center">
      <p className="text-zinc-400 text-lg">Loading your gift...</p>
    </main>
  );

  if (claimed) return (
    <main className="bg-black text-white min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🍽️</div>
        <h1 className="text-4xl font-black mb-3">Dinner is booked!</h1>
        <p className="text-zinc-400 text-lg mb-2">We've got your order. Dinner's coming your way.</p>
        <p className="text-zinc-500 text-sm mb-8">We'll confirm your delivery closer to the date. Keep an eye out!</p>
        <a href="/" className="bg-teal-500 hover:bg-teal-400 text-black font-black px-8 py-4 rounded-full inline-block transition-colors">
          Back to Home
        </a>
      </div>
    </main>
  );

  if (!valid || !gift) return (
    <main className="bg-black text-white min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-6">🐓</div>
        <h1 className="text-3xl font-black mb-3">{errorMsg || "Gift not found"}</h1>
        <p className="text-zinc-400 mb-6">If you think this is an error, reach out and we'll sort it out.</p>
        <a href="/" className="bg-teal-500 text-black font-black px-8 py-4 rounded-full inline-block">Back to Home</a>
      </div>
    </main>
  );

  return (
    <main className="bg-black text-white min-h-screen">
      <nav className="bg-black border-b border-zinc-800 px-6 py-4 flex items-center">
        <a href="/"><img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-12 w-auto" /></a>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-2">You've received a gift</p>
          <h1 className="text-3xl font-black">
            {gift.recipient_name ? `${gift.recipient_name}, dinner's on ` : "Dinner's on "}
            {gift.purchaser_name ? gift.purchaser_name : "a friend"}!
          </h1>
        </div>

        {/* Gift card */}
        <div className="bg-zinc-900 border border-teal-500/40 rounded-2xl p-6 mb-8 text-center">
          <p className="text-teal-400 text-sm font-semibold uppercase tracking-wide mb-2">Your Gift</p>
          <p className="text-2xl font-black">{gift.package_name}</p>
          {gift.serves && <p className="text-zinc-400 text-sm mt-1">{gift.serves}</p>}
          {gift.message && (
            <blockquote className="mt-4 border-l-4 border-yellow-400 pl-4 text-left text-zinc-300 italic text-sm">
              {gift.message}
            </blockquote>
          )}
        </div>

        {/* Claim form */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-5">
          <h2 className="font-black text-xl">Schedule Your Delivery</h2>

          <div>
            <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Delivery Date</label>
            <input type="date" min={today} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
              className={`mt-1 w-full bg-zinc-800 border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-400 ${deliveryDate && !isDeliveryDay(deliveryDate) ? "border-red-500" : "border-zinc-700"}`} />
            {deliveryDate && !isDeliveryDay(deliveryDate)
              ? <p className="text-red-400 text-xs mt-1">We deliver Mon, Tue, Thu & Fri only.</p>
              : <p className="text-zinc-500 text-xs mt-1">Available Mon, Tue, Thu & Fri. We deliver within 30 miles of Dallas.</p>
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

          {errorMsg && <p className="text-red-400 text-sm font-semibold">{errorMsg}</p>}

          <button
            onClick={handleClaim}
            disabled={submitting}
            className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black font-black py-4 rounded-full text-lg transition-colors"
          >
            {submitting ? "Scheduling..." : "Claim My Dinner"}
          </button>
        </div>
      </div>
    </main>
  );
}
