"use client";
import { useEffect, useState } from "react";

export default function PaidPage() {
  const [amount, setAmount] = useState<string | null>(null);

  useEffect(() => {
    // Nothing to do — Stripe already confirmed payment.
    // We can show a generic thank-you.
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-7xl mb-6">✅</div>
        <h1 className="text-4xl font-black mb-3">Payment Received!</h1>
        <p className="text-zinc-400 text-lg mb-2">Thank you — enjoy your order!</p>
        <p className="text-zinc-600 text-sm mt-6">
          THE COOP · by The Hungry Rooster
        </p>
      </div>
    </main>
  );
}
