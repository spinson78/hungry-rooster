"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Order = {
  purchaser_name: string; classroom: string; delivery_date: string;
  delivery_time: string; order_type: string; quantity: number;
  student_count: number; cupcake_flavor: string; toppings: string[]; total: number;
};

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    fetch(`/api/coopcelebrate/success?session_id=${sessionId}`)
      .then(r => r.json())
      .then(d => { if (d.order) setOrder(d.order); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sessionId]);

  const typeLabel = order?.order_type === "froyo" ? "Frozen Yogurt Party"
    : order?.order_type === "cupcakes" ? "Cupcake Order"
    : "Coop Celebration Pack";

  if (loading) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-zinc-400 animate-pulse">Confirming your order…</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-16">
      <p className="text-5xl mb-4">🎉</p>
      <h1 className="text-3xl font-black mb-2 text-center">Order Confirmed!</h1>
      <p className="text-teal-400 font-bold text-lg mb-6 text-center">We'll be ready for the party!</p>

      {order && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-3 mb-6">
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Order Type</p>
            <p className="font-black text-yellow-400">{typeLabel}</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Purchaser</p>
            <p className="font-bold">{order.purchaser_name}</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Classroom</p>
            <p className="font-bold">{order.classroom}</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Delivery</p>
            <p className="font-bold">{order.delivery_date} at {order.delivery_time}</p>
          </div>
          {order.student_count && (
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Students</p>
              <p className="font-bold">{order.student_count}</p>
            </div>
          )}
          {order.cupcake_flavor && (
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Flavor</p>
              <p className="font-bold capitalize">{order.cupcake_flavor}</p>
            </div>
          )}
          {order.toppings?.length > 0 && (
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Toppings</p>
              <p className="font-bold">{order.toppings.join(", ")}</p>
            </div>
          )}
          <div className="border-t border-zinc-800 pt-3 flex justify-between items-center">
            <p className="text-zinc-500 text-sm">Total Paid</p>
            <p className="text-yellow-400 font-black text-xl">${Number(order.total).toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 max-w-md w-full text-center">
        <p className="text-zinc-400 text-sm">⚠️ Once purchased, no changes can be made.</p>
        <p className="text-zinc-500 text-xs mt-1">Questions? Email <a href="mailto:sales@thehungryroostertx.com" className="text-yellow-400 underline">sales@thehungryroostertx.com</a></p>
      </div>
    </main>
  );
}

export default function CelebrationSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center"><p className="text-zinc-400 animate-pulse">Loading…</p></div>}>
      <SuccessContent />
    </Suspense>
  );
}
