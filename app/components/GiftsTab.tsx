"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type GiftCard = {
  id: string;
  code: string;
  amount_cents: number;
  balance_cents: number;
  purchaser_name: string;
  purchaser_email: string;
  recipient_name: string;
  recipient_email: string;
  message: string;
  created_at: string;
  status: string;
};

type DinnerGift = {
  id: string;
  gift_type: string;
  claim_code: string | null;
  package_name: string;
  serves: string;
  purchaser_name: string;
  purchaser_email: string;
  recipient_name: string;
  recipient_email: string;
  recipient_phone: string;
  message: string;
  delivery_date: string | null;
  delivery_address: string | null;
  delivery_city_zip: string | null;
  claim_delivery_date: string | null;
  claim_delivery_address: string | null;
  claim_delivery_city_zip: string | null;
  claimed_at: string | null;
  created_at: string;
  status: string;
  notes: string | null;
};

function fmt(cents: number) { return `$${(cents / 100).toFixed(2)}`; }
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function GiftsTab() {
  const [view, setView] = useState<"gift_cards" | "dinner_gifts">("gift_cards");
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [dinnerGifts, setDinnerGifts] = useState<DinnerGift[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [gcRes, dgRes] = await Promise.all([
      supabase.from("gift_cards").select("*").order("created_at", { ascending: false }),
      supabase.from("dinner_gifts").select("*").order("created_at", { ascending: false }),
    ]);
    setGiftCards(gcRes.data || []);
    setDinnerGifts(dgRes.data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const markDelivered = async (id: string) => {
    await supabase.from("dinner_gifts").update({ status: "delivered" }).eq("id", id);
    loadData();
  };

  const cancelDinnerGift = async (id: string) => {
    if (!confirm("Cancel this dinner gift?")) return;
    await supabase.from("dinner_gifts").update({ status: "cancelled" }).eq("id", id);
    loadData();
  };

  const gcTotal = giftCards.reduce((s, g) => s + g.amount_cents, 0);
  const gcActive = giftCards.filter((g) => g.status === "active").length;
  const gcBalance = giftCards.filter((g) => g.status === "active").reduce((s, g) => s + g.balance_cents, 0);
  const dgPending = dinnerGifts.filter((g) => g.status === "pending").length;
  const dgClaimed = dinnerGifts.filter((g) => g.status === "claimed").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-white">🎁 Gifts</h2>
        <button onClick={loadData} className="text-xs text-zinc-400 hover:text-white px-3 py-1 border border-zinc-700 rounded-lg transition-colors">Refresh</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Gift Cards Sold", value: giftCards.length },
          { label: "Active Cards", value: gcActive },
          { label: "Outstanding Balance", value: fmt(gcBalance) },
          { label: "Dinners Pending", value: dgPending },
          { label: "Dinners Claimed", value: dgClaimed },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-zinc-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setView("gift_cards")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${view === "gift_cards" ? "bg-yellow-400 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}>
          💳 Gift Cards ({giftCards.length})
        </button>
        <button onClick={() => setView("dinner_gifts")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${view === "dinner_gifts" ? "bg-teal-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}>
          🍽️ Dinner Gifts ({dinnerGifts.length})
        </button>
      </div>

      {loading && <p className="text-zinc-400 text-center py-10">Loading...</p>}

      {/* ── GIFT CARDS ── */}
      {!loading && view === "gift_cards" && (
        <div className="space-y-3">
          {giftCards.length === 0 && <p className="text-zinc-500 text-center py-10">No gift cards yet.</p>}
          {giftCards.map((gc) => (
            <div key={gc.id} className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-yellow-400 tracking-widest text-sm">{gc.code}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      gc.status === "active" ? "bg-green-500/20 text-green-400" :
                      gc.status === "depleted" ? "bg-zinc-600 text-zinc-300" : "bg-red-500/20 text-red-400"
                    }`}>{gc.status}</span>
                  </div>
                  <p className="text-white text-sm">
                    <span className="text-zinc-400">For:</span> {gc.recipient_name || "—"}
                    {gc.recipient_email && <span className="text-zinc-500 ml-2">({gc.recipient_email})</span>}
                  </p>
                  <p className="text-zinc-400 text-xs">
                    From: {gc.purchaser_name || "—"} · Purchased {fmtDate(gc.created_at)}
                  </p>
                  {gc.message && <p className="text-zinc-500 text-xs italic mt-1">"{gc.message}"</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white font-black">{fmt(gc.balance_cents)} <span className="text-zinc-500 font-normal text-xs">remaining</span></p>
                  <p className="text-zinc-500 text-xs">of {fmt(gc.amount_cents)} original</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── DINNER GIFTS ── */}
      {!loading && view === "dinner_gifts" && (
        <div className="space-y-3">
          {dinnerGifts.length === 0 && <p className="text-zinc-500 text-center py-10">No dinner gifts yet.</p>}
          {dinnerGifts.map((dg) => {
            const isScheduled = dg.gift_type === "scheduled";
            const delivDate = isScheduled ? dg.delivery_date : dg.claim_delivery_date;
            const delivAddr = isScheduled ? dg.delivery_address : dg.claim_delivery_address;
            const delivCityZip = isScheduled ? dg.delivery_city_zip : dg.claim_delivery_city_zip;

            return (
              <div key={dg.id} className={`bg-zinc-800 rounded-xl p-4 border ${
                dg.status === "pending" ? "border-yellow-500/40" :
                dg.status === "claimed" ? "border-teal-500/40" :
                dg.status === "delivered" ? "border-zinc-600" : "border-red-500/30"
              }`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-black text-white">{dg.package_name}</span>
                      {dg.serves && <span className="text-zinc-400 text-xs">{dg.serves}</span>}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isScheduled ? "bg-blue-500/20 text-blue-300" : "bg-purple-500/20 text-purple-300"
                      }`}>{isScheduled ? "🚗 Scheduled" : "🎟️ Coupon"}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        dg.status === "pending" ? "bg-yellow-500/20 text-yellow-300" :
                        dg.status === "claimed" ? "bg-teal-500/20 text-teal-300" :
                        dg.status === "delivered" ? "bg-zinc-600 text-zinc-300" : "bg-red-500/20 text-red-400"
                      }`}>{dg.status}</span>
                    </div>

                    <p className="text-sm text-white mb-0.5">
                      <span className="text-zinc-400">For:</span> {dg.recipient_name || "—"}
                      {dg.recipient_email && <span className="text-zinc-500 ml-2">({dg.recipient_email})</span>}
                      {dg.recipient_phone && <span className="text-zinc-500 ml-2">{dg.recipient_phone}</span>}
                    </p>
                    <p className="text-zinc-400 text-xs">
                      From: {dg.purchaser_name || "—"} · {fmtDate(dg.created_at)}
                    </p>

                    {delivDate && (
                      <p className="text-teal-400 text-sm font-semibold mt-2">
                        📅 {fmtDate(delivDate)}{delivAddr ? ` → ${delivAddr}${delivCityZip ? `, ${delivCityZip}` : ""}` : ""}
                      </p>
                    )}

                    {!isScheduled && dg.claim_code && (
                      <p className="text-yellow-400 text-xs font-mono mt-1">Code: {dg.claim_code}{dg.claimed_at ? ` — claimed ${fmtDate(dg.claimed_at)}` : " — not yet claimed"}</p>
                    )}

                    {dg.message && <p className="text-zinc-500 text-xs italic mt-1">"{dg.message}"</p>}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {(dg.status === "claimed" || (dg.status === "pending" && isScheduled)) && (
                      <button onClick={() => markDelivered(dg.id)}
                        className="text-xs bg-teal-500 hover:bg-teal-400 text-black font-bold px-3 py-1.5 rounded-lg transition-colors">
                        ✓ Mark Delivered
                      </button>
                    )}
                    {dg.status === "pending" && (
                      <button onClick={() => cancelDinnerGift(dg.id)}
                        className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold px-3 py-1.5 rounded-lg transition-colors">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
