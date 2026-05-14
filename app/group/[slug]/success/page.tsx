export const dynamic = 'force-dynamic';
"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function GroupOrderSuccess() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const sessionId = searchParams?.get("session_id");
  const [done, setDone] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const ran = useRef(false);

  useEffect(() => {
    if (!sessionId || ran.current) return;
    ran.current = true;

    const confirm = async () => {
      // Verify + retrieve session from Stripe via API
      const res = await fetch(`/api/group-confirm?session_id=${sessionId}`);
      const data = await res.json();
      if (!data.success) return;

      const today = new Date().toISOString().split("T")[0];

      // Insert confirmed order into Supabase
      await supabase.from("group_orders").insert({
        location_id: data.location_id,
        location_slug: data.location_slug,
        person_name: data.person_name,
        items: data.items,
        total: data.total,
        special_requests: data.special_requests,
        delivery_date: today,
        status: "paid",
        stripe_session_id: sessionId,
      });

      // Get updated count
      const { count } = await supabase
        .from("group_orders")
        .select("*", { count: "exact", head: true })
        .eq("location_slug", data.location_slug)
        .eq("delivery_date", today)
        .eq("status", "paid");

      setOrderCount(count || 0);

      // Notify if minimum just hit
      if ((count || 0) >= 10) {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_type: "group_order",
            customer_name: data.person_name,
            customer_phone: "N/A",
            customer_email: "N/A",
            customer_address: data.location_name,
            special_requests: `Group order minimum reached for ${data.location_name} — ${count} orders today`,
            items: data.items,
            total: data.total,
          }),
        });
      }

      setDone(true);
    };

    confirm();
  }, [sessionId]);

  return (
    <main className="bg-black text-white min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">{done ? "🐓" : "⏳"}</div>
        <h1 className="text-4xl font-black mb-4">
          {done ? "You're in!" : "Confirming your order..."}
        </h1>
        {done && (
          <>
            <p className="text-zinc-400 text-lg mb-2">Payment confirmed. Your order has been added to the group.</p>
            <p className="text-teal-400 font-bold mb-6">
              {orderCount >= 10
                ? `✅ ${orderCount} orders placed — delivery is confirmed for today!`
                : `${orderCount} / 10 orders so far — spread the word!`}
            </p>
            <a href={`/group/${slug}`} className="bg-teal-500 hover:bg-teal-400 text-black font-black px-8 py-4 rounded-full text-lg transition-colors inline-block">
              Back to order page
            </a>
          </>
        )}
      </div>
    </main>
  );
}
