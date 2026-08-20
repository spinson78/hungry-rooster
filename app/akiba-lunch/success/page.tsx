"use client";
import { useEffect, useState, useRef } from "react";

export default function AkibaLunchSuccess() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [info, setInfo] = useState<{
    student_name?: string; grade?: string; cart_summary?: string;
    drink?: string | null; amount_total?: number; week_of?: string;
  } | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) { setStatus("error"); return; }
    fetch(`/api/akiba-lunch/success?session_id=${sessionId}`)
      .then(r => r.json())
      .then(d => { if (d.success) { setInfo(d); setStatus("success"); } else setStatus("error"); })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-zinc-500 animate-pulse">Confirming your order…</p>
    </main>
  );

  if (status === "error") return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 text-center">
      <div>
        <p className="text-4xl mb-4">⚠️</p>
        <h1 className="text-2xl font-black mb-3">Something went wrong</h1>
        <p className="text-zinc-400 mb-6 text-sm">Your payment may have gone through. Contact us at sales@thehungryroostertx.com</p>
        <a href="/akiba-lunch" className="bg-yellow-400 text-black font-black px-8 py-3 rounded-full">Try Again</a>
      </div>
    </main>
  );

  const thursdayLabel = info?.week_of
    ? new Date(info.week_of + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "This Thursday";

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center">
        <div className="text-5xl mb-5">🎉🏫</div>
        <h1 className="text-3xl font-black mb-2">Order Confirmed!</h1>
        <p className="text-zinc-400 mb-8 text-sm">Lunch for {info?.student_name} is all set.</p>

        <div className="bg-zinc-950 border-2 border-yellow-400 rounded-3xl p-6 mb-6 text-left space-y-3">
          <div className="flex justify-between">
            <span className="text-zinc-500 text-sm">Student</span>
            <span className="font-black">{info?.student_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 text-sm">Grade</span>
            <span className="font-black">{info?.grade}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-zinc-500 text-sm shrink-0">Order</span>
            <span className="font-bold text-sm text-right">{info?.cart_summary}</span>
          </div>
          {info?.drink && (
            <div className="flex justify-between">
              <span className="text-zinc-500 text-sm">Drink</span>
              <span className="font-black text-teal-400">🥤 {info.drink}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-zinc-800 pt-3">
            <span className="text-zinc-500 text-sm">Total</span>
            <span className="font-black text-yellow-400">${Number(info?.amount_total).toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 mb-6">
          <p className="text-2xl mb-2">📍</p>
          <p className="font-black text-lg mb-1">Delivery: {thursdayLabel}</p>
          <p className="text-zinc-400 text-sm">Lunch will be delivered to Akiba Yavneh on Friday.</p>
        </div>

        <a href="/akiba-lunch" className="inline-block bg-zinc-900 border border-zinc-700 text-white font-black px-8 py-3 rounded-full text-sm hover:border-yellow-400 transition-colors">
          Order Another Lunch
        </a>
      </div>
    </main>
  );
}
