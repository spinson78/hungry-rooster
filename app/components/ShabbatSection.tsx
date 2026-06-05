"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ShabbatMenu = {
  id: string;
  week_of: string;
  protein: string;
  side1: string;
  side2: string;
  extra: string;
  quantity_remaining: number;
  reveal_time: string;
  cutoff_time: string;
  is_active: boolean;
};

type BakeryMenu = {
  id: string;
  items: { name: string; price: number; description: string }[];
  quantity_remaining: number;
  reveal_time: string;
  cutoff_time: string;
  is_active: boolean;
};

export default function ShabbatSection() {
  const [menu, setMenu] = useState<ShabbatMenu | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bakery, setBakery] = useState<BakeryMenu | null>(null);
  const [bakeryOpen, setBakeryOpen] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      const now = new Date();
      const { data } = await supabase
        .from("shabbat_menus")
        .select("*")
        .gte("cutoff_time", now.toISOString())
        .eq("is_active", true)
        .order("cutoff_time", { ascending: true })
        .limit(1);
      if (data && data.length > 0) {
        const shabbat = data[0];
        setMenu(shabbat);
        const reveal = new Date(shabbat.reveal_time);
        const cutoff = new Date(shabbat.cutoff_time);
        setIsRevealed(now >= reveal);
        setIsOpen(now >= reveal && now < cutoff && shabbat.quantity_remaining > 0);
      }
      setLoading(false);
    };

    const fetchBakery = async () => {
      const now = new Date();
      const { data } = await supabase
        .from("bakery_menus")
        .select("*")
        .gte("cutoff_time", now.toISOString())
        .eq("is_active", true)
        .order("cutoff_time", { ascending: true })
        .limit(1);
      if (data && data.length > 0) {
        const b = data[0];
        setBakery(b);
        const reveal = new Date(b.reveal_time);
        const cutoff = new Date(b.cutoff_time);
        setBakeryOpen(now >= reveal && now < cutoff && b.quantity_remaining > 0);
      }
    };

    fetchMenu();
    fetchBakery();
  }, []);

  if (loading) return null;

  return (
    <section id="shabbat" className="px-6 py-20 max-w-6xl mx-auto">

      <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-2">Every Friday</p>
      <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-10">
        Thank Fred It&apos;s Friday.
      </h2>

      {/* 3-COLUMN: Fred | Shabbat Box | Esther's Bakery */}
      <div className="flex flex-col md:flex-row items-start gap-8">

        {/* FRED — stage left, smaller */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <img
            src="/shabbat%20fred.png"
            alt="Shabbat Fred"
            className="w-36 md:w-44 opacity-90"
          />
        </div>

        {/* SHABBAT BOX CARD */}
        <div className="flex-1 bg-zinc-900 rounded-2xl border border-yellow-400/30 p-7 flex flex-col">
          <div className="mb-4">
            <p className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-1">Shabbat Box</p>
            <h3 className="text-2xl font-black mb-1">Dinner for the whole table</h3>
            <p className="text-zinc-500 text-sm">Delivered Friday. Orders open Monday at 9PM. Cutoff Friday 9AM.</p>
          </div>

          {!menu ? (
            <>
              <p className="text-white font-black text-lg mb-1">Shabbat Shalom! 🕯️</p>
              <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                No Shabbat Box this week. We&apos;ll be back next Friday.
              </p>
            </>
          ) : !isRevealed ? (
            <>
              <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                This week&apos;s menu drops <span className="text-white font-bold">Monday at 9PM</span>. Follow us on Instagram for the preview.
              </p>
              <p className="text-zinc-600 text-xs mb-4">Kosher. Scratch-made. No stress. From $65.</p>
            </>
          ) : isOpen ? (
            <>
              <p className="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-3">This week&apos;s menu</p>
              <ul className="text-white text-sm mb-3 space-y-1">
                <li><span className="text-yellow-400 font-bold">Protein:</span> {menu.protein}</li>
                <li><span className="text-yellow-400 font-bold">Side 1:</span> {menu.side1}</li>
                <li><span className="text-yellow-400 font-bold">Side 2:</span> {menu.side2}</li>
                <li><span className="text-yellow-400 font-bold">Side 3:</span> {menu.extra}</li>
              </ul>
              {menu.quantity_remaining === 0 ? (
                <p className="text-red-500 font-black text-sm mb-4">SOLD OUT</p>
              ) : menu.quantity_remaining <= 2 ? (
                <p className="text-red-400 font-bold text-xs mb-4">Only {menu.quantity_remaining} left</p>
              ) : (
                <p className="text-yellow-400 font-bold text-xs mb-4">Orders close Friday at 9AM</p>
              )}
            </>
          ) : (
            <>
              <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                {menu.quantity_remaining === 0 ? "Sold out for this week." : "Ordering closed for this week."}{" "}
                Back Monday at 9PM.
              </p>
            </>
          )}

          <div className="mt-auto pt-2">
            {isOpen ? (
              <a href="/shabbat" className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-black px-6 py-3 rounded-full text-sm transition-colors">
                Order Shabbat Box — from $65
              </a>
            ) : (
              <a href="https://instagram.com/thehungryroostertx" target="_blank" className="inline-block border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-black px-6 py-3 rounded-full text-sm transition-colors">
                Follow for the Drop
              </a>
            )}
          </div>
        </div>

        {/* ESTHER'S BAKERY CARD */}
        <div className="flex-1 bg-zinc-900 rounded-2xl border border-zinc-700 p-7 flex flex-col">
          <div className="mb-4">
            <p className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-1">Esther&apos;s Bakery</p>
            <h3 className="text-2xl font-black mb-1">Fresh-baked, every Friday</h3>
            <p className="text-zinc-500 text-sm">Weekly rotating menu. Orders open Monday at 9PM. Cutoff Friday 9AM. Min $50.</p>
          </div>

          {bakery && bakeryOpen ? (
            <>
              <p className="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-3">This week&apos;s bakery</p>
              <ul className="text-white text-sm mb-3 space-y-1">
                {bakery.items.slice(0, 4).map((item) => (
                  <li key={item.name}>
                    <span className="text-yellow-400 font-bold">·</span> {item.name}{" "}
                    <span className="text-zinc-500">${item.price.toFixed(2)}</span>
                  </li>
                ))}
                {bakery.items.length > 4 && (
                  <li className="text-zinc-500 text-xs">+ {bakery.items.length - 4} more items</li>
                )}
              </ul>
              <p className="text-yellow-400 font-bold text-xs mb-4">Orders close Friday at 9AM</p>
            </>
          ) : (
            <>
              <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                Challahs, babka, pastries and more — baked fresh and delivered Friday alongside your Shabbat table.
              </p>
              <p className="text-zinc-600 text-xs mb-4">Menu changes weekly. Back Monday for this week&apos;s drop.</p>
            </>
          )}

          <div className="mt-auto pt-2">
            {bakeryOpen ? (
              <a href="/esther" className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-black px-6 py-3 rounded-full text-sm transition-colors">
                Order Esther&apos;s Bakery
              </a>
            ) : (
              <a href="/esther" className="inline-block border-2 border-zinc-600 text-zinc-400 hover:border-yellow-400 hover:text-yellow-400 font-black px-6 py-3 rounded-full text-sm transition-colors">
                View Esther&apos;s Bakery
              </a>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
