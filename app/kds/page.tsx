"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

const KDS_PASSWORD = "fredapproves";

type Ticket = {
  id: string;
  source: "orders" | "group_orders";
  order_type: string;
  customer_name: string;
  items: { name: string; protein?: string; side1?: string; side2?: string; extra?: string; description?: string; qty?: number }[];
  special_requests: string;
  created_at: string;
  status: string;
};

const TYPE_STYLE: Record<string, { label: string; color: string; border: string; bg: string }> = {
  dinner:      { label: "DINNER DROP",   color: "#2dd4bf", border: "#2dd4bf", bg: "rgba(45,212,191,0.08)" },
  shabbat:     { label: "SHABBAT BOX",   color: "#e9c46a", border: "#e9c46a", bg: "rgba(233,196,106,0.08)" },
  group_order: { label: "GROUP ORDER",   color: "#fb923c", border: "#fb923c", bg: "rgba(251,146,60,0.08)" },
  catering:    { label: "CATERING",      color: "#a78bfa", border: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
};

const getStyle = (type: string) =>
  TYPE_STYLE[type] || { label: type.toUpperCase(), color: "#a1a1aa", border: "#52525b", bg: "rgba(161,161,170,0.08)" };

const formatTime = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
};

const minutesAgo = (ts: string) => {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff === 1) return "1 min ago";
  return `${diff} min ago`;
};

