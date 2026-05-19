"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type OrderItem = { name: string; qty?: number; price?: number; subtotal?: number };

export default function GroupSuccessPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [customerName, setCustomerName] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    if (!sessionId) { setStatus("error"); return; }

    const confirm = async () => {
      try {
        const res = await fetch(`/api/group-confirm?session_id=${sessionId}`);
        const data = await res.json();
        if (!data.success) { setStatus("error"); return; }

        setCustomerName(data.person_name);
        setOrderItems(data.items || []);
        setOrderTotal(data.total);

        const today = new Date().toISOString().split("T")[0];
        const { data: todayOrders } = await supabase
          .from("group_orders")
          .select("total")
          .eq("location_slug", data.location_slug)
          .eq("delivery_date", today)
          .eq("status", "paid");
        const totalSoFar = (todayOrders || []).reduce((sum: number, o: { total: number }) => sum + (o.total || 0), 0);
        setOrderCount(totalSoFar);

        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_type: "group_order",
            customer_name: data.person_name,
            customer_phone: "",
            customer_email: data.customer_email || "",
            customer_address: data.location_name,
            special_requests: data.special_requests,
            items: data.items,
            total: data.total,
          }),
        });

        setStatus("success");
      } catch { setStatus("error"); }
    };
    confirm();
  }, []);

  if (status === "loading") return (
    <main className="bg-black text-white min-h-screen flex items-center justify-center">
      <p className="text-zinc-400 text-lg">Confirming your order...</p>
    </main>
  );

  if (status === "error") return (
    <main className="bg-black text-white min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-black mb-4">Something went wrong</h1>
        <p className="text-zinc-400 mb-6">If you were charged, reach out and we&apos;ll make it right.</p>
        <a href={`/group/${slug}`} className="bg-teal-500 text-black font-black px-8 py-4 rounded-full inline-block">Try Again</a>
      </div>
    </main>
  );

  return (
    <main className="bg-black text-white min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">&#x1F413;</div>
          <h1 className="text-4xl font-black mb-2">You&apos;re in{customerName ? `, ${customerName.split(" ")[0]}` : ""}!</h1>
          <p className="text-zinc-400 text-lg">Your order is confirmed and paid.</p>
          {orderCount > 0 && (
            <p className={`font-bold mt-2 ${orderCount >= 165 ? "text-teal-400" : "text-yellow-400"}`}>
              ${orderCount.toFixed(0)} in orders today{orderCount >= 165 ? " — minimum met! &#x1F389;" : " of $165 minimum"}
            </p>
          )}
        </div>

        {orderItems.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Your Order</p>
            <div className="space-y-2 mb-4">
              {orderItems.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-zinc-300">{item.qty && item.qty > 1 ? `${item.qty}x ` : ""}{item.name}</span>
                  <span className="text-white font-bold">${((item.subtotal ?? (item.price ?? 0) * (item.qty ?? 1))).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-zinc-700 pt-3 flex justify-between font-black">
              <span>Total</span>
              <span className="text-teal-400">${orderTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        <p className="text-zinc-500 text-sm text-center mb-8">Fred&apos;s got it from here. Check your email for a confirmation.</p>
        <a href="/" className="block w-full bg-teal-500 hover:bg-teal-400 text-black font-black px-8 py-4 rounded-full text-lg transition-colors text-center">Back to Home</a>
      </div>
    </main>
  );
}
