"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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

type Order = {
  id: string;
  order_type: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  items: { name: string; protein?: string; side1?: string; side2?: string; extra?: string }[];
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
  const [tab, setTab] = useState<"menus" | "orders" | "blast">("menus");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Email blast state
  const [blastSubject, setBlastSubject] = useState("");
  const [blastPreview, setBlastPreview] = useState("");
  const [blastBody, setBlastBody] = useState("");
  const [blastSending, setBlastSending] = useState(false);
  const [blastResult, setBlastResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [blastError, setBlastError] = useState("");

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

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
    } else {
      setPasswordError(true);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setOrders(data);
    setOrdersLoading(false);
  };

  useEffect(() => {
    if (authed && tab === "orders") fetchOrders();
  }, [authed, tab]);

  const updateDinner = (index: number, field: keyof DinnerEntry, value: string | number) => {
    setDinners((prev) => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
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
        quantity_remaining: dinner.quantity,
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

      const extraFull = [shabbat.extra, shabbat.dessert].filter(Boolean).join(" · ");

      await supabase.from("shabbat_menus").upsert({
        week_of: monday,
        protein: shabbat.protein,
        side1: shabbat.side1,
        side2: shabbat.side2,
        extra: extraFull,
        quantity_available: shabbat.quantity,
        quantity_remaining: shabbat.quantity,
        is_active: true,
        reveal_time: revealDate.toISOString(),
        cutoff_time: friday.toISOString(),
      }, { onConflict: "week_of" });
    }

    setSaving(false);
    setSaved(true);
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
          <button
            onClick={() => setTab("menus")}
            className={`px-6 py-3 rounded-full font-black text-sm transition-colors ${tab === "menus" ? "bg-teal-500 text-black" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}
          >
            Weekly Menus
          </button>
          <button
            onClick={() => setTab("orders")}
            className={`px-6 py-3 rounded-full font-black text-sm transition-colors ${tab === "orders" ? "bg-teal-500 text-black" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}
          >
            Incoming Orders
          </button>
          <button
            onClick={() => { setTab("blast"); setBlastResult(null); setBlastError(""); }}
            className={`px-6 py-3 rounded-full font-black text-sm transition-colors ${tab === "blast" ? "bg-yellow-400 text-black" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"}`}
          >
            📣 Email Blast
          </button>
        </div>

        {/* MENUS TAB */}
        {tab === "menus" && (
          <>
            <div className="mb-12">
              <h2 className="text-xl font-black mb-1">Dinner Drop</h2>
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
              <p className="text-zinc-500 text-sm">Send to your full subscriber list. Double-check everything before sending — there&apos;s no undo.</p>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-yellow-400/20 border border-yellow-400/30 rounded-xl px-4 py-2">
                  <p className="text-yellow-400 font-black text-sm">1,638 subscribers</p>
                </div>
                <p className="text-zinc-500 text-xs">owner.com + site signups</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Subject Line</label>
                  <input
                    type="text"
                    value={blastSubject}
                    onChange={(e) => setBlastSubject(e.target.value)}
                    placeholder="e.g. This week's Dinner Drop is 🔥"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Preview Text <span className="text-zinc-600 normal-case">(shows under subject in inbox)</span></label>
                  <input
                    type="text"
                    value={blastPreview}
                    onChange={(e) => setBlastPreview(e.target.value)}
                    placeholder="e.g. Fred's been in the kitchen since 5am..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Body <span className="text-zinc-600 normal-case">(HTML supported — or just type naturally)</span></label>
                  <textarea
                    value={blastBody}
                    onChange={(e) => setBlastBody(e.target.value)}
                    rows={10}
                    placeholder={`Hey! Just wanted to let you know...\n\nThis week's dinner drop is live. Here's what Fred's cooking:\n\n• Monday: Brisket, roasted potatoes, house salad\n• Tuesday: Salmon, rice pilaf, roasted veggies\n\nOrder before noon — spots go fast.\n\nhungry-rooster.vercel.app/dinner\n\n— Fred & the crew`}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 text-sm font-mono leading-relaxed resize-y"
                  />
                  <p className="text-zinc-600 text-xs mt-1">Tip: Use &lt;b&gt;bold&lt;/b&gt;, &lt;br/&gt; for line breaks, or &lt;a href=&quot;...&quot;&gt;links&lt;/a&gt; for formatting.</p>
                </div>
              </div>
            </div>

            {/* Preview */}
            {blastBody && (
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
                <p className="text-xs text-zinc-400 uppercase tracking-wide mb-4">Preview</p>
                <div className="bg-[#0a0a0a] rounded-xl p-6 border border-zinc-700">
                  <p className="text-teal-400 font-black text-xs uppercase tracking-widest mb-1">Subject: {blastSubject || "(no subject)"}</p>
                  {blastPreview && <p className="text-zinc-500 text-xs mb-4 italic">{blastPreview}</p>}
                  <div className="text-white text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: blastBody }} />
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
                if (!blastSubject.trim() || !blastBody.trim()) {
                  setBlastError("Subject and body are required.");
                  return;
                }
                const confirmed = window.confirm(`Send to all 1,638 subscribers?\n\nSubject: ${blastSubject}\n\nThis cannot be undone.`);
                if (!confirmed) return;
                setBlastSending(true);
                setBlastError("");
                setBlastResult(null);
                try {
                  const res = await fetch("/api/blast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ subject: blastSubject, previewText: blastPreview, htmlBody: blastBody.replace(/\n/g, "<br/>"), password: "fredapproves" }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    setBlastResult(data);
                    setBlastSubject("");
                    setBlastPreview("");
                    setBlastBody("");
                  } else {
                    setBlastError(data.error || "Something went wrong.");
                  }
                } catch {
                  setBlastError("Network error — try again.");
                } finally {
                  setBlastSending(false);
                }
              }}
              disabled={blastSending || !blastSubject.trim() || !blastBody.trim()}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-full text-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {blastSending ? "Sending... this may take a minute" : "Send to All Subscribers"}
            </button>
          </div>
        )}

        {/* ORDERS TAB */}
        {tab === "orders" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black">Incoming Orders</h2>
              <button onClick={fetchOrders} className="text-teal-400 font-bold text-sm hover:text-teal-300 transition-colors">↻ Refresh</button>
            </div>
            {ordersLoading ? (
              <p className="text-zinc-400">Loading orders...</p>
            ) : orders.length === 0 ? (
              <div className="bg-zinc-900 rounded-2xl p-10 border border-zinc-800 text-center">
                <p className="text-zinc-400">No orders yet. Fred is waiting.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${order.order_type === "shabbat" ? "bg-yellow-400/20 text-yellow-400" : "bg-teal-400/20 text-teal-400"}`}>
                          {order.order_type === "shabbat" ? "🕍 Shabbat" : "🍽️ Dinner Drop"}
                        </span>
                        <span className="text-xs font-bold uppercase px-2 py-1 rounded-full bg-orange-400/20 text-orange-400">
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
                      <div className="border-t border-zinc-700 pt-3 mb-3 space-y-1">
                        {order.items.map((item, idx) => (
                          <p key={idx} className="text-sm">
                            <span className="text-white font-bold">{item.name}</span>
                            {item.protein && <span className="text-zinc-400"> · {item.protein}</span>}
                            {item.side1 && <span className="text-zinc-400">, {item.side1}</span>}
                            {item.side2 && <span className="text-zinc-400">, {item.side2}</span>}
                            {item.extra && <span className="text-zinc-400">, {item.extra}</span>}
                          </p>
                        ))}
                      </div>
                    )}
                    {order.special_requests && (
                      <div className="bg-zinc-800 rounded-xl px-4 py-2 text-sm">
                        <span className="text-yellow-400 font-bold">Note: </span>
                        <span className="text-zinc-300">{order.special_requests}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
