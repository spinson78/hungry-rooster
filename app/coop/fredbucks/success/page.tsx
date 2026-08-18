"use client";
import { useEffect, useState, useRef } from "react";

export default function FredbucksSuccessPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [info, setInfo] = useState<{ teacher_name?: string; coupons_total?: number; ref_code?: string } | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) { setStatus("error"); return; }
    fetch(`/api/coop/fredbucks/success?session_id=${sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) { setInfo(data); setStatus("success"); }
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-zinc-400 animate-pulse">Processing your purchase…</p>
    </main>
  );

  if (status === "error") return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 text-center">
      <div>
        <p className="text-4xl mb-4">⚠️</p>
        <h1 className="text-2xl font-black mb-3">Something went wrong</h1>
        <p className="text-zinc-400 mb-6">Your payment may have gone through. Please contact us at sales@thehungryroostertx.com</p>
        <a href="/coop/fredbucks" className="bg-yellow-400 text-black font-black px-8 py-3 rounded-full">Try Again</a>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">🐓</div>
        <h1 className="text-3xl font-black mb-2">Cock-a-doodle-YOU!</h1>
        <p className="text-zinc-400 mb-8">Your Fred's Bucks are ready, {info?.teacher_name?.split(" ")[0]}!</p>

        <div className="bg-zinc-900 border-2 border-yellow-400 rounded-2xl p-6 mb-8 text-left space-y-3">
          <div className="flex justify-between">
            <span className="text-zinc-500 text-sm">Teacher</span>
            <span className="font-black">{info?.teacher_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 text-sm">Fred's Bucks</span>
            <span className="font-black text-yellow-400">{info?.coupons_total} × $5</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 text-sm">Ref Code</span>
            <span className="font-mono font-black text-teal-400">{info?.ref_code}</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 mb-6">
          <p className="text-2xl mb-2">📍</p>
          <p className="font-black text-lg mb-1">Pick up at The Coop Counter</p>
          <p className="text-zinc-400 text-sm">Show this page or your confirmation email to our staff. We'll hand you your sheet of Fred's Bucks!</p>
        </div>

        <p className="text-zinc-600 text-xs">A copy of this confirmation has been sent to your email. Each Fred's Buck is worth $5 cash value at THE COOP.</p>
      </div>
    </main>
  );
}
