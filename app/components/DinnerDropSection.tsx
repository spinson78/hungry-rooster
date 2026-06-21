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
  price?: number;
};

function getRevealForDinner(dinner: DinnerMenu): Date {
  const d = new Date(dinner.date + "T12:00:00");
  const daysSinceSunday = d.getDay();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - daysSinceSunday);
  sunday.setHours(10, 0, 0, 0);
  return sunday;
}

function getCutoff(dinner: DinnerMenu): Date {
  if (dinner.cutoff_time) return new Date(dinner.cutoff_time);
  return new Date(dinner.date + "T12:00:00");
}

export default function DinnerDropSection() {
  const [dinners, setDinners] = useState<DinnerMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchDinners = async () => {
      const today = new Date().toISOString().split("T")[0];
      const future = new Date();
      future.setDate(future.getDate() + 10);
      const futureStr = future.toISOString().split("T")[0];

      const { data } = await supabase
        .from("dinner_menus")
        .select("*")
        .gte("date", today)
        .lte("date", futureStr)
        .order("date", { ascending: true })
        .limit(5);

      setDinners(data || []);
      setLoading(false);
    };

    fetchDinners();
  }, []);

  if (loading) return null;

  // Show dinners that are revealed (past Sunday 10 AM) and not past cutoff
  const revealed = dinners.filter(d => now >= getRevealForDinner(d));
  // Upcoming = not yet revealed (next week's dinners posted early)
  const upcoming = dinners.filter(d => now < getRevealForDinner(d));

  return (
    <section className="px-6 py-20 max-w-6xl mx-auto">
      <div className="bg-zinc-900 rounded-3xl p-10 border border-zinc-800">

        {/* HEADER ROW */}
        <div className="flex flex-col md:flex-row items-center gap-10 mb-10">
          <div className="flex-1">
            <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-4">
              Mon &middot; Tue &middot; Thu
            </p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              The Dinner Drop
            </h2>
            <p className="text-zinc-400 text-lg mb-2">
              A rotating dinner package delivered to your door. Protein, two sides, and a third.
            </p>
            <p className="text-zinc-500 text-sm">Includes delivery &middot; Limited quantity &middot; Order by 12PM day-of</p>
          </div>
          <div className="flex flex-col items-center text-center shrink-0">
            <img src="/fred%20car%20png.png" alt="Fred's Dinner Drop" className="w-48 mix-blend-lighten" />
            <p className="text-yellow-400 font-black text-lg mt-1">Dinner, handled.</p>
          </div>
        </div>

        {/* THIS WEEK'S DINNER CARDS */}
        {revealed.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-4">
            {revealed.map((dinner) => {
              const cutoff = getCutoff(dinner);
              const price = dinner.price || 85;
              const isOpen = now < cutoff && dinner.quantity_remaining > 0;
              const isSoldOut = dinner.quantity_remaining === 0;
              const isClosed = now >= cutoff;

              return (
                <div key={dinner.id} className="bg-zinc-800 rounded-2xl p-6 border border-zinc-700 flex flex-col">
                  <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mb-1">
                    {dinner.day_of_week}
                  </p>
                  <p className="text-zinc-500 text-xs mb-3">
                    {new Date(dinner.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                  </p>
                  <ul className="text-white text-sm mb-4 space-y-1 flex-1">
                    <li><span className="text-yellow-400 font-bold">Protein:</span> {dinner.protein}</li>
                    <li><span className="text-yellow-400 font-bold">Side 1:</span> {dinner.side1}</li>
                    <li><span className="text-yellow-400 font-bold">Side 2:</span> {dinner.side2}</li>
                    <li><span className="text-yellow-400 font-bold">Side 3:</span> {dinner.extra}</li>
                  </ul>

                  <p className="text-white font-black text-xl mb-2">${price}</p>

                  {isSoldOut ? (
                    <p className="text-red-500 font-black text-xs mb-3">SOLD OUT</p>
                  ) : isClosed ? (
                    <p className="text-zinc-500 text-xs mb-3">Ordering closed</p>
                  ) : dinner.quantity_remaining <= 2 ? (
                    <p className="text-red-400 font-bold text-xs mb-3">Only {dinner.quantity_remaining} left &middot; Closes 12PM</p>
                  ) : (
                    <p className="text-teal-400 font-bold text-xs mb-3">Order by 12PM</p>
                  )}

                  <div className="mt-auto">
                    {isOpen ? (
                      <a
                        href="/dinner"
                        className="block text-center bg-teal-500 hover:bg-teal-400 text-black font-black px-6 py-3 rounded-full text-sm transition-colors"
                      >
                        Order — ${price}
                      </a>
                    ) : (
                      <span className="block text-center border border-zinc-700 text-zinc-500 font-black px-6 py-3 rounded-full text-sm cursor-not-allowed">
                        {isSoldOut ? "Sold Out" : "Closed"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* NOT YET REVEALED */}
        {revealed.length === 0 && dinners.length > 0 && (
          <div className="text-center py-6">
            <p className="text-zinc-400 text-lg mb-2">
              This week's dinner drops reveal <span className="text-white font-bold">Sunday at 10AM</span>.
            </p>
            <p className="text-zinc-500 text-sm mb-6">Follow us on Instagram for a sneak peek.</p>
            <a
              href="https://instagram.com/thehungryroostertx"
              target="_blank"
              className="inline-block border-2 border-teal-500 text-teal-400 hover:bg-teal-500 hover:text-black font-black px-8 py-4 rounded-full text-lg transition-colors"
            >
              Follow for the Drop
            </a>
          </div>
        )}

        {/* NO DINNERS IN DB AT ALL */}
        {dinners.length === 0 && (
          <div className="text-center py-6">
            <p className="text-zinc-400 text-lg mb-2">No dinners scheduled yet this week.</p>
            <a
              href="https://instagram.com/thehungryroostertx"
              target="_blank"
              className="inline-block border-2 border-teal-500 text-teal-400 hover:bg-teal-500 hover:text-black font-black px-8 py-4 rounded-full text-lg transition-colors"
            >
              Follow for the Drop
            </a>
          </div>
        )}

        {/* HINT: next week coming */}
        {revealed.length > 0 && upcoming.length > 0 && (
          <p className="text-zinc-600 text-xs text-center mt-2">
            More dinners reveal Sunday at 10AM
          </p>
        )}

      </div>
    </section>
  );
}
