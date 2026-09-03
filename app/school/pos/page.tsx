"use client";
import { useState, useEffect, useRef, useCallback } from "react";

type MenuItem = { id: string; name: string; price: number; category: string; emoji: string };
type CartItem = MenuItem & { qty: number };
type PaymentMode = null | "account" | "card" | "cash";
type Step = "pos" | "account_pin" | "account_confirm" | "card_processing" | "cash_entry" | "success" | "error";
type FBPurchase = { id: string; teacher_name: string; teacher_email: string; school_name: string; amount_paid: number; coupons_total: number; coupons_redeemed: number; ref_code: string; created_at: string };

declare global {
  interface Window {
    StripeTerminal: {
      create: (options: {
        onFetchConnectionToken: () => Promise<string>;
        onUnexpectedReaderDisconnect: () => void;
      }) => StripeTerminalInstance;
    };
  }
}
interface StripeTerminalInstance {
  discoverReaders: (opts: object) => Promise<{ discoveredReaders: StripeReader[] }>;
  connectReader: (reader: StripeReader) => Promise<{ error?: { message: string } }>;
  collectPaymentMethod: (clientSecret: string) => Promise<{ paymentIntent?: { id: string }; error?: { message: string } }>;
  processPayment: (pi: object) => Promise<{ paymentIntent?: { id: string; status: string }; error?: { message: string } }>;
  getConnectionStatus: () => string;
}
interface StripeReader { id: string; label: string; device_type: string; status: string }

