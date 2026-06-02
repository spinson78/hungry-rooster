"use client";
import { useParams } from "next/navigation";

export default function InvoicePaidPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-10 border border-zinc-200">
          <p className="text-5xl mb-4">✅</p>
          <h1 className="text-2xl font-black text-zinc-900 mb-2">Payment Received</h1>
          <p className="text-zinc-500 text-sm mb-6">
            Thank you! Your payment has been processed. You'll receive a receipt by email.
          </p>
          <a
            href={`/invoice/${id}`}
            className="inline-block bg-zinc-900 hover:bg-zinc-800 text-white font-black px-8 py-3 rounded-full text-sm transition-colors"
          >
            View Invoice
          </a>
        </div>
        <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-8 w-auto mx-auto mt-8 opacity-40" />
      </div>
    </main>
  );
}
