"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type DinnerMenu = {
  id: string;
  date: string;
  day_of_week: string;
  protein: string;
  side1: string;
  side2: string;
  extra: string;
  quantity_remaining: number;
  reveal_time: string;
  cutoff_time: string;
};

export default function DinnerDropSection() {
  const [dinner, setDinner] = useState<DinnerMenu | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [nextDinner, setNextDinner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDinner = async () => {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date();

      const { data } = await supabase
        .from("dinner_menus")
        .select("*")
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(1);

      if (data && data.length > 0) {
        const menu = data[0];
        setDinner(menu);

        const reveal = new Date(menu.reveal_time);
        const cutoff = new Date(menu.cutoff_time);

        setIsRevealed(now >= reveal);
        setIsOpen(now >= reveal && now < cutoff && menu.quantity_remaining > 0);

        // Get next dinner after this one
        if (now >= cutoff || menu.quantity_remaining === 0) {
          const { data: next } = await supabase
            .from("dinner_menus")
            .select("date, day_of_week")
            .gt("date", menu.date)
            .order("date", { ascending: true })
            .limit(1);
          if (next && next.length > 0) {
            setNextDinner(`${next[0].day_of_week}, ${new Date(next[0].date).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`);
          }
        }
      }
      setLoading(false);
    };

    fetchDinner();
  }, []);

  if (loading) return null;

  return (
    <section className="px-6 py-20 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center gap-12 bg-zinc-900 rounded-3xl p-10 border border-zinc-800">

        {/* LEFT */}
        <div className="flex-1">
          <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-4">
            Mon · Tue · Thu
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            The Dinner Drop
          </h2>

          {!dinner ? (
            <p className="text-zinc-400 text-lg mb-8">
              A rotating dinner package — protein, two sides, and a third — delivered to your door for $85. Check back soon for the next drop.
            </p>
          ) : !isRevealed ? (
            <>
              <p className="text-zinc-400 text-lg mb-4">
                Tonight's menu drops at <span className="text-white font-bold">9PM</span>. Follow us on Instagram for the tease.
              </p>
              <p className="text-zinc-500 text-sm mb-8">$85 · Includes delivery · Limited quantity</p>
            </>
          ) : isOpen ? (
            <>
              <p className="text-zinc-400 text-sm uppercase tracking-widest font-bold mb-3">
                {dinner.day_of_week} — {new Date(dinner.date).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </p>
              <ul className="text-white text-lg mb-2 space-y-1">
                <li><span className="text-yellow-400 font-bold">Protein:</span> {dinner.protein}</li>
                <li><span className="text-yellow-400 font-bold">Side 1:</span> {dinner.side1}</li>
                <li><span className="text-yellow-400 font-bold">Side 2:</span> {dinner.side2}</li>
                <li><span className="text-yellow-400 font-bold">Side 3:</span> {dinner.extra}</li>
              </ul>
              {dinner.quantity_remaining === 0 ? (
                <p className="text-red-500 font-black text-lg mb-8">SOLD OUT</p>
              ) : dinner.quantity_remaining <= 2 ? (
                <p className="text-red-400 font-black text-sm mb-8">
                  Only {dinner.quantity_remaining} left · Orders close at 12PM
                </p>
              ) : (
                <p className="text-teal-400 font-bold text-sm mb-8">Orders close at 12PM</p>
              )}
            </>
          ) : (
            <p className="text-zinc-400 text-lg mb-8">
              {dinner.quantity_remaining === 0 ? "Sold out for tonight!" : "Ordering is closed for tonight."}{" "}
              {nextDinner ? `Next drop: ${nextDinner}` : "Check back soon."}
            </p>
          )}

          <div className="flex flex-wrap gap-4">
            {isOpen ? (
              <a
                href="/dinner"
                className="bg-teal-500 hover:bg-teal-400 text-black font-black px-8 py-4 rounded-full text-lg transition-colors"
              >
                Order Dinner — $85
              </a>
            ) : (
              <a
                href="https://instagram.com/thehungryroostertx"
                target="_blank"
                className="border-2 border-teal-500 text-teal-400 hover:bg-teal-500 hover:text-black font-black px-8 py-4 rounded-full text-lg transition-colors"
              >
                Follow for the Drop
              </a>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <img src="/fred%20car%20png.png" alt="Fred's Dinner Drop" className="w-full max-w-xs mb-2" />
          <p className="text-zinc-500 text-sm">Protein + Side + Side + Side 3</p>
          <p className="text-white font-black text-4xl mt-2">$85</p>
          <p className="text-zinc-500 text-sm mt-1">Includes delivery</p>
        </div>

      </div>
    </section>
  );
}
