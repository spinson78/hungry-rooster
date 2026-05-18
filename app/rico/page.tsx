"use client";
import { useState } from "react";

export default function RicoSauceyPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), source: "rico" }),
    });
    setSubmitted(true);
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
          <a href="/menu" className="hover:text-white transition-colors">Menu</a>
          <a href="/#concepts" className="hover:text-white transition-colors">Our Concepts</a>
        </div>
        <a href="/" className="text-zinc-400 hover:text-white font-bold text-sm transition-colors">
          ← Back to THR
        </a>
      </nav>

      {/* HERO */}
      <section className="min-h-screen flex flex-col md:flex-row overflow-hidden">

        {/* LEFT — Text */}
        <div className="md:w-1/2 flex flex-col justify-center px-8 md:px-16 py-16 md:py-24 order-2 md:order-1">
          <p className="text-red-500 font-black text-sm uppercase tracking-widest mb-4">
            A Hungry Rooster Concept · 1499 Regal Row, Dallas TX
          </p>
          <h1 className="text-7xl md:text-8xl font-black tracking-tight leading-none mb-6">
            Rico<br />
            <span className="text-yellow-400">Saucey.</span>
          </h1>
          <p className="text-2xl md:text-3xl font-black text-zinc-200 leading-snug mb-8">
            Sauced. Certified.<br />
            <span className="text-red-500">Unapologetically Delicious.</span>
          </p>
          <p className="text-zinc-400 text-lg leading-relaxed mb-10 max-w-md">
            The walk-up kiosk with the attitude. Dirty sodas, fresh daily pastries,
            cold grab-n-go, and sauce that slaps. Find him at the coop while your food is up —
            or just because Rico said so.
          </p>

          {/* What we got chips */}
          <div className="flex flex-wrap gap-3 mb-10">
            {["Dirty Sodas", "Daily Pastries", "Cold Grab-n-Go", "Signature Sauces"].map(tag => (
              <span key={tag} className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm font-bold px-4 py-2 rounded-full">
                {tag}
              </span>
            ))}
          </div>

          {/* Location */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 inline-flex items-center gap-4 self-start">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <div>
              <p className="font-black text-sm">Find the kiosk</p>
              <p className="text-zinc-400 text-xs">1499 Regal Row, Suite 206 · Dallas, TX 75247</p>
            </div>
          </div>
        </div>

        {/* RIGHT — Rico */}
        <div className="md:w-1/2 relative flex items-end justify-center order-1 md:order-2 pt-8 md:pt-0" style={{ minHeight: "50vh" }}>
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent hidden md:block z-10" />
          <img
            src="/rico%20saucey.png"
            alt="Rico Saucey"
            className="w-full max-w-sm md:max-w-none md:h-full object-contain object-bottom relative z-0"
            style={{ maxHeight: "90vh" }}
          />
        </div>
      </section>

      {/* DIVIDER */}
      <div className="border-t border-zinc-900" />

      {/* DIRTY SODAS */}
      <section className="px-8 md:px-16 py-20 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-4 flex-wrap gap-4">
          <div>
            <p className="text-red-500 font-bold text-xs uppercase tracking-widest mb-2">The Lineup</p>
            <h2 className="text-4xl md:text-5xl font-black">Dirty Sodas.</h2>
          </div>
          <span className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest">
            Menu Dropping Soon
          </span>
        </div>
        <p className="text-zinc-400 text-lg mb-12 max-w-xl">
          Curated. Named. Absolutely not your average fountain drink.
          Rico&apos;s building the menu — names have been chosen, flavors have been tested,
          and the coop is about to get very sauced.
        </p>

        {/* Teaser name cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            "Pullet Fiction",
            "Notorious C.L.U.C.K.",
            "Coop DeVille",
            "Breaking Bawk",
            "The Mandacawrian",
            "Hen Solo",
          ].map((name) => (
            <div key={name} className="bg-zinc-900 border border-zinc-800 hover:border-red-500/40 rounded-2xl p-6 transition-colors group">
              <div className="w-8 h-8 rounded-full bg-zinc-800 group-hover:bg-red-500/20 flex items-center justify-center mb-4 transition-colors">
                <span className="text-zinc-600 group-hover:text-red-400 text-lg transition-colors">?</span>
              </div>
              <p className="font-black text-lg text-white mb-1">{name}</p>
              <p className="text-zinc-600 text-xs font-bold uppercase tracking-wide">Recipe classified</p>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-zinc-900" />

      {/* DAILY PASTRIES */}
      <section className="px-8 md:px-16 py-20 max-w-6xl mx-auto">
        <div className="md:flex items-center gap-16">
          <div className="flex-1 mb-10 md:mb-0">
            <p className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-2">From the THR Kitchen</p>
            <h2 className="text-4xl font-black mb-4">Fresh Daily Pastries.</h2>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
              Every morning, the kitchen bakes. Every morning, Rico has something
              fresh waiting for you. Bourekas, cookies, morning sweets —
              scratch-made, Fred-approved, Rico-certified.
            </p>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            {[
              { name: "Bourekas", note: "Spinach · Mushroom · Potato" },
              { name: "Cookies", note: "Sprinkle · Chocolate Bullseye" },
              { name: "Brownies", note: "Dense. Fudgy. Non-negotiable." },
              { name: "Morning Sweets", note: "Ask what's fresh today" },
            ].map(item => (
              <div key={item.name} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <p className="font-black text-base mb-1">{item.name}</p>
                <p className="text-zinc-500 text-xs">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-zinc-900" />

      {/* SAUCE DROP */}
      <section className="px-8 md:px-16 py-20 max-w-6xl mx-auto">
        <p className="text-red-500 font-bold text-xs uppercase tracking-widest mb-2">The Sauce Drop</p>
        <h2 className="text-4xl md:text-5xl font-black mb-4">Coming for your fridge.</h2>
        <p className="text-zinc-400 text-lg mb-12 max-w-xl">
          Bottled. Labeled. Ready to live on your counter.
          Rico&apos;s first sauce drop is in the works — no date, no apologies.
          You&apos;ll know when it&apos;s time.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Fred's Sauce */}
          <div className="bg-zinc-900 border border-zinc-800 hover:border-yellow-400/40 rounded-2xl p-8 transition-colors flex gap-6 items-center">
            <div className="w-20 h-24 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-zinc-700">
              <img src="/freds-sauce-label.png" alt="Fred's Sauce" className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }} />
              <span className="text-3xl hidden">🍗</span>
            </div>
            <div>
              <p className="text-yellow-400 font-black text-xs uppercase tracking-widest mb-1">Signature</p>
              <p className="font-black text-xl mb-2">Fred&apos;s Sauce</p>
              <p className="text-zinc-400 text-sm">The one on every sandwich. The one people ask about. Now coming for your home kitchen.</p>
              <span className="mt-3 inline-block bg-zinc-800 text-zinc-500 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide">Dropping Soon</span>
            </div>
          </div>

          {/* Parve Caesar */}
          <div className="bg-zinc-900 border border-zinc-800 hover:border-teal-500/40 rounded-2xl p-8 transition-colors flex gap-6 items-center">
            <div className="w-20 h-24 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-zinc-700">
              <img src="/caesar-label.png" alt="Parve Caesar" className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }} />
              <span className="text-3xl hidden">🥗</span>
            </div>
            <div>
              <p className="text-teal-400 font-black text-xs uppercase tracking-widest mb-1">Crowd Favorite</p>
              <p className="font-black text-xl mb-2">House Parve Caesar</p>
              <p className="text-zinc-400 text-sm">The dressing that keeps people coming back. 100% parve, 100% unmatched. Grab a bottle.</p>
              <span className="mt-3 inline-block bg-zinc-800 text-zinc-500 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide">Dropping Soon</span>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-zinc-900" />

      {/* MERCH */}
      <section className="px-8 md:px-16 py-20 max-w-6xl mx-auto">
        <p className="text-red-500 font-bold text-xs uppercase tracking-widest mb-2">The Drip</p>
        <h2 className="text-4xl font-black mb-4">Wear the attitude.</h2>
        <p className="text-zinc-400 text-lg mb-12 max-w-xl">
          Rico&apos;s got merch. Of course he does.
          Tees and hats for the ones who get it — dropping when they&apos;re ready.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Tee placeholder */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="aspect-square bg-zinc-950 flex items-center justify-center relative" id="tee-slot">
              <img src="/rico-tshirt-mockup.png" alt="Rico Saucey Tee" className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-3">
                  <span className="text-2xl">👕</span>
                </div>
                <p className="text-zinc-600 font-bold text-sm">Mockup dropping soon</p>
              </div>
            </div>
            <div className="p-6">
              <p className="font-black text-lg">Rico Saucey Tee</p>
              <p className="text-zinc-500 text-sm mt-1">Because someone had to rep the coop properly.</p>
            </div>
          </div>

          {/* Hat placeholder */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="aspect-square bg-zinc-950 flex items-center justify-center relative">
              <img src="/rico-hat-mockup.png" alt="Rico Saucey Hat" className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-3">
                  <span className="text-2xl">🧢</span>
                </div>
                <p className="text-zinc-600 font-bold text-sm">Mockup dropping soon</p>
              </div>
            </div>
            <div className="p-6">
              <p className="font-black text-lg">Rico Saucey Hat</p>
              <p className="text-zinc-500 text-sm mt-1">Tatted. Certified. On your head.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-zinc-900" />

      {/* NOTIFY */}
      <section className="px-8 md:px-16 py-20 max-w-3xl mx-auto text-center">
        <p className="text-red-500 font-bold text-xs uppercase tracking-widest mb-3">Stay in the loop</p>
        <h2 className="text-4xl font-black mb-4">First to know.<br />First to sip.</h2>
        <p className="text-zinc-400 text-lg mb-8">
          Soda menu. Sauce drop. Merch launch. Rico will let you know — when he&apos;s ready.
        </p>
        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-full px-5 py-3 text-white text-sm placeholder-zinc-500 outline-none transition-colors" />
            <button type="submit"
              className="bg-red-500 hover:bg-red-400 text-white font-black px-6 py-3 rounded-full text-sm transition-colors whitespace-nowrap">
              Notify Me
            </button>
          </form>
        ) : (
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl px-6 py-5 max-w-md mx-auto">
            <p className="text-red-400 font-black text-lg mb-1">You&apos;re in. 🔥</p>
            <p className="text-zinc-400 text-sm">Rico will hit you when it&apos;s time. Don&apos;t blink.</p>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-8 w-auto opacity-50" />
          <p className="text-zinc-600 text-xs text-center">
            Rico Saucey is a Hungry Rooster concept · 1499 Regal Row, Dallas TX
          </p>
          <a href="/" className="text-zinc-400 hover:text-white text-sm font-bold transition-colors">
            ← Back to The Hungry Rooster
          </a>
        </div>
      </footer>

    </main>
  );
}
