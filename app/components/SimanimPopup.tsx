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

      {/* Panel — narrow, two-column on wider screens */}
      <div className="relative z-10 bg-zinc-950 border border-zinc-800 rounded-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto shadow-2xl">

        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-20 text-zinc-400 hover:text-white transition-colors font-black text-xl bg-black/60 rounded-full w-7 h-7 flex items-center justify-center"
          aria-label="Close"
        >
          ×
        </button>

        {/* Full photo */}
        <img
          src="/simanim.png"
          alt="Edible Focaccia Simanim Board"
          className="w-full h-auto block rounded-t-2xl"
        />

        {/* Content */}
        <div className="px-5 py-4">
          <p className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-1">
            Meet the Rosh Hashanah Showstopper!
          </p>
          <h2 className="text-xl font-black tracking-tight leading-tight mb-0.5">
            Edible Focaccia Simanim Board
          </h2>
          <p className="text-yellow-400 font-black text-base mb-2">$200</p>

          <p className="text-zinc-300 text-xs mb-2 leading-relaxed">
            The gift that shows off <em>and</em> feeds the table — a full sheet of house-made focaccia loaded with holiday magic:
          </p>

          <p className="text-zinc-500 text-xs leading-relaxed mb-2">
            Roasted Apple Chutney · Pomegranate Vinaigrette · Date Harissa · Texas Caviar · Beet Hummus · Caramelized Leek Confit · Squash Baba Ganoush · Cracked Pepper Pickled Herring · Moroccan Carrot Salad · Classic Honey Jar
          </p>

          <p className="text-zinc-300 text-xs font-bold mb-3">
            Always fun. Always innovative. Always delicious.{" "}
            <span className="font-normal text-zinc-500">One seriously unforgettable Rosh Hashanah table.</span>
          </p>

          <a
            href={orderHref}
            onClick={dismiss}
            className="block w-full text-center bg-yellow-400 hover:bg-yellow-300 text-black font-black py-3 rounded-xl text-sm transition-colors"
          >
            Order Here →
          </a>

          <p className="text-zinc-600 text-xs text-center mt-2">Order by Sep 9 · Delivery Friday Sep 11</p>
        </div>
      </div>
    </div>
  );
}
