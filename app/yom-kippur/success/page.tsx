"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import NavBar from "../../components/NavBar";
import { Suspense } from "react";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_address: string;
  quantity: number;
  total: number;
  special_requests: string;
};

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) { setError("No order found."); setLoading(false); return; }
    fetch(`/api/yom-kippur/success?session_id=${sessionId}`)
      .then(r => r.json())
      .then(d => {
        if (d.order) setOrder(d.order);
        else setError(d.error || "Order not found.");
      })
      .catch(() => setError("Network error."))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-400">Loading your order…</p>
    </div>
  );

  if (error) return (
    <main className="bg-black text-white min-h-screen">
      <NavBar />
      <div className="px-6 py-20 max-w-lg mx-auto text-center">
        <p className="text-red-400 font-bold">{error}</p>
      </div>
    </main>
  );

  return (
    <main className="bg-black text-white min-h-screen">
      <NavBar />
      <div className="px-6 py-16 max-w-lg mx-auto text-center">
        <div className="text-6xl mb-6">🕍</div>
        <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-2">You&apos;re all set</p>
        <h1 className="text-4xl font-black mb-4">Order Confirmed!</h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          G&apos;mar Chatimah Tovah! Your Break Fast Box is confirmed and on the way Sunday evening.
        </p>

        {order && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left space-y-3 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Order #</span>
              <span className="font-bold">{order.order_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Name</span>
              <span className="font-bold">{order.customer_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Delivery to</span>
              <span className="font-bold text-right max-w-[60%]">{order.customer_address}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Delivery</span>
              <span className="font-bold text-yellow-400">Sunday, Sep 20 · Evening</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Total paid</span>
              <span className="font-bold">${order.total?.toFixed(2)}</span>
            </div>
            {order.special_requests && (
              <div className="pt-2 border-t border-zinc-800">
                <p className="text-zinc-500 text-xs mb-1">Special requests</p>
                <p className="text-sm">{order.special_requests}</p>
              </div>
            )}
          </div>
        )}

        <p className="text-zinc-500 text-sm">
          Questions? Call us at <a href="tel:9452157907" className="text-yellow-400 font-bold hover:underline">945-215-7907</a>
        </p>
      </div>
    </main>
  );
}

export default function YomKippurSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><p className="text-zinc-400">Loading…</p></div>}>
      <SuccessContent />
    </Suspense>
  );
}
