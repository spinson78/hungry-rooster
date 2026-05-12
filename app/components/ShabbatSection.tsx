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

export default function ShabbatSection() {
  const [menu, setMenu] = useState<ShabbatMenu | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      const now = new Date();

      const { data } = await supabase
        .from("shabbat_menus")
        .select("*")
        .gte("cutoff_time", now.toISOString())
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

    fetchMenu();
  }, []);

  if (loading) return null;

  return (
    <section id="shabbat" className="px-6 py-20 max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">

      {/* LEFT */}
      <div className="flex-1">
        <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-4">Every Friday</p>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
          Thank Fred<br />It&apos;s Friday.
        </h2>

        {!menu ? (
          <>
            <p className="text-zinc-400 text-lg mb-4 leading-relaxed">
              Let Fred do the cooking this Shabbat. Protein, starch, veggie,
              fresh salad, and 2 challahs — delivered straight to your door.
            </p>
            <p className="text-zinc-500 text-sm mb-8">Kosher. Scratch-made. No stress. Cutoff every Friday at 9AM CST.</p>
          </>
        ) : !isRevealed ? (
          <>
            <p className="text-zinc-400 text-lg mb-4 leading-relaxed">
              This week&apos;s Shabbat menu drops <span className="text-white font-bold">Monday at 9PM</span>. Follow us on Instagram for the preview.
            </p>
            <p className="text-zinc-500 text-sm mb-8">Kosher. Scratch-made. No stress. Cutoff every Friday at 9AM CST.</p>
          </>
        ) : isOpen ? (
          <>
            <p className="text-zinc-400 text-sm uppercase tracking-widest font-bold mb-3">
              This week&apos;s menu
            </p>
            <ul className="text-white text-lg mb-2 space-y-1">
              <li><span className="text-yellow-400 font-bold">Protein:</span> {menu.protein}</li>
              <li><span className="text-yellow-400 font-bold">Side 1:</span> {menu.side1}</li>
              <li><span className="text-yellow-400 font-bold">Side 2:</span> {menu.side2}</li>
              <li><span className="text-yellow-400 font-bold">Side 3:</span> {menu.extra}</li>
            </ul>
            {menu.quantity_remaining === 0 ? (
              <p className="text-red-500 font-black text-lg mb-8">SOLD OUT</p>
            ) : menu.quantity_remaining <= 2 ? (
              <p className="text-red-400 font-black text-sm mb-8">
                Only {menu.quantity_remaining} left · Orders close Friday at 9AM
              </p>
            ) : (
              <p className="text-yellow-400 font-bold text-sm mb-8">Orders close Friday at 9AM</p>
            )}
          </>
        ) : (
          <>
            <p className="text-zinc-400 text-lg mb-4 leading-relaxed">
              {menu.quantity_remaining === 0
                ? "Sold out for this week!"
                : "Ordering is closed for this week."}{" "}
              Check back Monday at 9PM for next week&apos;s drop.
            </p>
            <p className="text-zinc-500 text-sm mb-8">Kosher. Scratch-made. No stress.</p>
          </>
        )}

        <div className="flex flex-wrap gap-4">
          {isOpen ? (
            <a
              href="/shabbat"
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-8 py-4 rounded-full text-lg transition-colors inline-block"
            >
              Order Shabbat Box — from $65
            </a>
          ) : (
            <a
              href="https://instagram.com/thehungryroostertx"
              target="_blank"
              className="border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-black px-8 py-4 rounded-full text-lg transition-colors inline-block"
            >
              Follow for the Drop
            </a>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex-1 flex justify-center">
        <img src="/shabbat%20fred.png" alt="Shabbat Fred" className="w-72" />
      </div>

    </section>
  );
}
