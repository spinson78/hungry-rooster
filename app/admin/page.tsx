"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const ADMIN_PASSWORD = "fredapproves";

const dinnerDays = [
  { label: "Monday", value: "Monday" },
  { label: "Tuesday", value: "Tuesday" },
  { label: "Thursday", value: "Thursday" },
];

type DinnerEntry = {
  day: string;
  date: string;
  protein: string;
  side1: string;
  side2: string;
  extra: string;
  quantity: number;
};

type ShabbatEntry = {
  week_of: string;
  protein: string;
  side1: string;
  side2: string;
  extra: string;
  quantity: number;
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [dinners, setDinners] = useState<DinnerEntry[]>(
    dinnerDays.map((d) => ({
      day: d.value,
      date: "",
      protein: "",
      side1: "",
      side2: "",
      extra: "Salad",
      quantity: 20,
    }))
  );

  const [shabbat, setShabbat] = useState<ShabbatEntry>({
    week_of: "",
    protein: "",
    side1: "",
    side2: "",
    extra: "Challah",
    quantity: 50,
  });

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
    } else {
      setPasswordError(true);
    }
  };

  const updateDinner = (index: number, field: keyof DinnerEntry, value: string | number) => {
    setDinners((prev) => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    // Save dinner menus
    for (const dinner of dinners) {
      if (!dinner.date || !dinner.protein) continue;
      // 9PM CST night before = 03:00 UTC on dinner date
      const revealDate = new Date(dinner.date + "T03:00:00Z");
      // 12PM CST = 18:00 UTC
      const cutoffDate = new Date(dinner.date + "T18:00:00Z");

      const { error: dinnerError } = await supabase.from("dinner_menus").upsert({
        date: dinner.date,
        day_of_week: dinner.day,
        protein: dinner.protein,
        side1: dinner.side1,
        side2: dinner.side2,
        extra: dinner.extra,
        quantity_available: dinner.quantity,
        quantity_remaining: dinner.quantity,
        is_active: false,
        reveal_time: revealDate.toISOString(),
        cutoff_time: cutoffDate.toISOString(),
      }, { onConflict: "date" });
      if (dinnerError) {
        console.error("Dinner save error:", dinnerError);
        alert("Error saving " + dinner.day + ": " + dinnerError.message);
        setSaving(false);
        return;
      }
    }

    // Save shabbat menu
    if (shabbat.week_of && shabbat.protein) {
      // Monday 9PM CST = Tuesday 03:00 UTC
      const revealDate = new Date(shabbat.week_of + "T03:00:00Z");
      // Friday 9AM CST = Friday 15:00 UTC (week_of is Monday, +4 days = Friday)
      const cutoffDate = new Date(shabbat.week_of + "T15:00:00Z");
      cutoffDate.setUTCDate(cutoffDate.getUTCDate() + 4);

      await supabase.from("shabbat_menus").upsert({
        week_of: shabbat.week_of,
        protein: shabbat.protein,
        side1: shabbat.side1,
        side2: shabbat.side2,
        extra: shabbat.extra,
        quantity_available: shabbat.quantity,
        quantity_remaining: shabbat.quantity,
        is_active: true,
        reveal_time: revealDate.toISOString(),
        cutoff_time: cutoffDate.toISOString(),
      }, { onConflict: "week_of" });
    }

    setSaving(false);
    setSaved(true);
  };

  if (!authed) {
    return (
      <main className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="bg-zinc-900 rounded-2xl p-10 border border-zinc-800 w-full max-w-sm text-center">
          <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-10 w-auto mx-auto mb-6" />
          <h1 className="text-xl font-black mb-6">Admin Access</h1>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 mb-3"
          />
          {passwordError && <p className="text-red-400 text-sm mb-3">Incorrect password</p>}
          <button onClick={handleLogin} className="w-full bg-teal-500 hover:bg-teal-400 text-black font-black py-3 rounded-full transition-colors">
            Sign In
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-black text-white min-h-screen px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-1">Admin Panel</p>
            <h1 className="text-3xl font-black">Weekly Menu Setup</h1>
          </div>
          <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-10 w-auto" />
        </div>

        {/* DINNER MENUS */}
        <div className="mb-12">
          <h2 className="text-xl font-black mb-1">Dinner Drop</h2>
          <p className="text-zinc-500 text-sm mb-6">Mon, Tue, Thu — $85 delivered. Reveals at 9PM the night before. Orders close at 12PM day of.</p>

          <div className="space-y-6">
            {dinners.map((dinner, i) => (
              <div key={dinner.day} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <h3 className="font-black text-lg mb-4 text-yellow-400">{dinner.day}</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Date</label>
                    <input
                      type="date"
                      value={dinner.date}
                      onChange={(e) => updateDinner(i, "date", e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Quantity</label>
                    <input
                      type="number"
                      value={dinner.quantity}
                      onChange={(e) => updateDinner(i, "quantity", parseInt(e.target.value))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Protein</label>
                    <input
                      type="text"
                      placeholder="e.g. Brisket"
                      value={dinner.protein}
                      onChange={(e) => updateDinner(i, "protein", e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Side 1</label>
                    <input
                      type="text"
                      placeholder="e.g. Roasted potatoes"
                      value={dinner.side1}
                      onChange={(e) => updateDinner(i, "side1", e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Side 2</label>
                    <input
                      type="text"
                      placeholder="e.g. Roasted veggies"
                      value={dinner.side2}
                      onChange={(e) => updateDinner(i, "side2", e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Side 3</label>
                    <input
                      type="text"
                      placeholder="e.g. House salad"
                      value={dinner.extra}
                      onChange={(e) => updateDinner(i, "extra", e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SHABBAT MENU */}
        <div className="mb-10">
          <h2 className="text-xl font-black mb-1">Shabbat Box</h2>
          <p className="text-zinc-500 text-sm mb-6">$115 delivered. Reveals Monday at 9PM. Orders close Friday at 9AM.</p>

          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Monday date (week of)</label>
                <input
                  type="date"
                  value={shabbat.week_of}
                  onChange={(e) => setShabbat({ ...shabbat, week_of: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Quantity</label>
                <input
                  type="number"
                  value={shabbat.quantity}
                  onChange={(e) => setShabbat({ ...shabbat, quantity: parseInt(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Protein</label>
                <input
                  type="text"
                  placeholder="e.g. Roasted chicken"
                  value={shabbat.protein}
                  onChange={(e) => setShabbat({ ...shabbat, protein: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Side 1</label>
                <input
                  type="text"
                  placeholder="e.g. Kugel"
                  value={shabbat.side1}
                  onChange={(e) => setShabbat({ ...shabbat, side1: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Side 2</label>
                <input
                  type="text"
                  placeholder="e.g. Roasted carrots"
                  value={shabbat.side2}
                  onChange={(e) => setShabbat({ ...shabbat, side2: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Side 3</label>
                <input
                  type="text"
                  placeholder="e.g. Challah, House salad"
                  value={shabbat.extra}
                  onChange={(e) => setShabbat({ ...shabbat, extra: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SAVE */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-full text-lg transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save This Week's Menus"}
        </button>
        {saved && (
          <p className="text-teal-400 text-center font-bold mt-4">Menus saved! Fred is ready for the week.</p>
        )}
      </div>
    </main>
  );
}
