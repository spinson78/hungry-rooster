"use client";
import { useEffect, useState } from "react";

const CUTOFF = new Date("2026-11-24T06:00:00Z"); // Nov 23 midnight CST

export default function ThanksgivingPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show after cutoff
    if (new Date() >= CUTOFF) return;
    // Only once per session
    if (sessionStorage.getItem("tg_popup_dismissed")) return;
    // Show after a short delay
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("tg_popup_dismissed", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative bg-zinc-950 border border-orange-500/40 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
        <button onClick={dismiss}
          className="absolute top-4 right-4 text-zinc-600 hover:text-white text-xl leading-none transition-colors">
          ✕
        </button>

        <p className="text-5xl mb-4">🦃</p>
        <p className="text-orange-400 font-black text-xs uppercase tracking-widest mb-2">Pre-Order Now Open</p>
        <h2 className="text-white font-black text-2xl mb-2">Thanksgiving<br />Side Dishes & Pies</h2>
        <p className="text-zinc-400 text-sm mb-1">Delivered Wednesday, November 26</p>
        <p className="text-zinc-500 text-xs mb-6">Order by midnight November 23</p>

        <div className="text-left bg-zinc-900 rounded-2xl px-5 py-4 mb-6 space-y-1 text-sm text-zinc-300">
          <p>🍞 Dinner Rolls · Green Beans · Stuffing</p>
          <p>🍠 Sweet Potatoes · Mashed Potatoes</p>
          <p>🫙 Cranberry Sauce</p>
          <p>🥧 Apple, Pecan & Pumpkin Pies</p>
        </div>

        <a href="/thanksgiving" onClick={dismiss}
          className="block w-full bg-orange-500 hover:bg-orange-400 text-black font-black py-4 rounded-full text-base transition-colors mb-3">
          Order Now 🦃
        </a>
        <button onClick={dismiss} className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">
          No thanks
        </button>
      </div>
    </div>
  );
}
