"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useRef } from "react";

type Status = "loading" | "gift_card" | "dinner_scheduled" | "dinner_coupon" | "error";

export default function GiftSuccessPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [recipientName, setRecipientName] = useState("");
  const [claimCode, setClaimCode] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const type = params.get("type");
    if (!sessionId) { setStatus("error"); return; }

    const confirm = async () => {
      try {
        const res = await fetch(`/api/gift-success?session_id=${sessionId}`);
        const data = await res.json();
        if (!data.success) { setStatus("error"); return; }

        setRecipientName(data.recipient_name || "");
        if (data.gift_type === "gift_card") {
          setStatus("gift_card");
        } else if (data.dinner_gift_type === "scheduled") {
          setStatus("dinner_scheduled");
        } else {
          setClaimCode(data.claim_code || "");
          setStatus("dinner_coupon");
        }
      } catch {
        setStatus("error");
      }
    };
    confirm();
  }, []);

  if (status === "loading") return (
    <main className="bg-black text-white min-h-screen flex items-center justify-center">
      <p className="text-zinc-400 text-lg">Processing your gift...</p>
    </main>
  );

  if (status === "error") return (
    <main className="bg-black text-white min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-black mb-4">Something went wrong</h1>
        <p className="text-zinc-400 mb-6">If you were charged, reach out and we'll make it right.</p>
        <a href="/" className="bg-teal-500 text-black font-black px-8 py-4 rounded-full inline-block">Back to Home</a>
      </div>
    </main>
  );

  return (
    <main className="bg-black text-white min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">
          {status === "gift_card" ? "💳" : status === "dinner_scheduled" ? "🚗" : "🎟️"}
        </div>

        {status === "gift_card" && (
          <>
            <h1 className="text-4xl font-black mb-3">Gift card sent!</h1>
            <p className="text-zinc-400 text-lg mb-2">
              {recipientName ? `${recipientName} is going to love this.` : "They're going to love this."}
            </p>
            <p className="text-zinc-500 text-sm mb-8">
              We emailed the gift card code to your recipient. They can use it on any order.
            </p>
          </>
        )}

        {status === "dinner_scheduled" && (
          <>
            <h1 className="text-4xl font-black mb-3">Dinner is on its way!</h1>
            <p className="text-zinc-400 text-lg mb-2">
              {recipientName ? `We'll take care of ${recipientName}.` : "We'll take care of them."}
            </p>
            <p className="text-zinc-500 text-sm mb-8">
              We've got the delivery on our calendar. We'll confirm with you closer to the date.
            </p>
          </>
        )}

        {status === "dinner_coupon" && (
          <>
            <h1 className="text-4xl font-black mb-3">Coupon sent!</h1>
            <p className="text-zinc-400 text-lg mb-2">
              {recipientName ? `${recipientName} got an email` : "Your recipient got an email"} with a link to claim their dinner.
            </p>
            {claimCode && (
              <p className="text-zinc-500 text-sm mb-4">
                Their claim code: <span className="font-black text-yellow-400">{claimCode}</span>
              </p>
            )}
            <p className="text-zinc-500 text-sm mb-8">
              They'll pick their date and delivery address when they're ready.
            </p>
          </>
        )}

        <div className="flex gap-4 justify-center flex-wrap">
          <a href="/gift" className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-8 py-4 rounded-full transition-colors">
            Send Another Gift
          </a>
          <a href="/" className="border border-zinc-700 hover:border-zinc-500 text-white font-black px-8 py-4 rounded-full transition-colors">
            Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}