export default function SchoolPOS() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<Step>("pos");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(null);
  const [pin, setPin] = useState("");
  const [accountInfo, setAccountInfo] = useState<{ id: string; student_name: string; balance: number } | null>(null);
  const [pinError, setPinError] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [terminalStatus, setTerminalStatus] = useState<"not_connected" | "connecting" | "connected">("not_connected");
  const [readers, setReaders] = useState<StripeReader[]>([]);
  const [connectedReader, setConnectedReader] = useState<StripeReader | null>(null);
  const [showReaderModal, setShowReaderModal] = useState(false);
  const terminalRef = useRef<StripeTerminalInstance | null>(null);

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  // Friday check for Shabbat items
  const isFriday = new Date().getDay() === 5;

  const allCategories = Array.from(new Set(menu.map(m => m.category)));
  const categories = allCategories.filter(c => c !== "Shabbat" || isFriday);

  // ── Fred Bucks ─────────────────────────────────────────────────────────
  const [posTab, setPosTab] = useState<"order" | "fredbucks" | "celebrations">("order");
  const [fbPurchases, setFbPurchases] = useState<FBPurchase[]>([]);
  const [fbLoading, setFbLoading] = useState(false);
  const [fbRedeemId, setFbRedeemId] = useState<string | null>(null);
  const [fbRedeemQty, setFbRedeemQty] = useState(1);
  const [fbMsg, setFbMsg] = useState("");

  const fetchFB = useCallback(async () => {
    setFbLoading(true);
    const res = await fetch("/api/coop/fredbucks/list");
    const data = await res.json();
    setFbPurchases(data.purchases || []);
    setFbLoading(false);
  }, []);

  useEffect(() => {
    if (posTab === "fredbucks") fetchFB();
  }, [posTab, fetchFB]);

  const doRedeem = async () => {
    if (!fbRedeemId || fbRedeemQty < 1) return;
    const res = await fetch("/api/coop/fredbucks/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchase_id: fbRedeemId, quantity: fbRedeemQty }),
    });
    const data = await res.json();
    if (data.success) {
      setFbMsg(`✓ Redeemed ${fbRedeemQty} buck${fbRedeemQty > 1 ? "s" : ""} ($${data.value}) — ${data.remaining} remaining`);
      setFbRedeemId(null);
      setFbRedeemQty(1);
      fetchFB();
      setTimeout(() => setFbMsg(""), 4000);
    } else {
      setFbMsg("❌ " + (data.error || "Failed"));
    }
  };

  useEffect(() => {
    fetch("/api/school/menu").then(r => r.json()).then(d => {
      const items: MenuItem[] = d.items || [];
      setMenu(items);
      if (items.length > 0) {
        const firstCat = items.find(i => i.category !== "Shabbat" || isFriday)?.category || items[0].category;
        setActiveCategory(firstCat);
      }
    });
  }, []);

  // ── Stripe Terminal Setup ──────────────────────────────────────────────
  const fetchConnectionToken = useCallback(async () => {
    const res = await fetch("/api/school/terminal/connection-token", { method: "POST" });
    const data = await res.json();
    return data.secret;
  }, []);

  const initTerminal = useCallback(() => {
    if (!window.StripeTerminal || terminalRef.current) return;
    terminalRef.current = window.StripeTerminal.create({
      onFetchConnectionToken: fetchConnectionToken,
      onUnexpectedReaderDisconnect: () => {
        setTerminalStatus("not_connected");
        setConnectedReader(null);
      },
    });
  }, [fetchConnectionToken]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/terminal/v1/";
    script.onload = initTerminal;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [initTerminal]);

  const discoverReaders = async () => {
    if (!terminalRef.current) { alert("Terminal SDK not loaded yet"); return; }
    setTerminalStatus("connecting");
    const result = await terminalRef.current.discoverReaders({ simulated: false });
    setReaders(result.discoveredReaders || []);
    setShowReaderModal(true);
    setTerminalStatus("not_connected");
  };

  const connectReader = async (reader: StripeReader) => {
    if (!terminalRef.current) return;
    setTerminalStatus("connecting");
    const result = await terminalRef.current.connectReader(reader);
    if (result.error) {
      alert(`Connection failed: ${result.error.message}`);
      setTerminalStatus("not_connected");
    } else {
      setConnectedReader(reader);
      setTerminalStatus("connected");
      setShowReaderModal(false);
    }
  };

  // ── Cart ──────────────────────────────────────────────────────────────
  const addItem = (item: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      return ex ? prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
                : [...prev, { ...item, qty: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === id);
      if (!ex) return prev;
      return ex.qty > 1 ? prev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c)
                        : prev.filter(c => c.id !== id);
    });
  };

  const clearCart = () => setCart([]);

  // ── Payment Flows ─────────────────────────────────────────────────────
  const openPayment = (mode: PaymentMode) => {
    setPaymentMode(mode);
    setPin("");
    setPinError("");
    setCashReceived("");
    if (mode === "account") setStep("account_pin");
    else if (mode === "card") processCard();
    else if (mode === "cash") setStep("cash_entry");
  };

  const lookupAccount = async () => {
    if (pin.length < 4) return;
    const res = await fetch(`/api/school/lookup?pin=${pin}`);
    const data = await res.json();
    if (!data.found) { setPinError("No account found for that ID."); return; }
    if (data.account.status === "frozen") { setPinError("⛔ Account is frozen — see admin."); return; }
    if (data.account.status === "pending_setup") { setPinError("Account setup incomplete — parent needs to finish registration."); return; }
    setAccountInfo(data.account);
    setStep("account_confirm");
  };

  const confirmAccountPurchase = async () => {
    if (!accountInfo) return;
    const res = await fetch("/api/school/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_type: "account", account_id: accountInfo.id, items: cart.map(i => ({ name: i.name, price: i.price, qty: i.qty })), total }),
    });
    const data = await res.json();
    if (data.success) {
      await recordCelebrationIfPending();
      setSuccessMsg(`✓ $${total.toFixed(2)} added to ${accountInfo.student_name}'s tab. New balance: $${data.new_balance.toFixed(2)}`);
      setStep("success");
      setTimeout(() => resetPOS(), 5000);
    } else {
      setErrorMsg(data.error || "Failed to record purchase");
      setStep("error");
    }
  };

  const processCard = async () => {
    if (!terminalRef.current || terminalStatus !== "connected") {
      setErrorMsg("Card reader not connected. Tap the reader icon to connect.");
      setStep("error");
      return;
    }
    setStep("card_processing");
    try {
      const piRes = await fetch("/api/school/terminal/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_cents: Math.round(total * 100),
          description: cart.map(i => `${i.qty}× ${i.name}`).join(", "),
        }),
      });
      const piData = await piRes.json();
      if (!piData.client_secret) throw new Error("Failed to create payment");

      const collectResult = await terminalRef.current.collectPaymentMethod(piData.client_secret);
      if (collectResult.error) throw new Error(collectResult.error.message);

      const processResult = await terminalRef.current.processPayment(collectResult.paymentIntent!);
      if (processResult.error) throw new Error(processResult.error.message);
      if (processResult.paymentIntent?.status !== "succeeded") throw new Error("Payment did not succeed");

      const recordRes = await fetch("/api/school/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_type: "card",
          items: cart.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
          total,
          stripe_payment_intent_id: processResult.paymentIntent.id,
        }),
      });
      await recordCelebrationIfPending();
      if (!recordRes.ok) {
        const recErr = await recordRes.json().catch(() => ({}));
        console.error("Card sale record failed:", recErr);
        // Payment already captured — still show success but log the error
        setSuccessMsg(`✓ Card payment of $${total.toFixed(2)} successful (log error — contact admin)`);
      } else {
        setSuccessMsg(`✓ Card payment of $${total.toFixed(2)} successful`);
      }
      setStep("success");
      setTimeout(() => resetPOS(), 4000);
    } catch (err) {
      setErrorMsg((err as Error).message || "Card payment failed");
      setStep("error");
    }
  };

  const processCash = async () => {
    const received = parseFloat(cashReceived) || 0;
    const res = await fetch("/api/school/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_type: "cash", items: cart.map(i => ({ name: i.name, price: i.price, qty: i.qty })), total, cash_received: received }),
    });
    const data = await res.json();
    if (data.success) {
      await recordCelebrationIfPending();
      setSuccessMsg(`✓ Cash sale $${total.toFixed(2)}${received >= total ? ` — Change: $${data.change.toFixed(2)}` : ""}`);
      setStep("success");
      setTimeout(() => resetPOS(), 4000);
    } else {
      setErrorMsg("Failed to record sale");
      setStep("error");
    }
  };

  const resetPOS = () => {
    setStep("pos");
    setPaymentMode(null);
    clearCart();
    setPin("");
    setPinError("");
    setAccountInfo(null);
    setSuccessMsg("");
    setErrorMsg("");
    setCashReceived("");
  };

  const numpadDigit = (d: string) => {
    if (step === "account_pin" && pin.length < 6) setPin(p => p + d);
    else if (step === "cash_entry") setCashReceived(p => p + d);
  };
  const numpadDot = () => {
    if (step === "cash_entry" && !cashReceived.includes(".")) setCashReceived(p => p + ".");
  };
  const numpadBack = () => {
    if (step === "account_pin") setPin(p => p.slice(0, -1));
    else if (step === "cash_entry") setCashReceived(p => p.slice(0, -1));
  };

  // ── Celebrations ──────────────────────────────────────────────────────
  const CELEB_TOPPINGS = ["Sprinkles", "Parve Choco Chips", "Reese's Pieces", "Trail Mix", "Cherries"];
  const CELEB_LABEL: Record<string, string> = {
    froyo: "Frozen Yogurt Party",
    cupcakes: "Cupcakes",
    celebration_pack: "Coop Celebration Pack",
  };
  const [celebType, setCelebType] = useState<"froyo" | "cupcakes" | "celebration_pack" | null>(null);
  const [celebForm, setCelebForm] = useState({
    purchaser_name: "", classroom: "", kids_name: "",
    delivery_date: "", delivery_time: "",
    student_count: "", quantity: "1",
    cupcake_flavor: "chocolate", special_requests: "",
  });
  const [celebToppings, setCelebToppings] = useState<string[]>([]);
  const [celebError, setCelebError] = useState("");
  const pendingCelebOrder = useRef<Record<string, unknown> | null>(null);

  const updCeleb = (k: string, v: string) => setCelebForm(p => ({ ...p, [k]: v }));
  const toggleCelebTopping = (t: string) => {
    setCelebToppings(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : prev.length < 2 ? [...prev, t] : prev
    );
  };

  const celebTotal = (() => {
    if (celebType === "froyo") return (parseInt(celebForm.student_count) || 0) * 5;
    if (celebType === "cupcakes") return (parseInt(celebForm.quantity) || 1) * 36;
    if (celebType === "celebration_pack") return (parseInt(celebForm.quantity) || 1) * 100;
    return 0;
  })();

  function minCelebDate() {
    const d = new Date(Date.now() + 48 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0];
  }

  const recordCelebrationIfPending = async () => {
    if (!pendingCelebOrder.current) return;
    const data = pendingCelebOrder.current;
    pendingCelebOrder.current = null;
    try {
      await fetch("/api/coopcelebrate/pos-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error("Celebration order recording failed:", err);
    }
  };

  const submitCelebration = (mode: PaymentMode) => {
    setCelebError("");
    if (!celebType) return;
    if (!celebForm.purchaser_name || !celebForm.classroom || !celebForm.delivery_date || !celebForm.delivery_time) {
      setCelebError("Please fill in all required fields."); return;
    }
    if (celebType === "froyo" && (!celebForm.student_count || parseInt(celebForm.student_count) < 1)) {
      setCelebError("Please enter number of students."); return;
    }
    if (celebType === "celebration_pack" && celebToppings.length < 2) {
      setCelebError("Please select exactly 2 toppings."); return;
    }
    if (celebTotal <= 0) { setCelebError("Invalid order total."); return; }

    // Store celebration data for after payment succeeds
    pendingCelebOrder.current = {
      order_type: celebType,
      ...celebForm,
      toppings: celebToppings,
      payment_method: mode === "cash" ? "cash" : mode === "card" ? "card" : "account",
      total: celebTotal,
      source: "pos",
    };

    // Populate cart with a synthetic item so existing payment flows work
    setCart([{
      id: `celeb_${celebType}`,
      name: CELEB_LABEL[celebType],
      price: celebTotal,
      category: "Celebration",
      emoji: "🎉",
      qty: 1,
    }]);

    openPayment(mode);
  };

  const visibleItems = menu.filter(m => m.category === activeCategory);

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden select-none">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-zinc-950 border-b border-zinc-800 px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <p className="font-black text-xl leading-none tracking-tight">THE COOP</p>
            <p className="text-zinc-500 text-xs leading-none mt-0.5">by The Hungry Rooster</p>
          </div>
          <div className="flex gap-1.5 ml-3">
            <button onClick={() => setPosTab("order")}
              className={`px-4 py-1.5 rounded-full text-sm font-black transition-colors ${posTab === "order" ? "bg-yellow-400 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
              Order
            </button>
            <button onClick={() => setPosTab("fredbucks")}
              className={`px-4 py-1.5 rounded-full text-sm font-black transition-colors ${posTab === "fredbucks" ? "bg-yellow-400 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
              🐓 Fred&apos;s Bucks
            </button>
            <button onClick={() => setPosTab("celebrations")}
              className={`px-4 py-1.5 rounded-full text-sm font-black transition-colors ${posTab === "celebrations" ? "bg-teal-400 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
              🎉 Celebrations
            </button>
          </div>
        </div>

        {/* Reader status */}
        <button
          onClick={() => terminalStatus === "connected" ? null : discoverReaders()}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full border transition-colors ${
            terminalStatus === "connected" ? "border-green-500 text-green-400 bg-green-500/10"
            : terminalStatus === "connecting" ? "border-yellow-500 text-yellow-400 animate-pulse"
            : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${terminalStatus === "connected" ? "bg-green-400" : "bg-zinc-600"}`} />
          {terminalStatus === "connected" ? (connectedReader?.label || "Reader") : terminalStatus === "connecting" ? "Connecting…" : "Connect Reader"}
        </button>
      </div>

      {/* ── Fred's Bucks Panel ─────────────────────────────────────────── */}
      {posTab === "fredbucks" && (
        <div className="flex-1 overflow-y-auto p-5 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-black text-xl">Fred&apos;s Bucks</h2>
            <button onClick={fetchFB} className="text-xs text-zinc-500 hover:text-yellow-400 transition-colors">↺ Refresh</button>
          </div>

          {fbMsg && (
            <div className={`rounded-2xl px-5 py-4 mb-5 text-sm font-bold ${fbMsg.startsWith("✓") ? "bg-green-500/15 text-green-300 border border-green-500/30" : "bg-red-500/15 text-red-300 border border-red-500/30"}`}>
              {fbMsg}
            </div>
          )}

          {/* Redeem modal inline */}
          {fbRedeemId && (() => {
            const p = fbPurchases.find(x => x.id === fbRedeemId);
            const remaining = p ? p.coupons_total - p.coupons_redeemed : 0;
            return (
              <div className="bg-zinc-900 border-2 border-yellow-400/40 rounded-3xl p-5 mb-5">
                <p className="font-black text-lg mb-0.5">Redeeming — {p?.teacher_name}</p>
                <p className="text-zinc-500 text-sm mb-4">{remaining} buck{remaining !== 1 ? "s" : ""} available · ${(remaining * 5).toFixed(2)} total value</p>
                <div className="flex items-center gap-4 mb-4">
                  <button onClick={() => setFbRedeemQty(q => Math.max(1, q - 1))}
                    className="w-12 h-12 bg-zinc-800 hover:bg-zinc-700 rounded-full font-black text-2xl flex items-center justify-center transition-colors">−</button>
                  <div className="text-center">
                    <p className="font-black text-4xl text-yellow-400">{fbRedeemQty}</p>
                    <p className="text-zinc-500 text-xs">${(fbRedeemQty * 5).toFixed(2)} value</p>
                  </div>
                  <button onClick={() => setFbRedeemQty(q => Math.min(remaining, q + 1))}
                    className="w-12 h-12 bg-zinc-800 hover:bg-zinc-700 rounded-full font-black text-2xl flex items-center justify-center transition-colors">+</button>
                </div>
                <div className="flex gap-3">
                  <button onClick={doRedeem}
                    className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-black py-3 rounded-full text-sm transition-colors">
                    Confirm Redeem
                  </button>
                  <button onClick={() => { setFbRedeemId(null); setFbRedeemQty(1); }}
                    className="px-5 py-3 text-zinc-400 hover:text-white text-sm transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            );
          })()}

          {fbLoading ? (
            <p className="text-zinc-600 text-center py-12 animate-pulse">Loading…</p>
          ) : fbPurchases.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🐓</p>
              <p className="text-zinc-500 font-bold">No Fred&apos;s Bucks yet</p>
              <p className="text-zinc-700 text-sm mt-1">Share: /coop/fredbucks</p>
            </div>
          ) : fbPurchases.map(p => {
            const remaining = p.coupons_total - p.coupons_redeemed;
            const pct = (p.coupons_redeemed / p.coupons_total) * 100;
            return (
              <div key={p.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 mb-3">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-black text-base">{p.teacher_name}</p>
                    <p className="text-zinc-600 text-xs font-mono mt-0.5">{p.ref_code}{p.school_name ? ` · ${p.school_name}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-lg ${remaining > 0 ? "text-yellow-400" : "text-zinc-700"}`}>{remaining} left</p>
                    <p className="text-zinc-600 text-xs">{p.coupons_redeemed}/{p.coupons_total} used</p>
                  </div>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2 mb-4">
                  <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <button
                  onClick={() => { setFbRedeemId(p.id); setFbRedeemQty(1); }}
                  disabled={remaining === 0}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-25 text-white font-black py-3 rounded-xl text-sm transition-colors border border-zinc-700">
                  {remaining > 0 ? "Mark Redeemed" : "All Used"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Celebrations Panel ─────────────────────────────────────────── */}
      {posTab === "celebrations" && (
        <div className="flex-1 overflow-y-auto p-5 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-black text-xl">🎉 Celebration Order</h2>
            <p className="text-xs text-zinc-600 font-bold">48-hr notice required</p>
          </div>

          {/* Product picker */}
          <div className="space-y-2 mb-5">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Choose Type</p>
            {(["froyo", "cupcakes", "celebration_pack"] as const).map(t => (
              <button key={t} onClick={() => { setCelebType(t); setCelebError(""); }}
                className={`w-full text-left border-2 rounded-2xl p-4 transition-all ${celebType === t ? "border-teal-400 bg-teal-400/10" : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"}`}>
                <div className="flex justify-between items-center">
                  <p className="font-black">{CELEB_LABEL[t]}</p>
                  <p className="text-teal-400 font-black text-sm">
                    {t === "froyo" ? "$5/student" : t === "cupcakes" ? "$36/dozen" : "$100/pack"}
                  </p>
                </div>
                <p className="text-zinc-500 text-xs mt-0.5">
                  {t === "froyo" ? "Froyo, spoon & sprinkles included" : t === "cupcakes" ? "Chocolate or Vanilla · sold by dozen" : "12 cupcakes + 12 froyo · 2 toppings"}
                </p>
              </button>
            ))}
          </div>

          {celebType && (
            <div className="space-y-4">

              {/* Cupcake flavor */}
              {(celebType === "cupcakes" || celebType === "celebration_pack") && (
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-widest mb-2 block">Flavor *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["chocolate", "vanilla"].map(f => (
                      <button key={f} onClick={() => updCeleb("cupcake_flavor", f)}
                        className={`py-3 rounded-xl font-bold text-sm capitalize border-2 transition-colors ${celebForm.cupcake_flavor === f ? "border-yellow-400 bg-yellow-400/10 text-yellow-400" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Toppings */}
              {celebType === "celebration_pack" && (
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-widest mb-2 block">Yogurt Toppings (pick 2) *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CELEB_TOPPINGS.map(t => (
                      <button key={t} onClick={() => toggleCelebTopping(t)}
                        className={`py-2 px-3 rounded-xl text-sm font-bold border-2 transition-colors ${celebToppings.includes(t) ? "border-teal-400 bg-teal-400/10 text-teal-400" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"} ${!celebToppings.includes(t) && celebToppings.length >= 2 ? "opacity-40 cursor-not-allowed" : ""}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <p className="text-zinc-600 text-xs mt-1">{celebToppings.length}/2 selected</p>
                </div>
              )}

              {/* Quantity / student count */}
              {celebType === "froyo" && (
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Students *</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updCeleb("student_count", String(Math.max(1, parseInt(celebForm.student_count || "0") - 1)))}
                      className="w-10 h-10 rounded-full border border-zinc-700 font-black text-lg hover:border-teal-400 transition-colors flex items-center justify-center">−</button>
                    <span className="text-2xl font-black text-teal-400 w-8 text-center">{celebForm.student_count || 0}</span>
                    <button onClick={() => updCeleb("student_count", String(parseInt(celebForm.student_count || "0") + 1))}
                      className="w-10 h-10 rounded-full border border-zinc-700 font-black text-lg hover:border-teal-400 transition-colors flex items-center justify-center">+</button>
                    <span className="text-zinc-500 text-sm">= <span className="text-teal-400 font-bold">${celebTotal.toFixed(2)}</span></span>
                  </div>
                </div>
              )}
              {(celebType === "cupcakes" || celebType === "celebration_pack") && (
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Quantity ({celebType === "cupcakes" ? "dozens" : "packs"}) *</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updCeleb("quantity", String(Math.max(1, parseInt(celebForm.quantity) - 1)))}
                      className="w-10 h-10 rounded-full border border-zinc-700 font-black text-lg hover:border-yellow-400 transition-colors flex items-center justify-center">−</button>
                    <span className="text-2xl font-black text-yellow-400 w-8 text-center">{celebForm.quantity}</span>
                    <button onClick={() => updCeleb("quantity", String(parseInt(celebForm.quantity) + 1))}
                      className="w-10 h-10 rounded-full border border-zinc-700 font-black text-lg hover:border-yellow-400 transition-colors flex items-center justify-center">+</button>
                    <span className="text-zinc-500 text-sm">= <span className="text-yellow-400 font-bold">${celebTotal.toFixed(2)}</span></span>
                  </div>
                </div>
              )}

              {/* Purchaser name */}
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Purchaser Name *</label>
                <input type="text" placeholder="Parent / teacher name" value={celebForm.purchaser_name} onChange={e => updCeleb("purchaser_name", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
              </div>

              {/* Kids name */}
              {(celebType === "cupcakes" || celebType === "celebration_pack") && (
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Child&apos;s Name</label>
                  <input type="text" placeholder="Birthday kid" value={celebForm.kids_name} onChange={e => updCeleb("kids_name", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
                </div>
              )}

              {/* Classroom */}
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Classroom *</label>
                <input type="text" placeholder="e.g. Mrs. Cohen — 3rd Grade" value={celebForm.classroom} onChange={e => updCeleb("classroom", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm" />
              </div>

              {/* Delivery date */}
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Delivery Date * <span className="normal-case font-normal text-zinc-600">(48 hrs min)</span></label>
                <input type="date" min={minCelebDate()} value={celebForm.delivery_date} onChange={e => updCeleb("delivery_date", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400 text-sm" />
              </div>

              {/* Delivery time */}
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Time Needed *</label>
                <input type="time" value={celebForm.delivery_time} onChange={e => updCeleb("delivery_time", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400 text-sm" />
              </div>

              {/* Special requests */}
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Notes</label>
                <textarea placeholder="Allergies, notes…" value={celebForm.special_requests} onChange={e => updCeleb("special_requests", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 text-sm resize-none h-16" />
              </div>

              {/* Notice */}
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-center">
                <p className="text-zinc-400 text-xs font-bold">⚠️ Once placed, no changes can be made.</p>
              </div>

              {celebError && <p className="text-red-400 text-sm font-bold">{celebError}</p>}

              {/* Payment buttons */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-zinc-400 font-bold">Total</span>
                  <span className="text-2xl font-black text-yellow-400">${celebTotal.toFixed(2)}</span>
                </div>
                <button onClick={() => submitCelebration("account")}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2">
                  <span>📋</span> Account Tab
                </button>
                <button onClick={() => submitCelebration("card")}
                  className={`w-full font-black py-4 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2 ${terminalStatus === "connected" ? "bg-teal-500 hover:bg-teal-400 text-black" : "bg-zinc-800 text-zinc-500 border border-zinc-700"}`}>
                  <span>💳</span> {terminalStatus === "connected" ? "Card" : "Card (no reader)"}
                </button>
                <button onClick={() => submitCelebration("cash")}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2">
                  <span>💵</span> Cash
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Order Mode ─────────────────────────────────────────────────── */}
      {posTab === "order" && (
        <div className="flex flex-1 overflow-hidden">

          {/* Left: Category tabs + Menu grid */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Category tabs */}
            <div className="bg-zinc-950 border-b border-zinc-800 px-4 py-3 flex gap-2 flex-shrink-0 overflow-x-auto">
              {categories.length === 0 ? (
                <p className="text-zinc-700 text-sm px-2">Loading menu…</p>
              ) : categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-sm font-black whitespace-nowrap transition-colors flex-shrink-0 ${
                    activeCategory === cat
                      ? "bg-yellow-400 text-black"
                      : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-600 hover:text-white"
                  }`}
                >
                  {cat === "Shabbat" ? "✡ Shabbat" : cat}
                </button>
              ))}
              {isFriday && (
                <span className="ml-auto flex-shrink-0 text-xs text-yellow-400/60 self-center pr-2">Shabbat menu active</span>
              )}
            </div>

            {/* Menu grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {visibleItems.length === 0 ? (
                <div className="text-center py-20 text-zinc-700">
                  <p className="text-4xl mb-3">🍽️</p>
                  <p className="font-bold">No items in this category</p>
                  <p className="text-sm mt-1">Add them in Admin → School → Menu</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {visibleItems.map(item => {
                    const cartItem = cart.find(c => c.id === item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => addItem(item)}
                        className={`relative p-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                          cartItem
                            ? "border-yellow-400 bg-yellow-400/10"
                            : "border-zinc-800 bg-zinc-950 hover:border-zinc-600 hover:bg-zinc-900"
                        }`}
                      >
                        <p className="text-4xl mb-3 leading-none">{item.emoji}</p>
                        <p className="font-black text-sm leading-tight text-white">{item.name}</p>
                        <p className="text-yellow-400 font-black text-base mt-1">${item.price.toFixed(2)}</p>
                        {cartItem && (
                          <span className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                            {cartItem.qty}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Order panel */}
          <div className="w-80 bg-zinc-950 border-l border-zinc-800 flex flex-col flex-shrink-0">

            {/* Cart header */}
            <div className="px-4 pt-4 pb-2 flex-shrink-0">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-600">Current Order</p>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full pb-8">
                  <p className="text-5xl mb-3 opacity-20">🛒</p>
                  <p className="text-zinc-700 text-sm font-bold">Tap items to add</p>
                </div>
              ) : cart.map(item => (
                <div key={item.id} className="flex items-center gap-2 py-3 border-b border-zinc-800/60">
                  <span className="text-yellow-400 font-black text-sm w-6 text-center">{item.qty}×</span>
                  <span className="flex-1 text-sm font-bold truncate">{item.name}</span>
                  <span className="text-zinc-400 text-sm font-bold">${(item.price * item.qty).toFixed(2)}</span>
                  <button onClick={() => removeItem(item.id)}
                    className="text-zinc-700 hover:text-red-400 text-xl leading-none w-6 flex items-center justify-center transition-colors">×</button>
                </div>
              ))}
            </div>

            {/* Total + Payment */}
            <div className="p-4 border-t border-zinc-800 space-y-3 flex-shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-bold">Total</span>
                <span className="text-3xl font-black">${total.toFixed(2)}</span>
              </div>

              {cart.length > 0 ? (
                <>
                  {/* Account Tab */}
                  <button onClick={() => openPayment("account")}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2">
                    <span>📋</span> Account Tab
                  </button>

                  {/* Card */}
                  <button
                    onClick={() => openPayment("card")}
                    className={`w-full font-black py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2 ${
                      terminalStatus === "connected"
                        ? "bg-teal-500 hover:bg-teal-400 text-black"
                        : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                    }`}
                  >
                    <span>💳</span>
                    {terminalStatus === "connected" ? "Card" : "Card (no reader)"}
                  </button>

                  {/* Cash */}
                  <button onClick={() => openPayment("cash")}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2">
                    <span>💵</span> Cash
                  </button>

                  <button onClick={clearCart}
                    className="w-full text-zinc-700 hover:text-red-400 text-xs py-1.5 transition-colors font-bold">
                    Clear Order
                  </button>
                </>
              ) : (
                <div className="space-y-2 opacity-30 pointer-events-none">
                  <div className="w-full bg-yellow-400 text-black font-black py-4 rounded-2xl text-base flex items-center justify-center gap-2">
                    <span>📋</span> Account Tab
                  </div>
                  <div className="w-full bg-zinc-800 text-zinc-500 border border-zinc-700 font-black py-4 rounded-2xl text-base flex items-center justify-center gap-2">
                    <span>💳</span> Card
                  </div>
                  <div className="w-full bg-green-600 text-white font-black py-4 rounded-2xl text-base flex items-center justify-center gap-2">
                    <span>💵</span> Cash
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Reader Discovery Modal ─────────────────────────────────────── */}
      {showReaderModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-sm w-full">
            <h2 className="font-black text-xl mb-5">Available Readers</h2>
            {readers.length === 0 ? (
              <p className="text-zinc-400 text-sm mb-5">No readers found. Make sure your Stripe Reader is powered on and on the same network.</p>
            ) : readers.map(r => (
              <button
                key={r.id}
                onClick={() => connectReader(r)}
                className="w-full text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-2xl p-4 mb-3 transition-colors"
              >
                <p className="font-black">{r.label || r.id}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{r.device_type} · {r.status}</p>
              </button>
            ))}
            <button onClick={() => setShowReaderModal(false)} className="w-full text-zinc-500 hover:text-white text-sm py-2 mt-1 transition-colors font-bold">Cancel</button>
          </div>
        </div>
      )}

      {/* ── Account PIN Modal ─────────────────────────────────────────── */}
      {(step === "account_pin" || step === "account_confirm") && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-xs">
            {step === "account_pin" && (
              <>
                <h2 className="font-black text-xl mb-1">Student ID</h2>
                <p className="text-zinc-600 text-sm mb-5">Enter student&apos;s account number</p>
                <div className="bg-black rounded-2xl px-4 py-5 text-center mb-4 border border-zinc-800">
                  <p className="text-4xl font-black tracking-[0.4em] text-yellow-400 min-h-[3rem] flex items-center justify-center">
                    {pin || <span className="text-zinc-800">——</span>}
                  </p>
                </div>
                {pinError && <p className="text-red-400 text-sm mb-3 font-bold">{pinError}</p>}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
                    <button key={i} onClick={() => d === "⌫" ? numpadBack() : d ? numpadDigit(d) : null}
                      className={`py-5 rounded-2xl text-xl font-black transition-colors ${d ? "bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600" : "pointer-events-none"} ${d === "⌫" ? "text-red-400" : "text-white"}`}>
                      {d}
                    </button>
                  ))}
                </div>
                <button onClick={lookupAccount} disabled={pin.length < 4}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black font-black py-4 rounded-2xl mb-2 text-base transition-colors">
                  Find Account →
                </button>
                <button onClick={resetPOS} className="w-full text-zinc-600 hover:text-white text-sm py-2 transition-colors font-bold">Cancel</button>
              </>
            )}

            {step === "account_confirm" && accountInfo && (
              <>
                <h2 className="font-black text-xl mb-5">Confirm Charge</h2>
                <div className="bg-black rounded-2xl p-4 mb-4 border border-zinc-800">
                  <p className="text-xl font-black">{accountInfo.student_name}</p>
                  <p className="text-zinc-500 text-sm mt-1">Current tab: <span className="text-yellow-400 font-black">${accountInfo.balance.toFixed(2)}</span></p>
                </div>
                <div className="space-y-1.5 mb-5">
                  {cart.map(i => (
                    <div key={i.id} className="flex justify-between text-sm text-zinc-300">
                      <span>{i.qty}× {i.name}</span>
                      <span className="font-bold">${(i.price * i.qty).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-black border-t border-zinc-800 pt-3 mt-2 text-base">
                    <span>Add to tab</span>
                    <span className="text-yellow-400">${total.toFixed(2)}</span>
                  </div>
                </div>
                <button onClick={confirmAccountPurchase}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-5 rounded-2xl text-lg mb-2 transition-colors">
                  Confirm ✓
                </button>
                <button onClick={() => setStep("account_pin")} className="w-full text-zinc-600 hover:text-white text-sm py-2 transition-colors font-bold">← Back</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Cash Modal ────────────────────────────────────────────────── */}
      {step === "cash_entry" && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-xs">
            <h2 className="font-black text-xl mb-1">Cash Payment</h2>
            <p className="text-zinc-500 text-sm mb-5">Due: <span className="text-white font-black text-xl">${total.toFixed(2)}</span></p>
            <div className="bg-black rounded-2xl px-4 py-5 text-center mb-4 border border-zinc-800">
              <p className="text-xs text-zinc-600 mb-1 font-bold uppercase tracking-widest">Cash received</p>
              <p className="text-4xl font-black text-green-400">${cashReceived || "0.00"}</p>
              {cashReceived && parseFloat(cashReceived) >= total && (
                <p className="text-sm text-zinc-400 mt-2">Change: <span className="text-green-400 font-black">${(parseFloat(cashReceived) - total).toFixed(2)}</span></p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {["1","2","3","4","5","6","7","8","9",".","0","⌫"].map((d, i) => (
                <button key={i} onClick={() => d === "⌫" ? numpadBack() : d === "." ? numpadDot() : numpadDigit(d)}
                  className={`py-5 rounded-2xl text-xl font-black bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 transition-colors ${d === "⌫" ? "text-red-400" : "text-white"}`}>
                  {d}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[5, 10, 20].map(amt => (
                <button key={amt} onClick={() => setCashReceived(amt.toFixed(2))}
                  className="py-3 rounded-2xl text-sm font-black bg-zinc-700 hover:bg-zinc-600 text-white transition-colors">
                  ${amt}
                </button>
              ))}
            </div>
            <button onClick={processCash}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-5 rounded-2xl text-lg mb-2 transition-colors">
              Record Cash Sale ✓
            </button>
            <button onClick={resetPOS} className="w-full text-zinc-600 hover:text-white text-sm py-2 transition-colors font-bold">Cancel</button>
          </div>
        </div>
      )}

      {/* ── Card Processing ───────────────────────────────────────────── */}
      {step === "card_processing" && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 w-full max-w-xs text-center">
            <div className="text-6xl mb-5 animate-pulse">💳</div>
            <h2 className="font-black text-2xl mb-2">Tap, Insert, or Swipe</h2>
            <p className="text-zinc-500 text-sm mb-1">Total: <span className="text-white font-black text-xl">${total.toFixed(2)}</span></p>
            <p className="text-zinc-700 text-xs mt-3">Present card on the reader…</p>
          </div>
        </div>
      )}

      {/* ── Success ───────────────────────────────────────────────────── */}
      {step === "success" && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-green-500/20 rounded-3xl p-10 w-full max-w-xs text-center">
            <div className="text-6xl mb-5">✅</div>
            <h2 className="font-black text-2xl mb-3">Done!</h2>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">{successMsg}</p>
            <button onClick={resetPOS}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-2xl text-base transition-colors">
              Next Customer
            </button>
          </div>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {step === "error" && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-red-500/20 rounded-3xl p-10 w-full max-w-xs text-center">
            <div className="text-6xl mb-5">⚠️</div>
            <h2 className="font-black text-2xl mb-3 text-red-400">Error</h2>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">{errorMsg}</p>
            <button onClick={resetPOS}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 rounded-2xl text-base transition-colors">
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
