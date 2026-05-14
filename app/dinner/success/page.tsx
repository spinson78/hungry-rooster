"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DinnerSuccessPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [customerName, setCustomerName] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const sessionId = searchParams.get("session_id");
    if (!sessionId) { setStatus("error"); return; }

    const confirm = async () => {
      try {
        const res = await fetch(`/api/dinner-confirm?session_id=${sessionId}`);
        const data = await res.json();
        if (!data.success) { setStatus("error"); return; }

        setCustomerName(data.customer_name);

        // Insert order
        await supabase.from("orders").insert({
          order_type: "dinner",
          menu_id: data.menu_id || null,
          customer_name: data.customer_name,
          customer_email: data.customer_email,
          customer_phone: data.customer_phone,
          customer_address: data.customer_address,
          special_requests: data.special_requests,
          items: data.items,
          total: 85,
          status: "paid",
          stripe_session_id: sessionId,
        });

        // Decrement dinner quantity
        if (data.menu_id) {
          const { data: menuData } = await supabase
            .from("dinner_menus")
            .select("quantity_remaining")
            .eq("id", data.menu_id)
            .single();
          if (menuData && menuData.quantity_remaining > 0) {
            await supabase
              .from("dinner_menus")
              .update({ quantity_remaining: menuData.quantity_remaining - 1 })
              .eq("id", data.menu_id);
          }
        }

        // Notify
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_type: "dinner",
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            customer_email: data.customer_email,
            customer_address: data.customer_address,
            special_requests: data.special_requests,
            items: data.items,
            total: 85,
          }),
        });

        setStatus("success");
      } catch {
        setStatus("error");
      }
    };

    confirm();
  }, [searchParams]);

  if (status === "loading") {
    return (
      <main className="bg-black text-white min-h-screen flex items-center justify-center">
        <p className="text-zinc-400 text-lg">Confirming your order...</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="bg-black text-white min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-black mb-4">Something went wrong</h1>
          <p className="text-zinc-400 mb-6">If you were charged, reach out and we'll make it right.</p>
          <a href="/" className="bg-teal-500 text-black font-black px-8 py-4 rounded-full inline-block">Back to Home</a>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-black text-white min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🐓</div>
        <h1 className="text-4xl font-black mb-3">Order confirmed{customerName ? `, ${customerName.split(" ")[0]}` : ""}!</h1>
        <p className="text-zinc-400 text-lg mb-2">Fred is on it. Dinner's coming to you tonight.</p>
        <p className="text-zinc-500 text-sm mb-8">We'll confirm delivery by text.</p>
        <a href="/" className="bg-teal-500 hover:bg-teal-400 text-black font-black px-8 py-4 rounded-full text-lg transition-colors inline-block">
          Back to Home
        </a>
      </div>
    </main>
  );
}
