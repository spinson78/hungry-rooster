"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function GroupSuccessPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [customerName, setCustomerName] = useState("");
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

        // Check if webhook already recorded this order (idempotency)
        const { data: existing } = await supabase
          .from("group_orders")
          .select("id")
          .eq("stripe_session_id", sessionId)
          .maybeSingle();

        if (!existing) {
          await supabase.from("group_orders").insert({
            location_id: data.location_id,
            location_slug: data.location_slug,
            person_name: data.person_name,
            items: data.items,
            total: data.total,
            special_requests: data.special_requests || "",
            delivery_date: data.delivery_date,
            status: "paid",
            stripe_session_id: sessionId,
          });
        }

        const today = new Date().toISOString().split("T")[0];
        const { count } = await supabase.from("group_orders").select("*", { count: "exact", head: true }).eq("location_slug", data.location_slug).eq("delivery_date", today).eq("status", "paid");
        setOrderCount(count || 0);

        if (!existing) {
          await fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_type: "group_order", customer_name: data.person_name, customer_phone: "", customer_email: "", customer_address: data.location_name, special_requests: data.special_requests, items: data.items, total: data.total }),
          });
        }

        setStatus("success");
      } catch { setStatus("error"); }
    };
    confirm();
  }, []);

  if (status === "loading") return <main className="bg-black text-white min-h-screen flex items-center justify-center"><p className="text-zinc-400 text-lg">Confirming your order...</p></main>;
  if (status === "error") return <main className="bg-black text-white min-h-screen flex items-center justify-center px-6"><div className="text-center max-w-md"><h1 className="text-3xl font-black mb-4">Something went wrong</h1><p className="text-zinc-400 mb-6">If you were charged, reach out and we'll make it right.</p><a href={`/group/${slug}`} className="bg-teal-500 text-black font-black px-8 py-4 rounded-full inline-block">Try Again</a></div></main>;

  return (
    <main className="bg-black text-white min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🐓</div>
        <h1 className="text-4xl font-black mb-3">You're in{customerName ? `, ${customerName.split(" ")[0]}` : ""}!</h1>
        <p className="text-zinc-400 text-lg mb-2">Your order is confirmed and paid.</p>
        {orderCount > 0 && <p className="text-teal-400 font-bold mb-2">{orderCount} order{orderCount !== 1 ? "s" : ""} placed so far today.</p>}
        <p className="text-zinc-500 text-sm mb-8">Fred's got it from here.</p>
        <a href="/" className="bg-teal-500 hover:bg-teal-400 text-black font-black px-8 py-4 rounded-full text-lg transition-colors inline-block">Back to Home</a>
      </div>
    </main>
  );
}
