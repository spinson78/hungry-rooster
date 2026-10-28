"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Inquiry = {
  id: string;
  name: string;
  phone: string;
  email: string;
  event_date: string | null;
  headcount: string | null;
  event_type: string | null;
  location: string | null;
  budget: string | null;
  notes: string | null;
  responded: boolean;
  responded_at: string | null;
  responded_by: string | null;
  created_at: string;
};

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function fmtPhone(p: string) {
  const d = (p || "").replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  return p;
}

export default function CateringInquiriesTab() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "responded">("pending");
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchInquiries = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("catering_inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    setInquiries((data as Inquiry[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchInquiries(); }, []);

  const markResponded = async (id: string, responded: boolean) => {
    setUpdating(id);
    await supabase
      .from("catering_inquiries")
      .update({
        responded,
        responded_at: responded ? new Date().toISOString() : null,
      })
      .eq("id", id);
    setInquiries(prev => prev.map(i =>
      i.id === id ? { ...i, responded, responded_at: responded ? new Date().toISOString() : null } : i
    ));
    setUpdating(null);
  };

  const filtered = inquiries.filter(i => {
    if (filter === "pending") return !i.responded;
    if (filter === "responded") return i.responded;
    return true;
  });

  const pendingCount = inquiries.filter(i => !i.responded).length;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black">📋 Catering Inquiries</h2>
          <p className="text-zinc-500 text-sm mt-1">Custom quote requests — track and respond to each one.</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="bg-red-500/20 text-red-400 text-xs font-black px-3 py-1 rounded-full border border-red-500/30">
              {pendingCount} need{pendingCount === 1 ? "s" : ""} response
            </span>
          )}
          <button onClick={fetchInquiries} className="text-teal-400 font-bold text-sm hover:text-teal-300 transition-colors">↻ Refresh</button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["pending", "all", "responded"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-black transition-colors capitalize ${
              filter === f ? "bg-teal-500 text-black" : "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white"
            }`}
          >
            {f === "pending" ? `Needs Response${pendingCount > 0 ? ` (${pendingCount})` : ""}` : f === "all" ? `All (${inquiries.length})` : `Responded`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-zinc-900 rounded-2xl p-10 border border-zinc-800 text-center">
          <p className="text-zinc-400">{filter === "pending" ? "No pending inquiries 🎉" : "No inquiries yet."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inquiry => (
            <div
              key={inquiry.id}
              className={`bg-zinc-900 rounded-2xl border transition-colors ${inquiry.responded ? "border-zinc-800" : "border-teal-500/40"}`}
            >
              {/* Header row */}
              <div
                className="p-5 cursor-pointer"
                onClick={() => setExpanded(expanded === inquiry.id ? null : inquiry.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-black text-white text-lg">{inquiry.name}</span>
                      {inquiry.responded ? (
                        <span className="text-xs font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">✓ Responded</span>
                      ) : (
                        <span className="text-xs font-bold bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-400/30">Needs Response</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
                      <span>📞 {fmtPhone(inquiry.phone)}</span>
                      <span>✉ {inquiry.email}</span>
                      {inquiry.event_date && <span>📅 {inquiry.event_date}</span>}
                      {inquiry.event_type && <span>🎉 {inquiry.event_type}</span>}
                      {inquiry.headcount && <span>👥 {inquiry.headcount} people</span>}
                    </div>
                    <p className="text-zinc-600 text-xs mt-1">Submitted {fmt(inquiry.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); markResponded(inquiry.id, !inquiry.responded); }}
                      disabled={updating === inquiry.id}
                      className={`font-black text-sm px-4 py-2 rounded-full transition-colors disabled:opacity-50 ${
                        inquiry.responded
                          ? "border border-zinc-600 text-zinc-400 hover:border-red-400 hover:text-red-400"
                          : "bg-green-500 hover:bg-green-400 text-black"
                      }`}
                    >
                      {updating === inquiry.id ? "…" : inquiry.responded ? "↩ Undo" : "✓ Mark Responded"}
                    </button>
                    <span className="text-zinc-600 text-xs">{expanded === inquiry.id ? "▲" : "▼"}</span>
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === inquiry.id && (
                <div className="border-t border-zinc-800 px-5 pb-5 pt-4 space-y-3">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {inquiry.location && (
                      <div>
                        <p className="text-zinc-500 text-xs uppercase tracking-wide font-bold mb-1">Location</p>
                        <p className="text-white">{inquiry.location}</p>
                      </div>
                    )}
                    {inquiry.budget && (
                      <div>
                        <p className="text-zinc-500 text-xs uppercase tracking-wide font-bold mb-1">Budget</p>
                        <p className="text-white">{inquiry.budget}</p>
                      </div>
                    )}
                    {inquiry.headcount && (
                      <div>
                        <p className="text-zinc-500 text-xs uppercase tracking-wide font-bold mb-1">Headcount</p>
                        <p className="text-white">{inquiry.headcount}</p>
                      </div>
                    )}
                    {inquiry.event_type && (
                      <div>
                        <p className="text-zinc-500 text-xs uppercase tracking-wide font-bold mb-1">Event Type</p>
                        <p className="text-white">{inquiry.event_type}</p>
                      </div>
                    )}
                  </div>
                  {inquiry.notes && (
                    <div>
                      <p className="text-zinc-500 text-xs uppercase tracking-wide font-bold mb-1">Notes</p>
                      <p className="text-white text-sm bg-zinc-800 rounded-xl px-4 py-3">{inquiry.notes}</p>
                    </div>
                  )}
                  {inquiry.responded && inquiry.responded_at && (
                    <p className="text-green-400 text-xs">✓ Marked responded {fmt(inquiry.responded_at)}</p>
                  )}
                  {/* Quick contact links */}
                  <div className="flex gap-3 pt-1">
                    <a
                      href={`tel:${inquiry.phone}`}
                      className="text-sm font-bold text-teal-400 hover:text-teal-300 border border-teal-400/30 hover:border-teal-400 px-4 py-2 rounded-full transition-colors"
                    >
                      📞 Call
                    </a>
                    <a
                      href={`mailto:${inquiry.email}?subject=Your Hungry Rooster Catering Inquiry`}
                      className="text-sm font-bold text-teal-400 hover:text-teal-300 border border-teal-400/30 hover:border-teal-400 px-4 py-2 rounded-full transition-colors"
                    >
                      ✉ Email
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
