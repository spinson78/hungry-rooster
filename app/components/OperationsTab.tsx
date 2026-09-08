"use client";
import { useState, useEffect } from "react";

const MENU_ITEMS = [
  "Big Cluck Burrito", "Side Chick Sandwich", "Chicken & Waffles", "Hangover Burrito",
  "Fish Taco", "Caesar Salmon Wrap", "Tuna Sandwich", "Classic Fried Chicken Sandwich",
  "Spicy Fried Chicken Sandwich", "Fish Sandwich", "Caesar Chicken Wrap", "Chicken Combo Meal",
  "Brisket Sandwich", "Kids Fish Sticks & Fries",
  "Caesar Salad", "Hen House Harvest", "Southwest Salad", "Cauliflower Salad",
];

type ClosedDate = { date: string; reason: string };

export default function OperationsTab() {
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [soldOutItems, setSoldOutItems] = useState<string[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    fetch("/api/site-settings")
      .then(r => r.json())
      .then(d => {
        setClosedDates(d.closed_dates || []);
        setSoldOutItems(d.sold_out_items || []);
      });
  }, []);

  const save = async (key: string, value: unknown) => {
    setSaving(true);
    await fetch("/api/site-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setSaving(false);
    setSavedMsg("Saved!");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const addClosure = async () => {
    if (!newDate) return;
    const updated = [...closedDates.filter(d => d.date !== newDate), { date: newDate, reason: newReason || "Closed" }]
      .sort((a, b) => a.date.localeCompare(b.date));
    setClosedDates(updated);
    await save("closed_dates", updated);
    setNewDate("");
    setNewReason("");
  };

  const removeClosure = async (date: string) => {
    const updated = closedDates.filter(d => d.date !== date);
    setClosedDates(updated);
    await save("closed_dates", updated);
  };

  const toggleSoldOut = async (item: string) => {
    const updated = soldOutItems.includes(item)
      ? soldOutItems.filter(i => i !== item)
      : [...soldOutItems, item];
    setSoldOutItems(updated);
    await save("sold_out_items", updated);
  };

  const today = new Date().toISOString().split("T")[0];
  const isClosedToday = closedDates.some(d => d.date === today);

  const toggleToday = async () => {
    if (isClosedToday) {
      await removeClosure(today);
    } else {
      const updated = [...closedDates, { date: today, reason: "Closed today" }].sort((a, b) => a.date.localeCompare(b.date));
      setClosedDates(updated);
      await save("closed_dates", updated);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {savedMsg && (
        <div className="bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-bold px-4 py-2 rounded-xl">
          ✓ {savedMsg}
        </div>
      )}

      {/* ── Quick Toggle ─────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="font-black text-lg mb-1">Quick Close</h3>
        <p className="text-zinc-500 text-sm mb-4">Toggle ordering on/off for today.</p>
        <button
          onClick={toggleToday}
          disabled={saving}
          className={`px-6 py-3 rounded-full font-black text-sm transition-colors disabled:opacity-50 ${
            isClosedToday
              ? "bg-green-500 text-black hover:bg-green-400"
              : "bg-red-500 text-white hover:bg-red-400"
          }`}
        >
          {isClosedToday ? "✓ Reopen Online Ordering" : "⛔ Close Online Ordering Today"}
        </button>
        {isClosedToday && (
          <p className="text-red-400 text-xs mt-3">Online ordering is currently closed for today.</p>
        )}
      </div>

      {/* ── Scheduled Closures ───────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="font-black text-lg mb-1">Scheduled Closures</h3>
        <p className="text-zinc-500 text-sm mb-4">Plan holiday and special closures in advance.</p>

        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            type="date"
            value={newDate}
            min={today}
            onChange={e => setNewDate(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-yellow-400"
          />
          <input
            type="text"
            placeholder="Reason (e.g. Rosh Hashanah)"
            value={newReason}
            onChange={e => setNewReason(e.target.value)}
            className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-yellow-400"
          />
          <button
            onClick={addClosure}
            disabled={!newDate || saving}
            className="bg-yellow-400 text-black font-black px-5 py-2 rounded-full text-sm disabled:opacity-50 hover:bg-yellow-300 transition-colors whitespace-nowrap"
          >
            + Add
          </button>
        </div>

        {closedDates.length === 0 ? (
          <p className="text-zinc-600 text-sm">No closures scheduled.</p>
        ) : (
          <div className="space-y-2">
            {closedDates.map(({ date, reason }) => (
              <div key={date} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${date === today ? "border-red-500/40 bg-red-500/10" : "border-zinc-800 bg-zinc-800/50"}`}>
                <div>
                  <p className="font-bold text-sm">
                    {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    {date === today && <span className="ml-2 text-red-400 text-xs">TODAY</span>}
                  </p>
                  <p className="text-zinc-500 text-xs">{reason}</p>
                </div>
                <button
                  onClick={() => removeClosure(date)}
                  className="text-zinc-500 hover:text-red-400 text-sm font-black px-3 py-1 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 86 Menu Items ────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="font-black text-lg mb-1">86 Menu Items</h3>
        <p className="text-zinc-500 text-sm mb-4">Mark items as sold out — they&apos;ll appear greyed out on the menu and can&apos;t be ordered.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MENU_ITEMS.map(item => {
            const out = soldOutItems.includes(item);
            return (
              <button
                key={item}
                onClick={() => toggleSoldOut(item)}
                disabled={saving}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold text-left transition-colors ${
                  out
                    ? "border-red-500/40 bg-red-500/10 text-red-400"
                    : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                <span>{item}</span>
                <span className="text-xs ml-2 shrink-0">{out ? "⛔ 86'd" : "✓ Available"}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
