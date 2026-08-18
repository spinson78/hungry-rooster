"use client";
import { useEffect, useState, useRef } from "react";

const ORDER_TYPE_LABEL: Record<string, string> = {
  weekly: "Single Order — This Friday",
  semester1: "Semester 1 · Aug 28 – Dec 18",
  semester2: "Semester 2 · Jan 8 – Jun 4",
  fullyear: "Full Year · Aug 28 – Jun 4",
};

export default function CoopChallahSuccess() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [info, setInfo] = useState<{
    name?: string;
    order_type?: string;
    package?: string;
    babka_flavor?: string;
    amount_total?: number;
    is_installment?: boolean;
  } | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) { setStatus("error"); return; }
    fetch(`/api/coopchallah/success?session_id=${sessionId}`)
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
        <a href="/coopchallah" className="bg-yellow-400 text-black font-black px-8 py-3 rounded-full">Go Back</a>
      </div>
    </main>
  );

  const flavor = info?.babka_flavor;
  const isInstallment = info?.is_installment;
  const installmentAmt = info?.amount_total ? (info.amount_total / 4).toFixed(2) : null;

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center">
        <div className="text-5xl mb-5">🍞✨</div>
        <h1 className="text-3xl font-black mb-2">Shabbat Shalom!</h1>
        <p className="text-zinc-400 mb-8 text-sm">You&apos;re all set, {info?.name?.split(" ")[0]}. Your Challah order is confirmed.</p>

        <div className="bg-zinc-950 border-2 border-yellow-400 rounded-3xl p-6 mb-6 text-left space-y-3">
          <div className="flex justify-between">
            <span className="text-zinc-500 text-sm">Name</span>
            <span className="font-black">{info?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 text-sm">Plan</span>
            <span className="font-black text-sm text-right">{ORDER_TYPE_LABEL[info?.order_type || ""] || info?.order_type}</span>
          </div>
          {flavor && (
            <div className="flex justify-between">
              <span className="text-zinc-500 text-sm">Babka</span>
              <span className="font-black capitalize">{flavor === "cinnamon" ? "🤎 Cinnamon" : "🍫 Chocolate"}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-zinc-800 pt-3">
            <span className="text-zinc-500 text-sm">Total</span>
            <span className="font-black text-yellow-400">${Number(info?.amount_total).toFixed(2)}</span>
          </div>
        </div>

        {isInstallment && (
          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-5 mb-6 text-sm text-left">
            <p className="text-yellow-400 font-black mb-2">💳 Payment Plan Active</p>
            <p className="text-zinc-300 mb-3">Your first installment of <strong>${installmentAmt}</strong> was charged today. The remaining 3 will auto-draft on:</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {["Oct 15", "Jan 8", "Mar 15"].map(d => (
                <div key={d} className="bg-yellow-400/10 rounded-lg py-1.5 text-yellow-400 font-black text-xs">{d}</div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 mb-6">
          <p className="text-2xl mb-2">📍</p>
          <p className="font-black text-lg mb-1">Pick Up at The Coop Counter</p>
          <p className="text-zinc-400 text-sm">Every Friday morning. Just give your name — we&apos;ll have it ready for you!</p>
        </div>

        <p className="text-zinc-700 text-xs">A confirmation has been sent to our team. Questions? Call or text us!</p>
      </div>
    </main>
  );
}
