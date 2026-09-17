"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

type Shift = { id: string; clock_in: string; clock_out: string | null };
type Status = {
  employee: { id: string; name: string };
  clocked_in: boolean;
  open_punch: { id: string; clock_in: string } | null;
  recent_shifts: Shift[];
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Chicago",
  });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", timeZone: "America/Chicago",
  });
}
function hoursWorked(clockIn: string, clockOut: string | null) {
  const end = clockOut ? new Date(clockOut) : new Date();
  const diff = (end.getTime() - new Date(clockIn).getTime()) / 3600000;
  return diff.toFixed(2);
}
function elapsed(clockIn: string) {
  const diff = (Date.now() - new Date(clockIn).getTime()) / 1000;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = Math.floor(diff % 60);
  return `${h > 0 ? `${h}h ` : ""}${m}m ${s}s`;
}

export default function TimeclockPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [tick, setTick] = useState(0);
  const [flash, setFlash] = useState<"in" | "out" | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/timeclock/status?token=${token}`);
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Invalid link"); setLoading(false); return; }
    setStatus(data);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Tick every second while clocked in to update elapsed time
  useEffect(() => {
    if (!status?.clocked_in) return;
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [status?.clocked_in]);

  const punch = async (action: "in" | "out") => {
    setPunching(true);
    const res = await fetch("/api/timeclock/punch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Something went wrong"); setPunching(false); return; }
    setFlash(action);
    setTimeout(() => setFlash(null), 2000);
    await load();
    setPunching(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-6xl mb-4">🐓</p>
        <p className="text-white font-black text-2xl mb-2">Invalid Link</p>
        <p className="text-zinc-400">{error}</p>
      </div>
    </div>
  );

  if (!status) return null;
  const { employee, clocked_in, open_punch, recent_shifts } = status;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-6 py-12">
      {/* Flash overlay */}
      {flash && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity ${flash ? "opacity-100" : "opacity-0"}`}>
          <div className={`text-center ${flash === "in" ? "text-green-400" : "text-red-400"}`}>
            <p className="text-8xl font-black">{flash === "in" ? "✓" : "✓"}</p>
            <p className="text-3xl font-black mt-2">{flash === "in" ? "Clocked In!" : "Clocked Out!"}</p>
          </div>
        </div>
      )}

      {/* Logo */}
      <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-10 mb-10" />

      {/* Name */}
      <p className="text-zinc-400 text-sm uppercase tracking-widest mb-1">Welcome back</p>
      <h1 className="text-4xl font-black mb-8">{employee.name}</h1>

      {/* Status card */}
      <div className={`w-full max-w-sm rounded-3xl p-8 text-center mb-6 border-2 transition-colors ${
        clocked_in
          ? "bg-green-950/40 border-green-500/50"
          : "bg-zinc-900 border-zinc-700"
      }`}>
        <div className={`text-5xl mb-3 ${clocked_in ? "animate-pulse" : ""}`}>
          {clocked_in ? "🟢" : "🔴"}
        </div>
        <p className={`font-black text-xl mb-1 ${clocked_in ? "text-green-400" : "text-zinc-400"}`}>
          {clocked_in ? "Clocked In" : "Clocked Out"}
        </p>
        {clocked_in && open_punch && (
          <p className="text-zinc-400 text-sm">
            Since {formatTime(open_punch.clock_in)} · <span className="text-white font-bold tabular-nums" suppressHydrationWarning>{elapsed(open_punch.clock_in)}</span>
          </p>
        )}
      </div>

      {/* Big punch button */}
      <button
        onClick={() => punch(clocked_in ? "out" : "in")}
        disabled={punching}
        className={`w-full max-w-sm py-5 rounded-full font-black text-xl transition-all disabled:opacity-50 mb-10 ${
          clocked_in
            ? "bg-red-500 hover:bg-red-400 text-white"
            : "bg-green-500 hover:bg-green-400 text-black"
        }`}
      >
        {punching ? "…" : clocked_in ? "Clock Out" : "Clock In"}
      </button>

      {/* Recent shifts */}
      {recent_shifts.length > 0 && (
        <div className="w-full max-w-sm">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">Recent Shifts</p>
          <div className="space-y-2">
            {recent_shifts.map(shift => (
              <div key={shift.id} className="bg-zinc-900 rounded-xl px-4 py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold">{formatDate(shift.clock_in)}</p>
                  <p className="text-zinc-400 text-xs">
                    {formatTime(shift.clock_in)} → {shift.clock_out ? formatTime(shift.clock_out) : "open"}
                  </p>
                </div>
                <p className="text-teal-400 font-black text-sm">
                  {hoursWorked(shift.clock_in, shift.clock_out)}h
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-zinc-700 text-xs mt-10">The Hungry Rooster · Dallas, TX</p>
      {/* Suppress tick warning */}
      <span className="hidden">{tick}</span>
    </div>
  );
}