export default function KDSPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [completing, setCompleting] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const audioRef = useRef<AudioContext | null>(null);

  // Tick every 30s to refresh "X min ago" display
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch { /* silent fail */ }
  };

  const fetchTickets = async () => {
    const cutoff = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(); // last 8 hours

    const [{ data: groupOrders }] = await Promise.all([
      supabase.from("group_orders").select("*").eq("status", "paid").gte("created_at", cutoff).order("created_at", { ascending: true }),
    ]);

    const all: Ticket[] = [
      ...(groupOrders || []).map((o) => ({
        id: o.id,
        source: "group_orders" as const,
        order_type: "group_order",
        customer_name: o.person_name,
        items: o.items,
        special_requests: o.special_requests || "",
        created_at: o.created_at,
        status: o.status,
      })),
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    setTickets(all);
  };

  useEffect(() => {
    if (!authed) return;
    fetchTickets();

    // Real-time subscriptions — Group Orders only on KDS
    const groupSub = supabase
      .channel("kds-group-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_orders" }, (payload) => {
        const o = payload.new as { id: string; person_name: string; items: Ticket["items"]; special_requests: string; created_at: string; status: string };
        if (o.status === "paid") {
          const ticket: Ticket = {
            id: o.id, source: "group_orders", order_type: "group_order",
            customer_name: o.person_name, items: o.items,
            special_requests: o.special_requests || "", created_at: o.created_at, status: o.status,
          };
          setTickets((prev) => [...prev, ticket].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          ));
          playChime();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(groupSub);
    };
  }, [authed]);

  const markDone = async (ticket: Ticket) => {
    setCompleting(ticket.id);
    await supabase.from(ticket.source).update({ status: "complete" }).eq("id", ticket.id);
    setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
    setCompleting(null);
  };

  if (!authed) {
    return (
      <main style={{ background: "#000", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#111", border: "1px solid #27272a", borderRadius: 16, padding: 40, width: 320, textAlign: "center" }}>
          <img src="/THR%20hor%20logo%20final.png" alt="THR" style={{ height: 40, margin: "0 auto 24px" }} />
          <p style={{ color: "#2dd4bf", fontWeight: 900, fontSize: 13, textTransform: "uppercase", letterSpacing: 2, marginBottom: 20 }}>Kitchen Display</p>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
            onKeyDown={(e) => e.key === "Enter" && (password === KDS_PASSWORD ? setAuthed(true) : setPasswordError(true))}
            style={{ width: "100%", background: "#1c1c1c", border: "1px solid #3f3f46", borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 8 }}
          />
          {passwordError && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 8 }}>Incorrect password</p>}
          <button
            onClick={() => password === KDS_PASSWORD ? setAuthed(true) : setPasswordError(true)}
            style={{ width: "100%", background: "#2dd4bf", color: "#000", fontWeight: 900, padding: "12px 0", borderRadius: 50, border: "none", fontSize: 15, cursor: "pointer", marginTop: 4 }}
          >
            Enter Kitchen
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: "#0a0a0a", minHeight: "100vh", padding: "20px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, borderBottom: "1px solid #1c1c1c", paddingBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/THR%20hor%20logo%20final.png" alt="THR" style={{ height: 32 }} />
          <span style={{ color: "#3f3f46", fontSize: 13, fontWeight: 700 }}>Kitchen Display</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: tickets.length > 0 ? "#2dd4bf" : "#3f3f46", fontWeight: 900, fontSize: 14 }}>
            {tickets.length === 0 ? "No active orders" : `${tickets.length} active order${tickets.length !== 1 ? "s" : ""}`}
          </span>
          <button
            onClick={fetchTickets}
            style={{ background: "#1c1c1c", border: "1px solid #27272a", color: "#a1a1aa", padding: "6px 14px", borderRadius: 50, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Empty state */}
      {tickets.length === 0 && (
        <div style={{ textAlign: "center", marginTop: 80 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🐓</div>
          <p style={{ color: "#3f3f46", fontWeight: 900, fontSize: 18 }}>All clear. Fred is waiting.</p>
          <p style={{ color: "#27272a", fontSize: 13, marginTop: 8 }}>New orders will appear here automatically.</p>
        </div>
      )}

      {/* Ticket grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {tickets.map((ticket) => {
          const style = getStyle(ticket.order_type);
          const mins = Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / 60000);
          const urgent = mins >= 15;
          return (
            <div
              key={ticket.id}
              style={{
                background: style.bg,
                border: `2px solid ${urgent ? "#ef4444" : style.border}`,
                borderRadius: 16,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                animation: "fadeIn 0.3s ease",
              }}
            >
              {/* Order type badge */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                  color: style.color,
                  fontWeight: 900,
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}>
                  {style.label}
                </span>
                <span style={{ color: urgent ? "#ef4444" : "#71717a", fontSize: 12, fontWeight: 700 }}>
                  {urgent && "⚠️ "}{minutesAgo(ticket.created_at)}
                </span>
              </div>

              {/* Customer name */}
              <div>
                <p style={{ color: "#ffffff", fontWeight: 900, fontSize: 22, margin: 0, lineHeight: 1.1 }}>
                  {ticket.customer_name}
                </p>
                <p style={{ color: "#52525b", fontSize: 12, margin: "4px 0 0" }}>{formatTime(ticket.created_at)}</p>
              </div>

              {/* Items */}
              <div style={{ borderTop: "1px solid #27272a", paddingTop: 12 }}>
                {(ticket.items || []).map((item, idx) => (
                  <div key={idx} style={{ marginBottom: 8 }}>
                    <p style={{ color: "#e4e4e7", fontWeight: 700, fontSize: 15, margin: 0 }}>
                      {item.qty && item.qty > 1 ? `${item.qty}× ` : ""}{item.name}
                    </p>
                    {(item.protein || item.side1 || item.side2 || item.extra || item.description) && (
                      <p style={{ color: "#71717a", fontSize: 13, margin: "2px 0 0" }}>
                        {[item.protein, item.side1, item.side2, item.extra, item.description].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Special requests */}
              {ticket.special_requests && (
                <div style={{ background: "rgba(233,196,106,0.1)", border: "1px solid rgba(233,196,106,0.3)", borderRadius: 8, padding: "8px 12px" }}>
                  <p style={{ color: "#e9c46a", fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 3px" }}>Special Request</p>
                  <p style={{ color: "#d4d4d8", fontSize: 13, margin: 0 }}>{ticket.special_requests}</p>
                </div>
              )}

              {/* Mark done */}
              <button
                onClick={() => markDone(ticket)}
                disabled={completing === ticket.id}
                style={{
                  background: completing === ticket.id ? "#27272a" : "#22c55e",
                  color: completing === ticket.id ? "#71717a" : "#000",
                  fontWeight: 900,
                  fontSize: 15,
                  padding: "12px 0",
                  borderRadius: 50,
                  border: "none",
                  cursor: completing === ticket.id ? "not-allowed" : "pointer",
                  marginTop: 4,
                  transition: "background 0.2s",
                }}
              >
                {completing === ticket.id ? "Marking done..." : "✓ MARK DONE"}
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>
    </main>
  );
}
