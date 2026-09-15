"use client";
import { useState, useEffect } from "react";

const CUTOFF = new Date("2026-09-20T15:00:00Z"); // Sep 20 @ 10 AM CDT

export default function YomKippurPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (new Date() >= CUTOFF) return; // past deadline — never show
    const seen = sessionStorage.getItem("yk_popup_seen");
    if (seen) return;
    const timer = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("yk_popup_seen", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} />

      {/* Card */}
      <div className="relative bg-zinc-900 border border-indigo-500/40 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors text-xl font-black leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="text-5xl mb-4">🕍</div>

        <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-2">Yom Kippur · Break Fast</p>
        <h2 className="text-2xl font-black mb-3 leading-tight">
          Have you ordered your<br />Break Fast Package?
        </h2>
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
          Bagels, tuna, egg &amp; salmon salads, Caesar salad, and coffee cake — delivered Sunday evening. Order by <span className="text-white font-bold">Sep 20 at 10 AM</span>.
        </p>

        <a
          href="/yom-kippur"
          onClick={dismiss}
          className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-full transition-colors mb-3"
        >
          Order Now — $100
        </a>
        <button
          onClick={dismiss}
          className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          Already ordered, thanks!
        </button>
      </div>
    </div>
  );
}
