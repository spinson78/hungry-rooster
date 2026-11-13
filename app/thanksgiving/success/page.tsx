"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import NavBar from "../../components/NavBar";

type TGOrder = {
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_address: string;
  items: Array<{ name: string; qty: number; unit_price: number }>;
  total: number;
  special_requests?: string;
};

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [order, setOrder] = useState<TGOrder | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) { setError("Missing session ID."); return; }
    fetch(`/api/thanksgiving/success?session_id=${sessionId}`)
      .then(r => r.json())
      .then(d => { if (d.order) setOrder(d.order); else setError(d.error || "Could not confirm order."); })
      .catch(() => setError("Something went wrong."));
  }, [sessionId]);

  if (!order && !error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-400">Confirming your order…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-400 font-bold mb-2">Something went wrong</p>
          <p className="text-zinc-500 text-sm">{error}</p>
          <a href="/thanksgiving" className="mt-6 inline-block text-orange-400 hover:text-orange-300 font-bold">← Back to order page</a>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-black text-white min-h-screen">
      <NavBar />
      <div className="px-5 py-12 max-w-xl mx-auto text-center">
        <p className="text-6xl mb-4">🦃</p>
        <h1 className="text-3xl font-black mb-2">You're on the list!</h1>
        <p className="text-zinc-400 mb-1">Order #{order!.order_number}</p>
        <p className="text-zinc-500 text-sm mb-8">A receipt has been sent to <strong className="text-white">{order!.customer_email}</strong></p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left mb-6">
          <p className="text-orange-400 font-black text-xs uppercase tracking-widest mb-4">Your Order</p>
          <div className="space-y-2 mb-4">
            {(order!.items || []).map(i => (
              <div key={i.name} className="flex justify-between text-sm">
                <span className="text-zinc-300">{i.qty}× {i.name}</span>
                <span className="font-bold">${(i.unit_price * i.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-700 pt-3 flex justify-between font-black">
            <span>Total Charged</span>
            <span className="text-orange-400">${Number(order!.total).toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-left mb-8">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Delivery</p>
          <p className="font-bold">Wednesday, November 26</p>
          <p className="text-zinc-400 text-sm mt-1">{order!.customer_address}</p>
        </div>

        <p className="text-zinc-500 text-sm">Questions? Email <a href="mailto:sales@thehungryroostertx.com" className="text-orange-400 hover:underline">sales@thehungryroostertx.com</a></p>
        <a href="/" className="mt-6 inline-block text-zinc-500 hover:text-white text-sm transition-colors">← Back to The Hungry Rooster</a>
      </div>
    </main>
  );
}

export default function ThanksgivingSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center"><p className="text-zinc-400">Loading…</p></div>}>
      <SuccessContent />
    </Suspense>
  );
}
