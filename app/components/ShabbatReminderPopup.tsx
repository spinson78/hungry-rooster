"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ShabbatReminderPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("shabbat_reminder_dismissed");
    if (dismissed) return;

    const day = new Date().getDay(); // 3 = Wed, 4 = Thu, 5 = Fri
    if (day < 3 || day > 5) return;

    const checkMenu = async () => {
      const now = new Date();
      const { data } = await supabase
        .from("shabbat_menus")
        .select("quantity_remaining, cutoff_time")
        .gte("cutoff_time", now.toISOString())
        .limit(1);

      if (data && data.length > 0 && data[0].quantity_remaining > 0) {
        setTimeout(() => setShow(true), 2000);
      }
    };

    checkMenu();
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("shabbat_reminder_dismissed", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full">
      <div className="bg-black border border-yellow-400 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white text-lg leading-none"
        >
          ✕
        </button>
        <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-8 mb-4" />
        <p className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-1">Shabbat is coming</p>
        <p className="text-white font-black text-lg mb-2">Don't forget your Shabbat Box!</p>
        <p className="text-zinc-400 text-sm mb-4">Orders close Friday at 9AM. Let Fred handle dinner this week.</p>
        <a
          href="/shabbat"
          onClick={dismiss}
          className="block w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-3 rounded-full text-sm text-center transition-colors"
        >
          Order Now — from $65
        </a>
      </div>
    </div>
  );
}
