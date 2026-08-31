"use client";
import { useEffect, useState } from "react";

const CUTOFF = new Date("2026-09-10T05:00:00Z"); // midnight Sep 9 CDT

interface Props {
  orderHref?: string;
}

export default function SimanimPopup({ orderHref = "/rosh-hashanah" }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (new Date() >= CUTOFF) return;
    const seen = sessionStorage.getItem("simanim_popup_seen");
    if (!seen) setVisible(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("simanim_popup_seen", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={dismiss} />

      {/* Panel */}
      <div className="relative z-10 bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 z-20 text-zinc-500 hover:text-white transition-colors text-2xl leading-none font-black bg-zinc-950/80 rounded-full w-8 h-8 flex items-center justify-center"
          aria-label="Close"
        >
          ×
        </button>

        {/* Image */}
        <div className="w-full h-48 sm:h-56 overflow-hidden bg-zinc-900 flex-shrink-0">
          <img
            src="/simanim.png"
            alt="Edible Focaccia Simanim Board"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-2">
            Meet the Rosh Hashanah Showstopper!
          </p>
          <h2 className="text-2xl font-black tracking-tight leading-tight mb-1">
            Edible Focaccia Simanim Board
          </h2>
          <p className="text-yellow-400 font-black text-lg mb-3">$200</p>

          <p className="text-zinc-300 text-sm mb-3 leading-relaxed">
            The gift that shows off <em>and</em> feeds the table. A full sheet of house-made focaccia loaded with holiday magic:
          </p>

          <p className="text-zinc-400 text-xs leading-relaxed mb-3">
            Roasted Apple Chutney · Pomegranate Vinaigrette · Date Harissa · Texas Caviar · Beet Hummus · Caramelized Leek Confit · Squash Baba Ganoush · Cracked Pepper Pickled Herring · Moroccan Carrot Salad · Classic Honey Jar
          </p>

          <p className="text-zinc-300 text-sm font-bold mb-4">
            Always fun. Always innovative. Always delicious.{" "}
            <span className="font-normal text-zinc-400">One giant sheet of yumminess. One seriously unforgettable Rosh Hashanah table.</span>
          </p>

          <a
            href={orderHref}
            onClick={dismiss}
            className="block w-full text-center bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-2xl text-base transition-colors"
          >
            Order Here →
          </a>

          <p className="text-zinc-600 text-xs text-center mt-3">Order by September 9 · Delivery Friday Sep 11</p>
        </div>
      </div>
    </div>
  );
}
