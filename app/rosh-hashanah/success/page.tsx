"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type OrderInfo = {
  customer_name: string;
  boxes_summary: string;
  addons_summary: string;
  total: number;
};

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [info, setInfo] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    fetch(`/api/rosh-hashanah/success?session_id=${sessionId}`)
      .then(r => r.json())
      .then(d => { if (d.order) setInfo(d.order); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-400 animate-pulse">Confirming your order…</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-16">
      <p className="text-6xl mb-4">🍎🍯✨</p>
      <h1 className="text-3xl font-black mb-2 text-center">Order Confirmed!</h1>
      <p className="text-yellow-400 font-bold text-lg mb-6 text-center">Shana Tova! 🎉</p>

      {info && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full mb-6 space-y-3">
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Name</p>
            <p className="font-bold">{info.customer_name}</p>
          </div>
          {info.boxes_summary && (
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Boxes</p>
              <p className="font-bold text-sm">{info.boxes_summary}</p>
            </div>
          )}
          {info.addons_summary && (
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Add-Ons</p>
              <p className="font-bold text-sm">{info.addons_summary}</p>
            </div>
          )}
          <div className="border-t border-zinc-800 pt-3 flex justify-between items-center">
            <p className="text-zinc-500 text-sm">Total Paid</p>
            <p className="text-yellow-400 font-black text-xl">${Number(info.total).toFixed(2)}</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
            <p className="text-green-400 font-bold text-sm">🚚 Delivery: Friday, September 11, 2026</p>
          </div>
        </div>
      )}

      <p className="text-zinc-500 text-sm text-center max-w-sm">
        You'll receive a confirmation email shortly. Questions? Email us at{" "}
        <a href="mailto:sales@thehungryroostertx.com" className="text-yellow-400 underline">
          sales@thehungryroostertx.com
        </a>
      </p>
    </main>
  );
}

export default function RoshHashanahSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center"><p className="text-zinc-400 animate-pulse">Loading…</p></div>}>
      <SuccessContent />
    </Suspense>
  );
}
