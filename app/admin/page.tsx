"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import InvoiceTab from "@/app/components/InvoiceTab";
import ReportsTab from "@/app/components/ReportsTab";
import OrdersLogTab from "@/app/components/OrdersLogTab";
import GiftsTab from "@/app/components/GiftsTab";
import ReviewsTab from "@/app/components/ReviewsTab";
import SEOTab from "@/app/components/SEOTab";
import GroupLocationsTab from "@/app/components/GroupLocationsTab";
import SchoolTab from "@/app/components/SchoolTab";
import ChallahTab from "@/app/components/ChallahTab";

function RecoverOrderPanel() {
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; order?: { id: string; order_number: string; customer_name: string; order_type: string; total: number; status: string }; error?: string } | null>(null);

  const handleRecover = async () => {
    if (!sessionId.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/recover-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId.trim() }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Network error — try again" });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-black text-white mb-1">Recover Lost Order</h2>
      <p className="text-zinc-500 text-sm mb-6">
        If an order was deleted from the database but payment exists in Stripe, paste either the <code className="text-teal-400">cs_live_</code> Checkout Session ID
        or the <code className="text-teal-400">pi_</code> Payment Intent ID — both work.
        Find either in Stripe → Payments → click the payment.
      </p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div>
          <label className="text-xs text-zinc-400 uppercase tracking-widest block mb-2">Stripe Session ID or Payment Intent ID</label>
          <input
            type="text"
            placeholder="cs_live_... or pi_..."
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 font-mono text-sm"
          />
        </div>

        <button
          onClick={handleRecover}
          disabled={loading || !sessionId.trim()}
          className="w-full py-3 rounded-xl font-black bg-teal-500 text-black hover:bg-teal-400 disabled:opacity-40 transition-colors"
        >
          {loading ? "Recovering…" : "Recover Order from Stripe"}
        </button>

        {result && (
          <div className={`rounded-xl p-4 text-sm font-bold ${result.success ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
            {result.success && result.order ? (
              <div className="space-y-1">
                <p>✅ Order restored successfully!</p>
                <p className="text-white font-black">{result.order.customer_name} — {result.order.order_type} — ${result.order.total.toFixed(2)}</p>
                <p className="text-zinc-400 text-xs font-normal">Order #: {result.order.order_number} · Status: {result.order.status}</p>
              </div>
            ) : (
              <p>❌ {result.error}</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4 text-sm text-yellow-300">
        <p className="font-black mb-1">How to find the Session ID in Stripe:</p>
        <ol className="list-decimal list-inside space-y-1 text-yellow-200 font-normal">
          <li>Go to <strong>dashboard.stripe.com → Payments</strong></li>
          <li>Search by customer name or amount</li>
          <li>Click the payment</li>
          <li>Look for <strong>&ldquo;Checkout Session&rdquo;</strong> — copy the ID starting with <code className="text-teal-400">cs_live_</code></li>
          <li>Paste it above and click Recover</li>
        </ol>
      </div>
    </div>
  );
}

function BannerTab() {
  const [weekDate, setWeekDate] = useState("");
  const [orderUrl, setOrderUrl] = useState("hungry-rooster.vercel.app");
  const [monDate, setMonDate] = useState("");
  const [monMenu, setMonMenu] = useState("");
  const [tueDate, setTueDate] = useState("");
  const [tueMenu, setTueMenu] = useState("");
  const [thuDate, setThuDate] = useState("");
  const [thuMenu, setThuMenu] = useState("");
  const [shabDate, setShabDate] = useState("");
  const [shabMenu, setShabMenu] = useState("");

  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const scalePreview = () => {
    if (!wrapRef.current || !innerRef.current) return;
    const scale = Math.min(1, wrapRef.current.offsetWidth / 820);
    innerRef.current.style.transform = `scale(${scale})`;
    innerRef.current.style.transformOrigin = "top left";
    wrapRef.current.style.height = `${Math.round(312 * scale)}px`;
  };

  useEffect(() => {
    scalePreview();
    window.addEventListener("resize", scalePreview);
    return () => window.removeEventListener("resize", scalePreview);
  }, []);

  const inputCls = "w-full text-sm text-white placeholder-zinc-600 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 outline-none focus:border-teal-500";
  const textareaCls = `${inputCls} resize-y`;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-black mb-1">FB Banner Builder</h2>
        <p className="text-zinc-500 text-sm">Fill in this week&apos;s menus — the banner updates live. Screenshot the preview to post on Facebook.</p>
      </div>

      {/* Details */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Banner Details</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Week of</label>
            <input className={inputCls} type="text" placeholder="May 19 – 23, 2026" value={weekDate} onChange={e => setWeekDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Order link</label>
            <input className={inputCls} type="text" value={orderUrl} onChange={e => setOrderUrl(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Menus */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">This Week&apos;s Menus</p>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Monday", accent: "#2dd4bf", date: monDate, setDate: setMonDate, menu: monMenu, setMenu: setMonMenu, placeholder: "Mon, May 20" },
            { label: "Tuesday", accent: "#2dd4bf", date: tueDate, setDate: setTueDate, menu: tueMenu, setMenu: setTueMenu, placeholder: "Tue, May 21" },
            { label: "Thursday", accent: "#2dd4bf", date: thuDate, setDate: setThuDate, menu: thuMenu, setMenu: setThuMenu, placeholder: "Thu, May 22" },
            { label: "✦ Shabbat", accent: "#e9c46a", date: shabDate, setDate: setShabDate, menu: shabMenu, setMenu: setShabMenu, placeholder: "Fri, May 23" },
          ].map((col) => (
            <div key={col.label}>
              <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, color: col.accent, borderBottom: `2px solid ${col.accent}`, paddingBottom: 5, marginBottom: 10 }}>{col.label}</p>
              <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Date</label>
              <input className={inputCls} placeholder={col.placeholder} value={col.date} onChange={e => col.setDate(e.target.value)} style={{ marginBottom: 8 }} />
              <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Menu</label>
              <textarea className={textareaCls} rows={4} placeholder={"Protein\nSide 1\nSide 2\nSide 3"} value={col.menu} onChange={e => col.setMenu(e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Preview — 820 × 312 px Facebook Cover</p>
        <p className="text-xs text-zinc-600">Win + Shift + S to snip the banner</p>
      </div>

      <div ref={wrapRef} style={{ width: "100%", overflow: "hidden", marginBottom: 20 }}>
        <div ref={innerRef}>
          <div style={{ width: 820, height: 312, background: "#0a0a0a", position: "relative", overflow: "hidden", borderRadius: 6, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 50, background: "#111", borderBottom: "1px solid #1c1c1c", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px" }}>
              <img src="/THR%20hor%20logo%20final.png" alt="THR" style={{ height: 24 }} />
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2 }}>Menu of the Week</span>
              <span style={{ color: "#2dd4bf", fontSize: 11, fontWeight: 700 }}>{weekDate || "Week of ..."}</span>
            </div>
            <div style={{ position: "absolute", top: 50, bottom: 36, left: 0, right: 150, display: "flex" }}>
              {[
                { day: "Monday", accent: "#2dd4bf", date: monDate, menu: monMenu },
                { day: "Tuesday", accent: "#2dd4bf", date: tueDate, menu: tueMenu },
                { day: "Thursday", accent: "#2dd4bf", date: thuDate, menu: thuMenu },
                { day: "Shabbat", accent: "#e9c46a", date: shabDate, menu: shabMenu },
              ].map((col, i) => (
                <div key={i} style={{ flex: 1, borderRight: i < 3 ? "1px solid #1c1c1c" : "none", padding: "11px 11px 8px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2.5, color: col.accent, marginBottom: 2 }}>{col.day}</div>
                  <div style={{ color: "#52525b", fontSize: 9, marginBottom: 6 }}>{col.date}</div>
                  <div style={{ height: 2, borderRadius: 1, background: col.accent, marginBottom: 8, flexShrink: 0 }} />
                  <div style={{ color: "#d4d4d8", fontSize: 11, lineHeight: 1.65, whiteSpace: "pre-wrap", overflow: "hidden" }}>{col.menu}</div>
                </div>
              ))}
            </div>
            <div style={{ position: "absolute", right: 0, top: 50, bottom: 36, width: 150, display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden" }}>
              <img src="/white%20fred%20png.png" alt="Fred" style={{ height: "85%", objectFit: "contain", objectPosition: "bottom center", mixBlendMode: "screen" }} />
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 36, background: "#2dd4bf", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <span style={{ color: "#000", fontWeight: 900, fontSize: 13, letterSpacing: 0.5 }}>Order Now →</span>
              <span style={{ color: "rgba(0,0,0,0.3)", fontSize: 11 }}>|</span>
              <span style={{ color: "#000", fontSize: 13, fontWeight: 700, opacity: 0.65 }}>{orderUrl}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border-l-4 border-teal-500 rounded-r-xl px-5 py-4 text-xs text-zinc-400 leading-7">
        <strong className="text-zinc-200">To save as image:</strong> Open Chrome DevTools (F12) → Elements tab → find the banner div → right-click → <strong className="text-zinc-200">Capture node screenshot</strong>. Saves a perfect 820×312 PNG ready for Facebook.<br />
        Or press <strong className="text-zinc-200">Win + Shift + S</strong> and snip just the banner area above.
      </div>
    </div>
  );
}

const ADMIN_PASSWORD = "fredapproves";

const dinnerDays = [
  { label: "Monday", value: "Monday" },
  { label: "Tuesday", value: "Tuesday" },
  { label: "Thursday", value: "Thursday" },
];

type DinnerEntry = {
  day: string;
  date: string;
  protein: string;
  side1: string;
  side2: string;
  extra: string;
  quantity: number;
  price: number;
  quantity_remaining?: number; // preserved from DB when editing an existing record
  existingRecord?: boolean;
};

type ShabbatEntry = {
  week_of: string;
  protein: string;
  side1: string;
  side2: string;
  extra: string;
  dessert: string;
  quantity: number;
};

type BakeryItem = {
  name: string;
  price: string;
  description: string;
  quantity: string;
};

const EMPTY_BAKERY_ITEMS = (): BakeryItem[] => Array.from({ length: 10 }, () => ({ name: "", price: "", description: "", quantity: "" }));

type Order = {
  id: string;
  order_type: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  items: { name: string; quantity?: number; qty?: number; protein?: string; side1?: string; side2?: string; extra?: string; size?: string; serving?: string; price?: number; includes?: string[]; choices?: string[] }[];
  total: number;
  special_requests: string;
  status: string;
  created_at: string;
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"menus" | "dinner-orders" | "shabbat-orders" | "bakery-orders" | "catering-orders" | "group-orders" | "blast" | "sms" | "invoices" | "banner" | "reports" | "orders-log" | "gifts" | "reviews" | "seo" | "recover" | "school" | "challah">("menus");
  const [dinnerOrders, setDinnerOrders] = useState<Order[]>([]);
  const [shabbatOrders, setShabbatOrders] = useState<Order[]>([]);
  const [bakeryOrders, setBakeryOrders] = useState<Order[]>([]);
  const [cateringOrders, setCateringOrders] = useState<Order[]>([]);
  const [groupOrders, setGroupOrders] = useState<{id: string; location_slug: string; person_name: string; items: {name: string; qty?: number; price?: number; description?: string}[]; total: number; special_requests: string; delivery_date: string | null; status: string; created_at: string}[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Email blast state
  const [blastTemplate, setBlastTemplate] = useState<"dinner" | "shabbat" | "announcement" | null>(null);
  const [blastSubject, setBlastSubject] = useState("");
  const [blastPreview, setBlastPreview] = useState("");
  const [blastSending, setBlastSending] = useState(false);
  const [blastResult, setBlastResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [blastError, setBlastError] = useState("");

  // SMS blast state
  const [smsMessage, setSmsMessage] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [smsError, setSmsError] = useState("");
  const [smsSubCount, setSmsSubCount] = useState<number | null>(null);

  // Dinner Drop template fields
  const [dd, setDd] = useState({ intro: "", mon: "", tue: "", thu: "", note: "", ctaUrl: "https://hungry-rooster.vercel.app/dinner" });
  // Shabbat template fields
  const [sh, setSh] = useState({ protein: "", side1: "", side2: "", dessert: "", cutoff: "", price: "$65–$225", ctaUrl: "https://hungry-rooster.vercel.app/shabbat" });
  // Announcement template fields
  const [an, setAn] = useState({ headline: "", subheadline: "", body: "", ctaText: "", ctaUrl: "", closing: "" });

  useEffect(() => {
    supabase.from("sms_subscribers").select("id", { count: "exact", head: true }).eq("active", true).then(({ count }) => {
      if (count !== null) setSmsSubCount(count);
    });
  }, []);

  const buildBlastHtml = (): string => {
    const base = (content: string) => `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#ffffff;border-radius:12px;overflow:hidden;">
        <div style="background:#111111;padding:24px 32px;border-bottom:1px solid #27272a;">
          <img src="https://hungry-rooster.vercel.app/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" style="height:44px;" />
        </div>
        <div style="padding:32px;">
          ${content}
        </div>
        <div style="background:#111111;padding:20px 32px;border-top:1px solid #27272a;text-align:center;">
          <p style="color:#52525b;font-size:12px;margin:0 0 4px;">The Hungry Rooster · 1499 Regal Row, Suite 206, Dallas TX</p>
          <p style="color:#52525b;font-size:12px;margin:0;">Mon–Fri 9am–2pm CST · <a href="https://hungry-rooster.vercel.app" style="color:#2dd4bf;text-decoration:none;">hungry-rooster.vercel.app</a></p>
        </div>
      </div>`;

    const ctaBtn = (text: string, url: string, color = "#2dd4bf", textColor = "#000000") =>
      `<div style="text-align:center;margin:28px 0 0;">
        <a href="${url}" style="display:inline-block;background:${color};color:${textColor};font-weight:900;font-size:16px;padding:14px 36px;border-radius:50px;text-decoration:none;">${text}</a>
      </div>`;

    const menuRow = (day: string, menu: string, color: string) =>
      `<div style="background:#18181b;border-left:3px solid ${color};border-radius:8px;padding:14px 18px;margin-bottom:10px;">
        <p style="color:${color};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">${day}</p>
        <p style="color:#ffffff;font-size:14px;margin:0;">${menu}</p>
      </div>`;

    if (blastTemplate === "dinner") {
      const days = [
        dd.mon ? menuRow("Monday", dd.mon, "#2dd4bf") : "",
        dd.tue ? menuRow("Tuesday", dd.tue, "#2dd4bf") : "",
        dd.thu ? menuRow("Thursday", dd.thu, "#e9c46a") : "",
      ].filter(Boolean).join("");
      return base(`
        ${dd.intro ? `<p style="font-size:16px;line-height:1.7;color:#d4d4d8;margin:0 0 24px;">${dd.intro.replace(/\n/g, "<br/>")}</p>` : ""}
        <h2 style="color:#2dd4bf;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">This Week's Menu</h2>
        ${days}
        ${dd.note ? `<p style="font-size:14px;color:#a1a1aa;line-height:1.7;margin:20px 0 0;">${dd.note.replace(/\n/g, "<br/>")}</p>` : ""}
        ${ctaBtn("Order Now — Spots Go Fast", dd.ctaUrl)}
      `);
    }

    if (blastTemplate === "shabbat") {
      return base(`
        <h1 style="color:#e9c46a;font-size:28px;font-weight:900;margin:0 0 8px;">Shabbat Shalom! 🕯️</h1>
        <p style="color:#a1a1aa;font-size:15px;margin:0 0 24px;">This week's Shabbat Box is live. Here's what Fred's cooking.</p>
        <div style="background:#18181b;border-radius:10px;padding:20px;margin-bottom:20px;">
          <h2 style="color:#e9c46a;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px;">This Week's Box</h2>
          ${sh.protein ? `<div style="border-bottom:1px solid #27272a;padding:8px 0;"><p style="color:#a1a1aa;font-size:11px;margin:0 0 2px;text-transform:uppercase;letter-spacing:1px;">Protein</p><p style="color:#fff;font-weight:700;margin:0;">${sh.protein}</p></div>` : ""}
          ${sh.side1 ? `<div style="border-bottom:1px solid #27272a;padding:8px 0;"><p style="color:#a1a1aa;font-size:11px;margin:0 0 2px;text-transform:uppercase;letter-spacing:1px;">Side 1</p><p style="color:#fff;font-weight:700;margin:0;">${sh.side1}</p></div>` : ""}
          ${sh.side2 ? `<div style="border-bottom:1px solid #27272a;padding:8px 0;"><p style="color:#a1a1aa;font-size:11px;margin:0 0 2px;text-transform:uppercase;letter-spacing:1px;">Side 2</p><p style="color:#fff;font-weight:700;margin:0;">${sh.side2}</p></div>` : ""}
          ${sh.dessert ? `<div style="padding:8px 0;"><p style="color:#a1a1aa;font-size:11px;margin:0 0 2px;text-transform:uppercase;letter-spacing:1px;">Friday Night Dessert</p><p style="color:#e9c46a;font-weight:700;margin:0;">${sh.dessert} <span style="font-size:12px;color:#a1a1aa;font-weight:400;">(add-on)</span></p></div>` : ""}
        </div>
        ${sh.price ? `<p style="color:#a1a1aa;font-size:13px;margin:0 0 4px;">💰 ${sh.price} delivered</p>` : ""}
        ${sh.cutoff ? `<p style="color:#a1a1aa;font-size:13px;margin:0 0 20px;">⏰ Order by ${sh.cutoff}</p>` : ""}
        ${ctaBtn("Order Your Shabbat Box", sh.ctaUrl, "#e9c46a", "#000000")}
      `);
    }

    if (blastTemplate === "announcement") {
      return base(`
        ${an.headline ? `<h1 style="color:#ffffff;font-size:28px;font-weight:900;line-height:1.2;margin:0 0 8px;">${an.headline}</h1>` : ""}
        ${an.subheadline ? `<p style="color:#2dd4bf;font-size:15px;font-weight:700;margin:0 0 24px;">${an.subheadline}</p>` : ""}
        ${an.body ? `<div style="color:#d4d4d8;font-size:15px;line-height:1.75;margin:0 0 24px;">${an.body.replace(/\n\n/g, '</p><p style="color:#d4d4d8;font-size:15px;line-height:1.75;margin:0 0 16px;">').replace(/\n/g, "<br/>")}</div>` : ""}
        ${an.ctaText && an.ctaUrl ? ctaBtn(an.ctaText, an.ctaUrl) : ""}
        ${an.closing ? `<p style="color:#71717a;font-size:14px;margin:28px 0 0;border-top:1px solid #27272a;padding-top:20px;">${an.closing.replace(/\n/g, "<br/>")}</p>` : ""}
      `);
    }
    return "";
  };

  const [dinners, setDinners] = useState<DinnerEntry[]>(
    dinnerDays.map((d) => ({
      day: d.value,
      date: "",
      protein: "",
      side1: "",
      side2: "",
      extra: "",
      quantity: 20,
      price: 85,
    }))
  );

  const [shabbat, setShabbat] = useState<ShabbatEntry>({
    week_of: "",
    protein: "",
    side1: "",
    side2: "",
    extra: "",
    dessert: "",
    quantity: 50,
  });

  const [bakeryItems, setBakeryItems] = useState<BakeryItem[]>(EMPTY_BAKERY_ITEMS());
  const [bakeryWeekOf, setBakeryWeekOf] = useState("");

  const updateBakeryItem = (index: number, field: keyof BakeryItem, value: string) => {
    setBakeryItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
    } else {
      setPasswordError(true);
    }
  };

  const fetchDinnerOrders = async () => {
    setOrdersLoading(true);
    const { data } = await supabase.from("orders").select("*").eq("order_type", "dinner").neq("status", "archived").order("created_at", { ascending: false }).limit(100);
    if (data) setDinnerOrders(data);
    setOrdersLoading(false);
  };

  const fetchShabbatOrders = async () => {
    setOrdersLoading(true);
    const { data } = await supabase.from("orders").select("*").eq("order_type", "shabbat").neq("status", "archived").order("created_at", { ascending: false }).limit(100);
    if (data) setShabbatOrders(data);
    setOrdersLoading(false);
  };

  const fetchBakeryOrders = async () => {
    setOrdersLoading(true);
    const { data } = await supabase.from("orders").select("*").eq("order_type", "bakery").neq("status", "archived").order("created_at", { ascending: false }).limit(100);
    if (data) setBakeryOrders(data);
    setOrdersLoading(false);
  };

  const fetchCateringOrders = async () => {
    setOrdersLoading(true);
    const { data } = await supabase.from("orders").select("*").in("order_type", ["catering", "catering_inquiry"]).neq("status", "archived").order("created_at", { ascending: false }).limit(100);
    if (data) setCateringOrders(data);
    setOrdersLoading(false);
  };

  const fetchGroupOrders = async () => {
    setOrdersLoading(true);
    const { data } = await supabase.from("group_orders").select("*").order("created_at", { ascending: false }).limit(100);
    if (data) setGroupOrders(data);
    setOrdersLoading(false);
  };

  const clearCompleted = async (type: "dinner" | "shabbat" | "bakery" | "catering") => {
    setClearing(true);
    // Soft-delete: archive completed orders so they stay in DB for reports
    if (type === "dinner") {
      await supabase.from("orders").update({ status: "archived" }).eq("order_type", "dinner").eq("status", "complete");
      await fetchDinnerOrders();
    } else if (type === "shabbat") {
      await supabase.from("orders").update({ status: "archived" }).eq("order_type", "shabbat").eq("status", "complete");
      await fetchShabbatOrders();
    } else if (type === "bakery") {
      await supabase.from("orders").update({ status: "archived" }).eq("order_type", "bakery").eq("status", "complete");
      await fetchBakeryOrders();
    } else {
      await supabase.from("orders").update({ status: "archived" }).in("order_type", ["catering", "catering_inquiry"]).eq("status", "complete");
      await fetchCateringOrders();
    }
    setClearing(false);
  };

  const markOrderComplete = async (id: string, type: "dinner" | "shabbat" | "bakery" | "catering") => {
    await supabase.from("orders").update({ status: "complete" }).eq("id", id);
    if (type === "dinner") setDinnerOrders(prev => prev.map(o => o.id === id ? { ...o, status: "complete" } : o));
    else if (type === "shabbat") setShabbatOrders(prev => prev.map(o => o.id === id ? { ...o, status: "complete" } : o));
    else if (type === "bakery") setBakeryOrders(prev => prev.map(o => o.id === id ? { ...o, status: "complete" } : o));
    else setCateringOrders(prev => prev.map(o => o.id === id ? { ...o, status: "complete" } : o));
  };

  useEffect(() => {
    if (!authed) return;
    if (tab === "dinner-orders") fetchDinnerOrders();
    if (tab === "shabbat-orders") fetchShabbatOrders();
    if (tab === "bakery-orders") fetchBakeryOrders();
    if (tab === "catering-orders") fetchCateringOrders();
    if (tab === "group-orders") fetchGroupOrders();
  }, [authed, tab]);

  const updateDinner = (index: number, field: keyof DinnerEntry, value: string | number) => {
    setDinners((prev) => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  };

  const loadCurrentWeek = async () => {
    const today = new Date();
    const from = today.toISOString().split("T")[0];
    const toDate = new Date(today);
    toDate.setDate(toDate.getDate() + 14);
    const to = toDate.toISOString().split("T")[0];
    const { data } = await supabase
      .from("dinner_menus")
      .select("*")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: true });
    if (!data || data.length === 0) { alert("No upcoming dinners found in the database."); return; }
    setDinners(prev => prev.map(d => {
      const match = data.find((row: { day_of_week: string; date: string; protein: string; side1: string; side2: string; extra: string; quantity_available: number; quantity_remaining: number; price: number }) => row.day_of_week === d.day);
      if (!match) return d;
      return {
        ...d,
        date: match.date,
        protein: match.protein || "",
        side1: match.side1 || "",
        side2: match.side2 || "",
        extra: match.extra || "",
        quantity: match.quantity_available,
        quantity_remaining: match.quantity_remaining,
        price: match.price ?? 85,
        existingRecord: true,
      };
    }));
  };

  const getMondayOfWeek = (dateStr: string): string => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00");
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split("T")[0];
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    for (const dinner of dinners) {
      if (!dinner.date || !dinner.protein) continue;
      // Reveal: 8PM CDT night before = 1AM UTC on dinner date
      // Cutoff: 12PM CDT day of = 5PM UTC on dinner date
      const revealDate = new Date(dinner.date + "T01:00:00Z");
      const cutoffDate = new Date(dinner.date + "T17:00:00Z");

      const { error: dinnerError } = await supabase.from("dinner_menus").upsert({
        date: dinner.date,
        day_of_week: dinner.day,
        protein: dinner.protein,
        side1: dinner.side1,
        side2: dinner.side2,
        extra: dinner.extra,
        quantity_available: dinner.quantity,
        // Preserve quantity_remaining when editing an existing record so orders already placed aren't lost
        quantity_remaining: dinner.existingRecord && dinner.quantity_remaining !== undefined
          ? dinner.quantity_remaining
          : dinner.quantity,
        is_active: false,
        price: dinner.price,
        reveal_time: revealDate.toISOString(),
        cutoff_time: cutoffDate.toISOString(),
      }, { onConflict: "date" });

      if (dinnerError) {
        alert("Error saving " + dinner.day + ": " + dinnerError.message);
        setSaving(false);
        return;
      }
    }

    if (shabbat.week_of && shabbat.protein) {
      const monday = getMondayOfWeek(shabbat.week_of);
      // Reveal: Monday 9PM CDT = Tuesday 2AM UTC
      const revealDate = new Date(monday + "T02:00:00Z");
      // Cutoff: Friday 9AM CDT = Friday 2PM UTC
      const friday = new Date(monday + "T14:00:00Z");
      friday.setUTCDate(friday.getUTCDate() + 4);

      await supabase.from("shabbat_menus").upsert({
        week_of: monday,
        protein: shabbat.protein,
        side1: shabbat.side1,
        side2: shabbat.side2,
        extra: shabbat.extra,
        dessert: shabbat.dessert || null,
        quantity_available: shabbat.quantity,
        quantity_remaining: shabbat.quantity,
        is_active: true,
        reveal_time: revealDate.toISOString(),
        cutoff_time: friday.toISOString(),
      }, { onConflict: "week_of" });
    }

    // Save bakery menu — uses its own week_of date
    const validBakeryItems = bakeryItems.filter(i => i.name.trim() && i.price.trim());
    if (bakeryWeekOf && validBakeryItems.length > 0) {
      const monday = getMondayOfWeek(bakeryWeekOf);
      const revealDate = new Date(monday + "T02:00:00Z");
      const friday = new Date(monday + "T14:00:00Z");
      friday.setUTCDate(friday.getUTCDate() + 4);

      const itemsJson = validBakeryItems.map(i => ({
        name: i.name.trim(),
        price: parseFloat(i.price) || 0,
        description: i.description.trim(),
        quantity: parseInt(i.quantity) || null,
      }));

      // Overall quantity = sum of all item quantities (or 999 if none set)
      const totalQty = itemsJson.every(i => i.quantity) ? itemsJson.reduce((s, i) => s + (i.quantity || 0), 0) : 999;

      await supabase.from("bakery_menus").upsert({
        week_of: monday,
        items: itemsJson,
        quantity_available: totalQty,
        quantity_remaining: totalQty,
        is_active: true,
        reveal_time: revealDate.toISOString(),
        cutoff_time: friday.toISOString(),
      }, { onConflict: "week_of" });
    }

    setSaving(false);
    setSaved(true);
  };

  const renderOrderTab = () => {
    const isDinner = tab === "dinner-orders";
    const isShabbat = tab === "shabbat-orders";
    const isBakery = tab === "bakery-orders";
    const orderList = isDinner ? dinnerOrders : isShabbat ? shabbatOrders : isBakery ? bakeryOrders : cateringOrders;
    const refreshFn = isDinner ? fetchDinnerOrders : isShabbat ? fetchShabbatOrders : isBakery ? fetchBakeryOrders : fetchCateringOrders;
    const clearType: "dinner" | "shabbat" | "bakery" | "catering" = isDinner ? "dinner" : isShabbat ? "shabbat" : isBakery ? "bakery" : "catering";
    const accentColor = isDinner ? "teal" : isShabbat ? "yellow" : isBakery ? "yellow" : "purple";
    const label = isDinner ? "🍽️ Dinner Drop Orders" : isShabbat ? "🕯️ Shabbat Orders" : isBakery ? "🥐 Fred's Fixins' Orders" : "🍽️ Catering Orders";
    const completedCount = orderList.filter(o => o.status === "complete").length;

    return (
      <div>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-xl font-black">{label}</h2>
          <div className="flex gap-2">
            {completedCount > 0 && (
              <button
                onClick={() => clearCompleted(clearType)}
                disabled={clearing}
                className="text-red-400 hover:text-red-300 font-bold text-sm transition-colors border border-red-400/30 px-4 py-2 rounded-full"
              >
                {clearing ? "Clearing..." : `Clear ${completedCount} completed`}
              </button>
            )}
            <button onClick={refreshFn} className={`text-${accentColor}-400 font-bold text-sm hover:text-${accentColor}-300 transition-colors`}>↻ Refresh</button>
          </div>
        </div>

        {ordersLoading ? (
          <p className="text-zinc-400">Loading...</p>
        ) : orderList.length === 0 ? (
          <div className="bg-zinc-900 rounded-2xl p-10 border border-zinc-800 text-center">
            <p className="text-zinc-400">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orderList.map((order) => (
              <div key={order.id} className={`bg-zinc-900 rounded-2xl p-6 border transition-colors ${order.status === "complete" ? "border-zinc-800 opacity-50" : "border-zinc-700"}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${isDinner ? "bg-teal-400/20 text-teal-400" : isShabbat ? "bg-yellow-400/20 text-yellow-400" : isBakery ? "bg-yellow-400/20 text-yellow-400" : "bg-purple-400/20 text-purple-400"}`}>
                      {isDinner ? "Dinner Drop" : isShabbat ? "🕯️ Shabbat" : isBakery ? "🥐 Fred's Fixins'" : "Catering"}
                    </span>
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${order.status === "complete" ? "bg-green-400/20 text-green-400" : "bg-orange-400/20 text-orange-400"}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-black text-xl">${order.total}</p>
                    <p className="text-zinc-500 text-xs">{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-white font-bold">{order.customer_name}</p>
                    <p className="text-teal-400 text-sm">📞 {order.customer_phone}</p>
                    {order.customer_email && <p className="text-zinc-400 text-xs">✉️ {order.customer_email}</p>}
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">📍 {order.customer_address}</p>
                  </div>
                </div>
                {order.items && order.items.length > 0 && (
                  <div className="border-t border-zinc-700 pt-3 mb-3 space-y-2">
                    {order.items.map((item, idx) => {
                      const qty = item.qty || item.quantity || 1;
                      if (tab === "catering-orders") {
                        // Package or a-la-carte catering item
                        return (
                          <div key={idx} className="text-sm">
                            <p>
                              {qty > 1 && <span className="text-purple-400 font-black mr-1">{qty}×</span>}
                              <span className="text-white font-bold">{item.name}</span>
                              {item.size && <span className="text-zinc-400"> · {item.size}</span>}
                              {item.serving && <span className="text-zinc-500"> ({item.serving})</span>}
                              {item.price != null && <span className="text-zinc-400"> · ${item.price}</span>}
                            </p>
                            {item.includes && item.includes.length > 0 && (
                              <p className="text-zinc-500 text-xs ml-3 mt-0.5">{item.includes.join(" · ")}</p>
                            )}
                            {item.choices && item.choices.length > 0 && (
                              <p className="text-yellow-400 text-xs ml-3">{item.choices.join(" · ")}</p>
                            )}
                          </div>
                        );
                      }
                      return (
                        <p key={idx} className="text-sm">
                          {qty > 1 && (
                            <span className="text-yellow-400 font-black mr-1">{qty}×</span>
                          )}
                          <span className="text-white font-bold">{item.name}</span>
                          {item.protein && <span className="text-zinc-400"> · {item.protein}</span>}
                          {item.side1 && <span className="text-zinc-400">, {item.side1}</span>}
                          {item.side2 && <span className="text-zinc-400">, {item.side2}</span>}
                          {item.extra && <span className="text-zinc-400">, {item.extra}</span>}
                        </p>
                      );
                    })}
                  </div>
                )}
                {order.special_requests && (() => {
                  const sr = order.special_requests;
                  // Parse event date and drop-off time out of special_requests
                  const eventMatch    = sr.match(/Event:\s*([\d-]+)/);
                  const dropoffMatch  = sr.match(/Drop-off time:\s*([\d:]+)/);
                  const remaining     = sr
                    .replace(/Event:\s*[\d-]+\s*·?\s*/i, "")
                    .replace(/Drop-off time:\s*[\d:]+\s*·?\s*/i, "")
                    .trim().replace(/^·\s*/, "").replace(/\s*·$/, "").trim();

                  const eventDate = eventMatch
                    ? new Date(eventMatch[1] + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
                    : null;
                  const dropoffTime = dropoffMatch
                    ? new Date("1970-01-01T" + dropoffMatch[1]).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                    : null;

                  return (
                    <div className="space-y-2 mb-3">
                      {(eventDate || dropoffTime) && (
                        <div className="flex flex-wrap gap-2">
                          {eventDate && (
                            <span className="bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-full">
                              📅 Event: {eventDate}
                            </span>
                          )}
                          {dropoffTime && (
                            <span className="bg-teal-400/15 border border-teal-400/30 text-teal-300 text-xs font-bold px-3 py-1.5 rounded-full">
                              🕐 Drop-off: {dropoffTime}
                            </span>
                          )}
                        </div>
                      )}
                      {remaining && (
                        <div className="bg-zinc-800 rounded-xl px-4 py-2 text-sm">
                          <span className="text-yellow-400 font-bold">Note: </span>
                          <span className="text-zinc-300">{remaining}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
                {order.status !== "complete" && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Mark ${order.customer_name}'s order as complete?`)) {
                        markOrderComplete(order.id, clearType);
                      }
                    }}
                    className="text-green-400 hover:text-green-300 font-bold text-sm border border-green-400/30 px-4 py-2 rounded-full transition-colors"
                  >
                    ✓ Mark Complete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!authed) {
    return (
      <main className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="bg-zinc-900 rounded-2xl p-10 border border-zinc-800 w-full max-w-sm text-center">
          <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-10 w-auto mx-auto mb-6" />
          <h1 className="text-xl font-black mb-6">Admin Access</h1>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 mb-3"
          />
          {passwordError && <p className="text-red-400 text-sm mb-3">Incorrect password</p>}
          <button onClick={handleLogin} className="w-full bg-teal-500 hover:bg-teal-400 text-black font-black py-3 rounded-full transition-colors">
            Sign In
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-black text-white min-h-screen px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-1">Admin Panel</p>
            <h1 className="text-3xl font-black">The Hungry Rooster</h1>
          </div>
          <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-10 w-auto" />
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-10 flex-wrap">
          <button onClick={() => setTab("menus")} className={`px-5 py-3 rounded-full font-black text-sm transition-colors ${tab === "menus" ? "bg-teal-500 text-black" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}>
            Weekly Menus
          </button>
          <button onClick={() => setTab("dinner-orders")} className={`px-5 py-3 rounded-full font-black text-sm transition-colors ${tab === "dinner-orders" ? "bg-teal-500 text-black" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}>
            🍽️ Dinner Drop
          </button>
          <button onClick={() => setTab("shabbat-orders")} className={`px-5 py-3 rounded-full font-black text-sm transition-colors ${tab === "shabbat-orders" ? "bg-yellow-400 text-black" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}>
            🕯️ Shabbat
          </button>
          <button onClick={() => setTab("bakery-orders")} className={`px-5 py-3 rounded-full font-black text-sm transition-colors ${tab === "bakery-orders" ? "bg-yellow-400 text-black" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}>
            🥐 Fred's Fixins'
          </button>
          <button onClick={() => setTab("catering-orders")} className={`px-5 py-3 rounded-full font-black text-sm transition-colors ${tab === "catering-orders" ? "bg-purple-500 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}>
            🍽️ Catering
          </button>
          <button onClick={() => setTab("group-orders")} className={`px-5 py-3 rounded-full font-black text-sm transition-colors ${tab === "group-orders" ? "bg-orange-500 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}>
            🏢 Group Orders
          </button>
          <button onClick={() => setTab("invoices")} className={`px-5 py-3 rounded-full font-black text-sm transition-colors ${tab === "invoices" ? "bg-purple-500 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}>
            🧾 Invoices
          </button>
          <button onClick={() => { setTab("blast"); setBlastResult(null); setBlastError(""); }} className={`px-5 py-3 rounded-full font-black text-sm transition-colors ${tab === "blast" ? "bg-yellow-400 text-black" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}>
            📣 Email Blast
          </button>
          <button onClick={() => { setTab("sms"); setSmsResult(null); setSmsError(""); }} className={`px-5 py-3 rounded-full font-black text-sm transition-colors ${tab === "sms" ? "bg-green-500 text-black" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}>
            📱 SMS Blast
          </button>
          <button onClick={() => setTab("banner")} className={`px-5 py-3 rounded-full font-black text-sm transition-colors ${tab === "banner" ? "bg-blue-500 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}>
            🖼️ FB Banner
          </button>
          <button onClick={() => setTab("reports")} className={`px-5 py-3 rounded-full font-black text-sm transition-colors ${tab === "reports" ? "bg-green-500 text-black" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}>
            📊 Reports
          </button>
          <button onClick={() => setTab("gifts")} className={`px-5 py-3 rounded-full font-black text-sm transition-colors ${tab === "gifts" ? "bg-yellow-400 text-black" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}>
            🎁 Gifts
          </button>
          <button onClick={() => setTab("recover")} className={`px-5 py-3 rounded-full font-black text-sm transition-colors ${tab === "recover" ? "bg-red-500 text-white" : "bg-zinc-900 text-red-400 hover:text-white border border-red-800"}`}>
            🛟 Recover Order
          </button>
          <button onClick={() => setTab("orders-log")} className={`px-5 py-3 rounded-full font-black text-sm transition-colors ${tab === "orders-log" ? "bg-white text-black" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}>
            📋 Orders Log
          </button>
          <button onClick={() => setTab("reviews")} className={`px-5 py-3 rounded-full font-black text-sm transition-colors ${tab === "reviews" ? "bg-yellow-400 text-black" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}>
            ⭐ Reviews
          </button>
          <button onClick={() => setTab("school")} className={`px-5 py-3 rounded-full font-black text-sm transition-colors ${tab === "school" ? "bg-yellow-400 text-black" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}>
            🐓 THE COOP
          </button>
          <button onClick={() => setTab("challah")} className={`px-5 py-3 rounded-full font-black text-sm transition-colors ${tab === "challah" ? "bg-yellow-400 text-black" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}>
            🍞 Challah
          </button>
          <button onClick={() => setTab("seo")} className={`px-5 py-3 rounded-full font-black text-sm transition-colors ${tab === "seo" ? "bg-green-500 text-black" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}>
            📈 SEO
          </button>
        </div>

        {/* MENUS TAB */}
        {tab === "menus" && (
          <>
            <div className="mb-12">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-black">Dinner Drop</h2>
                <button
                  onClick={loadCurrentWeek}
                  className="text-sm font-black text-teal-400 hover:text-teal-300 border border-teal-400/40 hover:border-teal-400 px-4 py-2 rounded-full transition-colors"
                >
                  📥 Load This Week
                </button>
              </div>
              <p className="text-zinc-500 text-sm mb-6">Mon, Tue, Thu — $85 delivered. Reveals at 9PM the night before. Orders close at 12PM day of.</p>
              <div className="space-y-6">
                {dinners.map((dinner, i) => (
                  <div key={dinner.day} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                    <h3 className="font-black text-lg mb-4 text-yellow-400">{dinner.day}</h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Date</label>
                        <input type="date" value={dinner.date} onChange={(e) => updateDinner(i, "date", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Quantity</label>
                        <input type="number" value={dinner.quantity} onChange={(e) => updateDinner(i, "quantity", parseInt(e.target.value))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Price <span className="text-yellow-400 normal-case">(default $85)</span></label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                          <input type="number" value={dinner.price} onChange={(e) => updateDinner(i, "price", parseFloat(e.target.value))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-7 pr-3 py-2 text-white focus:outline-none focus:border-yellow-400 text-sm" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Protein</label>
                        <input type="text" placeholder="e.g. Brisket" value={dinner.protein} onChange={(e) => updateDinner(i, "protein", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Side 1</label>
                        <input type="text" placeholder="e.g. Roasted potatoes" value={dinner.side1} onChange={(e) => updateDinner(i, "side1", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Side 2</label>
                        <input type="text" placeholder="e.g. Roasted veggies" value={dinner.side2} onChange={(e) => updateDinner(i, "side2", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Side 3</label>
                        <input type="text" placeholder="e.g. House salad" value={dinner.extra} onChange={(e) => updateDinner(i, "extra", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-10">
              <h2 className="text-xl font-black mb-1">Shabbat Box</h2>
              <p className="text-zinc-500 text-sm mb-6">$65–$225 delivered. Reveals Monday at 9PM. Orders close Friday at 9AM. Enter any date this week — Monday is auto-calculated.</p>
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Any date this week</label>
                    <input type="date" value={shabbat.week_of} onChange={(e) => setShabbat({ ...shabbat, week_of: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-sm" />
                    {shabbat.week_of && (
                      <p className="text-teal-400 text-xs mt-1">↳ Monday: {getMondayOfWeek(shabbat.week_of)}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Quantity</label>
                    <input type="number" value={shabbat.quantity} onChange={(e) => setShabbat({ ...shabbat, quantity: parseInt(e.target.value) })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Protein</label>
                    <input type="text" placeholder="e.g. Roasted chicken" value={shabbat.protein} onChange={(e) => setShabbat({ ...shabbat, protein: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Side 1</label>
                    <input type="text" placeholder="e.g. Kugel" value={shabbat.side1} onChange={(e) => setShabbat({ ...shabbat, side1: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Side 2</label>
                    <input type="text" placeholder="e.g. Roasted carrots" value={shabbat.side2} onChange={(e) => setShabbat({ ...shabbat, side2: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Side 3</label>
                    <input type="text" placeholder="e.g. Challah" value={shabbat.extra} onChange={(e) => setShabbat({ ...shabbat, extra: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Friday Night Dessert <span className="text-yellow-400 normal-case">(the $25 add-on — what is it this week?)</span></label>
                  <input type="text" placeholder="e.g. Chocolate lava cake" value={shabbat.dessert} onChange={(e) => setShabbat({ ...shabbat, dessert: e.target.value })} className="w-full bg-zinc-800 border border-yellow-400/40 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
                </div>
              </div>
            </div>

            <div className="mb-10">
              <h2 className="text-xl font-black mb-1">🥐 Fred&apos;s Fixins&apos;</h2>
              <p className="text-zinc-500 text-sm mb-6">Fred's Fixins' weekly menu — drops Sunday at 10AM alongside Shabbat. Same Friday 9AM cutoff. Minimum order $50. Uses the same &ldquo;week of&rdquo; date as the Shabbat Box above.</p>
              <div className="bg-zinc-900 rounded-2xl p-6 border border-yellow-400/20">
                <div className="mb-5">
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Any date this week <span className="text-yellow-400 normal-case">(Monday is auto-calculated — same logic as Shabbat)</span></label>
                  <input type="date" value={bakeryWeekOf} onChange={(e) => setBakeryWeekOf(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-yellow-400 text-sm" />
                  {bakeryWeekOf && (
                    <p className="text-teal-400 text-xs mt-1">↳ Monday: {getMondayOfWeek(bakeryWeekOf)} · Reveals Sunday 10AM · Cutoff Friday 9AM</p>
                  )}
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">This Week&apos;s Items</p>
                <p className="text-zinc-600 text-xs mb-4">Leave blank rows empty. Qty = how many available of that item (optional — leave blank for unlimited).</p>
                <div className="space-y-3">
                  {bakeryItems.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 text-zinc-600 text-xs font-bold text-center">{i + 1}</div>
                      <div className="col-span-3">
                        <input type="text" placeholder="Item name" value={item.name} onChange={(e) => updateBakeryItem(i, "name", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                          <input type="text" placeholder="0.00" value={item.price} onChange={(e) => updateBakeryItem(i, "price", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-6 pr-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
                        </div>
                      </div>
                      <div className="col-span-1">
                        <input type="number" min="0" placeholder="Qty" value={item.quantity} onChange={(e) => updateBakeryItem(i, "quantity", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm text-center" />
                      </div>
                      <div className="col-span-5">
                        <input type="text" placeholder="Short description (optional)" value={item.description} onChange={(e) => updateBakeryItem(i, "description", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-zinc-600 text-xs mt-4">Min $50 order. Customers pick individual items — each item is priced separately.</p>
              </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-full text-lg transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save This Week's Menus"}
            </button>
            {saved && <p className="text-teal-400 text-center font-bold mt-4">Menus saved! Fred is ready for the week.</p>}
          </>
        )}

        {/* EMAIL BLAST TAB */}
        {tab === "blast" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-black mb-1">Email Blast</h2>
              <p className="text-zinc-500 text-sm">Send to your full subscriber list. No HTML needed — pick a template, fill in the fields, send.</p>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="bg-yellow-400/20 border border-yellow-400/30 rounded-xl px-4 py-2">
                <p className="text-yellow-400 font-black text-sm">1,638 subscribers</p>
              </div>
              <p className="text-zinc-500 text-xs">owner.com + site signups</p>
            </div>

            {/* Template Picker */}
            {!blastTemplate && (
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide mb-3">Choose a template</p>
                <div className="grid gap-3">
                  {[
                    { id: "dinner", emoji: "🍽️", label: "Dinner Drop", desc: "Announce this week's Mon/Tue/Thu menus with a link to order.", accent: "teal" },
                    { id: "shabbat", emoji: "🕯️", label: "Shabbat Box", desc: "Share this week's Shabbat menu and drive orders before Friday cutoff.", accent: "yellow" },
                    { id: "announcement", emoji: "📣", label: "General Announcement", desc: "New menu item, special event, catering push — anything goes.", accent: "zinc" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setBlastTemplate(t.id as "dinner" | "shabbat" | "announcement")}
                      className="flex items-center gap-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-teal-500 rounded-2xl p-5 text-left transition-all"
                    >
                      <span className="text-3xl">{t.emoji}</span>
                      <div>
                        <p className="font-black text-white">{t.label}</p>
                        <p className="text-zinc-500 text-sm">{t.desc}</p>
                      </div>
                      <span className="ml-auto text-zinc-600 text-xl">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Template Forms */}
            {blastTemplate && (
              <div>
                <button onClick={() => { setBlastTemplate(null); setBlastResult(null); setBlastError(""); }} className="text-zinc-500 hover:text-white text-sm font-bold mb-5 flex items-center gap-1 transition-colors">
                  ← Change template
                </button>

                {/* Shared: Subject + Preview */}
                <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-4 space-y-4">
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Subject Line</label>
                    <input type="text" value={blastSubject} onChange={(e) => setBlastSubject(e.target.value)}
                      placeholder={blastTemplate === "dinner" ? "This week's Dinner Drop is live 🍽️" : blastTemplate === "shabbat" ? "Shabbat Shalom — this week's box is ready 🕯️" : "Big news from The Hungry Rooster 🐓"}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Preview Text <span className="text-zinc-600 normal-case">(shows under subject in inbox)</span></label>
                    <input type="text" value={blastPreview} onChange={(e) => setBlastPreview(e.target.value)}
                      placeholder="Fred's been in the kitchen since 5am..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm" />
                  </div>
                </div>

                {/* Dinner Drop Fields */}
                {blastTemplate === "dinner" && (
                  <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-4 space-y-4">
                    <p className="text-teal-400 font-black text-xs uppercase tracking-widest">🍽️ Dinner Drop</p>
                    <div>
                      <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Opening Line</label>
                      <textarea rows={2} value={dd.intro} onChange={(e) => setDd({...dd, intro: e.target.value})}
                        placeholder="Hey! Fred's been in the kitchen and this week's lineup is no joke..."
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm resize-none" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Monday Menu</label>
                      <input type="text" value={dd.mon} onChange={(e) => setDd({...dd, mon: e.target.value})}
                        placeholder="Brisket · Roasted potatoes · House salad"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Tuesday Menu</label>
                      <input type="text" value={dd.tue} onChange={(e) => setDd({...dd, tue: e.target.value})}
                        placeholder="Salmon · Rice pilaf · Roasted veggies"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Thursday Menu</label>
                      <input type="text" value={dd.thu} onChange={(e) => setDd({...dd, thu: e.target.value})}
                        placeholder="Short rib · Mashed potatoes · Glazed carrots"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Closing Note <span className="text-zinc-600 normal-case">(optional)</span></label>
                      <textarea rows={2} value={dd.note} onChange={(e) => setDd({...dd, note: e.target.value})}
                        placeholder="Order before noon — spots sell out fast. See you at the coop. — Fred"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm resize-none" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Order Link</label>
                      <input type="text" value={dd.ctaUrl} onChange={(e) => setDd({...dd, ctaUrl: e.target.value})}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 text-sm" />
                    </div>
                  </div>
                )}

                {/* Shabbat Fields */}
                {blastTemplate === "shabbat" && (
                  <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-4 space-y-4">
                    <p className="text-yellow-400 font-black text-xs uppercase tracking-widest">🕯️ Shabbat Box</p>
                    {[
                      { key: "protein", label: "Protein", placeholder: "Roasted chicken" },
                      { key: "side1", label: "Side 1", placeholder: "Kugel" },
                      { key: "side2", label: "Side 2", placeholder: "Roasted carrots" },
                      { key: "dessert", label: "Friday Night Dessert (add-on)", placeholder: "Chocolate lava cake" },
                      { key: "cutoff", label: "Order Cutoff", placeholder: "Friday 9am" },
                      { key: "price", label: "Price Range", placeholder: "$65–$225" },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">{label}</label>
                        <input type="text" value={sh[key as keyof typeof sh]} onChange={(e) => setSh({...sh, [key]: e.target.value})}
                          placeholder={placeholder}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Order Link</label>
                      <input type="text" value={sh.ctaUrl} onChange={(e) => setSh({...sh, ctaUrl: e.target.value})}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400 text-sm" />
                    </div>
                  </div>
                )}

                {/* Announcement Fields */}
                {blastTemplate === "announcement" && (
                  <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-4 space-y-4">
                    <p className="text-zinc-300 font-black text-xs uppercase tracking-widest">📣 Announcement</p>
                    <div>
                      <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Headline</label>
                      <input type="text" value={an.headline} onChange={(e) => setAn({...an, headline: e.target.value})}
                        placeholder="We're launching something new."
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Subheadline <span className="text-zinc-600 normal-case">(optional)</span></label>
                      <input type="text" value={an.subheadline} onChange={(e) => setAn({...an, subheadline: e.target.value})}
                        placeholder="And we think you're going to love it."
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Body</label>
                      <textarea rows={6} value={an.body} onChange={(e) => setAn({...an, body: e.target.value})}
                        placeholder={"Write your message here. Use double line breaks for new paragraphs.\n\nFred has been working on this for months and it's finally ready."}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm resize-y" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Button Text <span className="text-zinc-600 normal-case">(optional)</span></label>
                        <input type="text" value={an.ctaText} onChange={(e) => setAn({...an, ctaText: e.target.value})}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Button URL</label>
                        <input type="text" value={an.ctaUrl} onChange={(e) => setAn({...an, ctaUrl: e.target.value})}
                          placeholder="https://..."
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Sign-off <span className="text-zinc-600 normal-case">(optional)</span></label>
                      <textarea rows={2} value={an.closing} onChange={(e) => setAn({...an, closing: e.target.value})}
                        placeholder={"With love from the coop,\n— Scarlet & Fred"}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm resize-none" />
                    </div>
                  </div>
                )}

                {/* Live Preview */}
                {buildBlastHtml() && (
                  <div className="mb-6">
                    <p className="text-xs text-zinc-400 uppercase tracking-wide mb-3">Live Preview</p>
                    <div className="rounded-2xl overflow-hidden border border-zinc-700">
                      <div className="bg-zinc-800 px-4 py-2 flex items-center gap-2">
                        <span className="text-zinc-400 text-xs font-bold">Subject:</span>
                        <span className="text-white text-xs">{blastSubject || "(no subject yet)"}</span>
                      </div>
                      <div dangerouslySetInnerHTML={{ __html: buildBlastHtml() }} />
                    </div>
                  </div>
                )}

                {blastError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
                    <p className="text-red-400 text-sm font-bold">{blastError}</p>
                  </div>
                )}

                {blastResult && (
                  <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl px-4 py-4 mb-4">
                    <p className="text-teal-400 font-black text-lg mb-1">Blast sent! 🐓</p>
                    <p className="text-zinc-300 text-sm">{blastResult.sent} emails sent successfully{blastResult.failed > 0 ? `, ${blastResult.failed} failed` : ""}.</p>
                  </div>
                )}

                <button
                  onClick={async () => {
                    const html = buildBlastHtml();
                    if (!blastSubject.trim() || !html) { setBlastError("Fill in the subject and at least one content field."); return; }
                    const confirmed = window.confirm(`Send to all 1,638 subscribers?\n\nSubject: ${blastSubject}\n\nThis cannot be undone.`);
                    if (!confirmed) return;
                    setBlastSending(true);
                    setBlastError("");
                    setBlastResult(null);
                    try {
                      const res = await fetch("/api/blast", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ subject: blastSubject, previewText: blastPreview, htmlBody: html, password: "fredapproves" }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setBlastResult(data);
                        setBlastSubject(""); setBlastPreview("");
                        setDd({ intro: "", mon: "", tue: "", thu: "", note: "", ctaUrl: "https://hungry-rooster.vercel.app/dinner" });
                        setSh({ protein: "", side1: "", side2: "", dessert: "", cutoff: "", price: "$65–$225", ctaUrl: "https://hungry-rooster.vercel.app/shabbat" });
                        setAn({ headline: "", subheadline: "", body: "", ctaText: "", ctaUrl: "", closing: "" });
                      } else { setBlastError(data.error || "Something went wrong."); }
                    } catch { setBlastError("Network error — try again."); }
                    finally { setBlastSending(false); }
                  }}
                  disabled={blastSending || !blastSubject.trim() || !buildBlastHtml()}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-full text-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {blastSending ? "Sending... this may take a minute" : "Send to All Subscribers"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* GROUP ORDERS TAB */}
        {tab === "group-orders" && <GroupLocationsTab />}

        {/* INVOICES TAB */}
        {tab === "invoices" && <InvoiceTab />}

        {/* SMS BLAST TAB */}
        {tab === "sms" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-black mb-1">SMS Blast</h2>
              <p className="text-zinc-500 text-sm">Send a text to everyone who opted in. Keep it under 160 characters to avoid splitting into multiple messages.</p>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-400/20 border border-green-400/30 rounded-xl px-4 py-2">
                <p className="text-green-400 font-black text-sm">{smsSubCount !== null ? smsSubCount : "..."} subscribers</p>
              </div>
              <p className="text-zinc-500 text-xs">SMS opt-ins from Owner + new orders</p>
            </div>

            {/* Quick templates */}
            <div className="mb-4">
              <p className="text-xs text-zinc-400 uppercase tracking-wide mb-3">Quick templates</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "🍽️ Dinner Drop", text: "The Hungry Rooster: Tonight's Dinner Drop is live! Order by noon → https://hungry-rooster.vercel.app/dinner" },
                  { label: "🕯️ Shabbat Box", text: "The Hungry Rooster: This week's Shabbat Box is ready. Order by Friday 9am → https://hungry-rooster.vercel.app/shabbat" },
                  { label: "🥐 Bakery", text: "The Hungry Rooster: Esther's Friday Bakery is open! Order now → https://hungry-rooster.vercel.app/esther" },
                ].map((t) => (
                  <button
                    key={t.label}
                    onClick={() => setSmsMessage(t.text)}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-sm font-bold px-4 py-2 rounded-full transition-colors"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Composer */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-zinc-400 uppercase tracking-wide">Message</label>
                <span className={`text-xs font-bold ${smsMessage.length > 160 ? "text-red-400" : smsMessage.length > 140 ? "text-yellow-400" : "text-zinc-500"}`}>
                  {smsMessage.length} / 160
                </span>
              </div>
              <textarea
                rows={4}
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder={"The Hungry Rooster: Your message here. Keep it short and include a link.\n\nTip: Always start with 'The Hungry Rooster:' so people know who it's from."}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-green-400 text-sm resize-none"
              />
              {smsMessage.length > 160 && (
                <p className="text-red-400 text-xs mt-2">⚠ Over 160 characters — this will send as {Math.ceil(smsMessage.length / 153)} messages per recipient and cost more.</p>
              )}
            </div>

            {/* Preview */}
            {smsMessage.trim() && (
              <div className="mb-6">
                <p className="text-xs text-zinc-400 uppercase tracking-wide mb-3">Preview</p>
                <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 max-w-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-black font-black text-xs">THR</div>
                    <div>
                      <p className="text-white text-xs font-bold">The Hungry Rooster</p>
                      <p className="text-zinc-500 text-xs">SMS</p>
                    </div>
                  </div>
                  <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-white text-sm whitespace-pre-wrap">{smsMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {smsError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
                <p className="text-red-400 text-sm font-bold">{smsError}</p>
              </div>
            )}

            {smsResult && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-4 mb-4">
                <p className="text-green-400 font-black text-lg mb-1">Texts sent! 🐓</p>
                <p className="text-zinc-300 text-sm">{smsResult.sent} messages sent successfully{smsResult.failed > 0 ? `, ${smsResult.failed} failed` : ""}.</p>
              </div>
            )}

            <button
              onClick={async () => {
                if (!smsMessage.trim()) { setSmsError("Write a message first."); return; }
                const confirmed = window.confirm(`Send to all ${smsSubCount} SMS subscribers?

"${smsMessage}"

This cannot be undone.`);
                if (!confirmed) return;
                setSmsSending(true);
                setSmsError("");
                setSmsResult(null);
                try {
                  const res = await fetch("/api/sms-blast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: smsMessage, password: "fredapproves" }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    setSmsResult(data);
                    setSmsMessage("");
                  } else { setSmsError(data.error || "Something went wrong."); }
                } catch { setSmsError("Network error — try again."); }
                finally { setSmsSending(false); }
              }}
              disabled={smsSending || !smsMessage.trim()}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-black py-4 rounded-full text-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {smsSending ? "Sending..." : `Send to ${smsSubCount ?? "..."} subscribers`}
            </button>
          </div>
        )}

        {/* BANNER TAB */}
        {tab === "banner" && <BannerTab />}

        {tab === "reports" && <ReportsTab />}

        {/* GIFTS TAB */}
        {tab === "gifts" && <GiftsTab />}

        {/* ORDERS LOG TAB */}
        {tab === "orders-log" && <OrdersLogTab />}

        {/* REVIEWS TAB */}
        {tab === "reviews" && <ReviewsTab />}

        {/* SEO TAB */}
        {tab === "seo" && <SEOTab />}

        {/* SCHOOL COFFEE SHOP TAB */}
        {tab === "school" && <SchoolTab />}
        {tab === "challah" && <ChallahTab />}

        {/* RECOVER ORDER TAB */}
        {tab === "recover" && <RecoverOrderPanel />}

        {/* ORDER TABS */}
        {(tab === "dinner-orders" || tab === "shabbat-orders" || tab === "bakery-orders" || tab === "catering-orders") && renderOrderTab()}
      </div>
    </main>
  );
}
