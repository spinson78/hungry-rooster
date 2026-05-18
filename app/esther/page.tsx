"use client";
import { useState } from "react";

export default function EstherPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), source: "esther" }),
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

      {/* POSTER HERO */}
      <section className="flex flex-col items-center px-6 py-14">
        <div className="w-full max-w-lg">
          <img
            src="/esther%20glow%20up.png"
            alt="Esther is getting a Summer Glow Up — returning Sassier than ever in August!"
            className="w-full rounded-3xl shadow-2xl"
          />
        </div>

        {/* EMAIL CAPTURE */}
        <div className="mt-12 w-full max-w-md text-center">
          <p className="text-white font-black text-xl mb-2">Be first in line when she drops.</p>
          <p className="text-zinc-400 text-sm mb-6">Get notified the moment the travel schedule and menu go live.</p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-yellow-400 rounded-full px-5 py-3 text-white text-sm placeholder-zinc-500 outline-none transition-colors"
              />
              <button
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-6 py-3 rounded-full text-sm transition-colors whitespace-nowrap"
              >
                Notify Me
              </button>
            </form>
          ) : (
            <div className="bg-zinc-900 border border-yellow-400/30 rounded-2xl px-6 py-5">
              <p className="text-yellow-400 font-black text-lg mb-1">You&apos;re on the list. ✨</p>
              <p className="text-zinc-400 text-sm">We&apos;ll hit you first when Esther is ready to roll out.</p>
            </div>
          )}

          <p className="text-zinc-600 text-xs mt-4">No spam. Just Esther. A Hungry Rooster concept.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 px-6 py-10 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-8 w-auto opacity-50" />
          <p className="text-zinc-600 text-xs text-center">
            Esther is a Hungry Rooster concept. Dallas, TX. Coming August 2026.
          </p>
          <a href="/" className="text-zinc-400 hover:text-white text-sm font-bold transition-colors">
            ← Back to The Hungry Rooster
          </a>
        </div>
      </footer>

    </main>
  );
}
