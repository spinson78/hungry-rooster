"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "react-qr-code";

type MenuItem = { id: string; name: string; price: number; category: string; emoji: string };
type CartItem = MenuItem & { qty: number };
type PaymentMode = null | "account" | "card" | "cash" | "qr" | "zelle_venmo";
type Step = "pos" | "account_pin" | "account_confirm" | "card_processing" | "cash_entry" | "qr_waiting" | "zelle_venmo_pending" | "success" | "error";



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
  connectReader: (reader: StripeReader, opts?: { fail_if_in_use?: boolean }) => Promise<{ error?: { message: string } }>;
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
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);

  // ── Fullscreen management ─────────────────────────────────────────────────
  const enterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
    else if ((el as any).mozRequestFullScreen) (el as any).mozRequestFullScreen();
    else if ((el as any).msRequestFullscreen) (el as any).msRequestFullscreen();
    // Lock to portrait if the screen supports it (Android/Chrome; no-op on iOS)
    if (screen.orientation && (screen.orientation as any).lock) {
      (screen.orientation as any).lock("portrait").catch(() => {});
    }
    setShowFullscreenPrompt(false);
  };

  useEffect(() => {
    const onFSChange = () => {
      const fsEl = document.fullscreenElement || (document as any).webkitFullscreenElement;
      if (!fsEl) setShowFullscreenPrompt(true); // re-prompt if they exit
    };
    document.addEventListener("fullscreenchange", onFSChange);
    document.addEventListener("webkitfullscreenchange", onFSChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFSChange);
      document.removeEventListener("webkitfullscreenchange", onFSChange);
    };
  }, []);
  const [qrSession, setQrSession] = useState<{ session_id: string; url: string } | null>(null);
  const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  // Friday check for Shabbat items
  const isFriday = new Date().getDay() === 5;

  const allCategories = Array.from(new Set(menu.map(m => m.category)));
  const categories = allCategories.filter(c => c !== "Shabbat" || isFriday);

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
    const result = await terminalRef.current.connectReader(reader, { fail_if_in_use: false });
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
      const msg = data.auto_charged
        ? `✓ $${total.toFixed(2)} charged to ${accountInfo.student_name}'s card on file`
        : `✓ $${total.toFixed(2)} added to ${accountInfo.student_name}'s tab. New balance: $${data.new_balance.toFixed(2)}`;
      setSuccessMsg(msg);
      setStep("success");
      setTimeout(() => resetPOS(), 5000);
    } else {
      setErrorMsg(data.error || "Failed to record purchase");
      setStep("error");
    }
  };

  const processCard = async () => {
    if (!terminalRef.current) {
      setErrorMsg("Card reader not connected. Tap the reader icon to connect.");
      setStep("error");
      return;
    }
    // Check actual SDK connection status (not just React state)
    const actualStatus = terminalRef.current.getConnectionStatus();
    if (actualStatus !== "connected") {
      setTerminalStatus("not_connected");
      setConnectedReader(null);
      setErrorMsg("Reader disconnected. Tap the reader icon to reconnect, then try again.");
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

  const initiateQRPayment = async () => {
    if (cart.length === 0) return;
    setPaymentMode("qr");
    setStep("card_processing"); // show "loading" briefly
    try {
      const description = cart.map(i => `${i.qty}× ${i.name}`).join(", ");
      const res = await fetch("/api/school/qr-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_cents: Math.round(total * 100), description }),
      });
      const data = await res.json();
      if (!data.session_id) throw new Error("Failed to create payment session");

      setQrSession({ session_id: data.session_id, url: data.url });
      setStep("qr_waiting");

      // Poll every 2 seconds for payment
      qrPollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/school/qr-checkout/status?session_id=${data.session_id}`);
          const status = await statusRes.json();
          if (status.paid) {
            clearInterval(qrPollRef.current!);
            qrPollRef.current = null;
            if (qrTimeoutRef.current) { clearTimeout(qrTimeoutRef.current); qrTimeoutRef.current = null; }

            // Record transaction
            await fetch("/api/school/purchase", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                payment_type: "card",
                items: cart.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
                total,
                stripe_payment_intent_id: status.payment_intent,
              }),
            });
            setQrSession(null);
            setSuccessMsg(`✓ Payment of $${total.toFixed(2)} received`);
            setStep("success");
            setTimeout(() => resetPOS(), 4000);
          }
        } catch { /* ignore poll errors */ }
      }, 2000);

      // Auto-cancel after 10 minutes
      qrTimeoutRef.current = setTimeout(() => {
        if (qrPollRef.current) { clearInterval(qrPollRef.current); qrPollRef.current = null; }
        setQrSession(null);
        setErrorMsg("Payment timed out — QR code expired. Please try again.");
        setStep("error");
      }, 10 * 60 * 1000);

    } catch (err) {
      setErrorMsg((err as Error).message || "Failed to create QR payment");
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
      setSuccessMsg(`✓ Cash sale $${total.toFixed(2)}${received >= total ? ` — Change: $${data.change.toFixed(2)}` : ""}`);
      setStep("success");
      setTimeout(() => resetPOS(), 4000);
    } else {
      setErrorMsg("Failed to record sale");
      setStep("error");
    }
  };

  const resetPOS = () => {
    if (qrPollRef.current) { clearInterval(qrPollRef.current); qrPollRef.current = null; }
    if (qrTimeoutRef.current) { clearTimeout(qrTimeoutRef.current); qrTimeoutRef.current = null; }
    setQrSession(null);
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

  const visibleItems = menu.filter(m => m.category === activeCategory);

  return (
    <div className="bg-zinc-950 text-white flex flex-col overflow-hidden select-none" style={{ height: "100dvh" }}>
    <div className="bg-black text-white flex flex-col flex-1 overflow-hidden rounded-2xl border-2 border-zinc-700" style={{ margin: "12px 28px 180px 28px", paddingBottom: "env(safe-area-inset-bottom)", paddingTop: "env(safe-area-inset-top)" }}>

      {/* ── Fullscreen Prompt ─────────────────────────────────────────── */}
      {showFullscreenPrompt && (
        <div
          className="fixed inset-0 bg-black z-[999] flex flex-col items-center justify-center cursor-pointer"
          onClick={enterFullscreen}
        >
          <div className="text-7xl mb-6">☕</div>
          <h1 className="text-4xl font-black text-white mb-3">THE COOP</h1>
          <p className="text-zinc-400 text-lg mb-10">by The Hungry Rooster</p>
          <div className="bg-yellow-400 text-black font-black text-xl px-10 py-5 rounded-full animate-pulse">
            Tap anywhere to start
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-zinc-950 border-b border-zinc-800 px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <p className="font-black text-xl leading-none tracking-tight">THE COOP</p>
            <p className="text-zinc-500 text-xs leading-none mt-0.5">by The Hungry Rooster</p>
          </div>
        </div>

        <div className="text-xs text-zinc-600 font-bold">📱 Scan to Pay · Account Tab</div>
      </div>

      {/* ── Order Mode (portrait-first stacked layout) ─────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">

          {/* Category tabs */}
          <div className="bg-zinc-950 border-b border-zinc-800 px-3 py-2 flex gap-2 flex-shrink-0 overflow-x-auto">
            {categories.length === 0 ? (
              <p className="text-zinc-700 text-sm px-2">Loading menu…</p>
            ) : categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-3 rounded-full text-base font-black whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeCategory === cat
                    ? "bg-yellow-400 text-black"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                }`}
              >
                {cat === "Shabbat" ? "✡ Shabbat" : cat}
              </button>
            ))}
          </div>

          {/* Menu grid — fills available space */}
          <div className="flex-1 overflow-y-auto p-3">
            {visibleItems.length === 0 ? (
              <div className="text-center py-16 text-zinc-700">
                <p className="text-5xl mb-3">🍽️</p>
                <p className="font-bold">No items in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {visibleItems.map(item => {
                  const cartItem = cart.find(c => c.id === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => addItem(item)}
                      className={`relative p-5 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                        cartItem
                          ? "border-yellow-400 bg-yellow-400/10"
                          : "border-zinc-800 bg-zinc-950"
                      }`}
                    >
                      <p className="text-5xl mb-3 leading-none">{item.emoji}</p>
                      <p className="font-black text-base leading-tight text-white">{item.name}</p>
                      <p className="text-yellow-400 font-black text-lg mt-1">${item.price.toFixed(2)}</p>
                      {cartItem && (
                        <span className="absolute top-2 right-2 bg-yellow-400 text-black text-sm font-black w-7 h-7 rounded-full flex items-center justify-center shadow-lg">
                          {cartItem.qty}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart summary — compact scrollable strip, only shown when items in cart */}
          {cart.length > 0 && (
            <div className="border-t border-zinc-800 bg-zinc-950 flex-shrink-0 max-h-28 overflow-y-auto px-3 py-2">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-2 py-1.5">
                  <span className="text-yellow-400 font-black text-sm w-6 text-center">{item.qty}×</span>
                  <span className="flex-1 text-sm font-bold truncate text-white">{item.name}</span>
                  <span className="text-zinc-400 text-sm font-bold">${(item.price * item.qty).toFixed(2)}</span>
                  <button onClick={() => removeItem(item.id)}
                    className="text-zinc-700 hover:text-red-400 text-lg leading-none w-6 flex items-center justify-center transition-colors">×</button>
                </div>
              ))}
            </div>
          )}

          {/* Total + Payment buttons — always pinned at bottom */}
          <div className="border-t border-zinc-800 p-3 flex-shrink-0 space-y-2">
            <div className="flex justify-between items-center px-1 mb-1">
              <span className="text-zinc-400 font-black text-base uppercase tracking-widest">Total</span>
              <span className="text-4xl font-black">${total.toFixed(2)}</span>
            </div>

            <div className={`grid gap-2 ${cart.length > 0 ? "" : "opacity-30 pointer-events-none"}`} style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
              <button
                onClick={() => openPayment("account")}
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-black py-5 rounded-2xl text-sm transition-colors flex flex-col items-center justify-center gap-1"
              >
                <span className="text-2xl">📋</span>
                <span>Account Tab</span>
              </button>
              <button
                onClick={initiateQRPayment}
                className="bg-purple-600 hover:bg-purple-500 text-white font-black py-5 rounded-2xl text-sm transition-colors flex flex-col items-center justify-center gap-1"
              >
                <span className="text-2xl">📱</span>
                <span>Scan to Pay</span>
              </button>
              <button
                onClick={() => { setPaymentMode("zelle_venmo"); setStep("zelle_venmo_pending"); }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl text-sm transition-colors flex flex-col items-center justify-center gap-1"
              >
                <span className="text-2xl">💸</span>
                <span>Zelle/Venmo</span>
              </button>
            </div>

            {cart.length > 0 && (
              <button onClick={clearCart} className="w-full text-zinc-700 hover:text-red-400 text-xs py-1 transition-colors font-bold">
                Clear Order
              </button>
            )}
          </div>

      {/* ── QR Pay Modal ──────────────────────────────────────────────── */}
      {step === "qr_waiting" && qrSession && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-sm text-center">
            <h2 className="font-black text-2xl mb-1">Scan to Pay</h2>
            <p className="text-zinc-400 text-sm mb-5">
              Point your phone camera at the code below
            </p>

            {/* QR code — generated client-side, no external request */}
            <div className="bg-white rounded-2xl p-4 inline-block mb-4 shadow-xl">
              <QRCode value={qrSession.url} size={240} />
            </div>

            <p className="text-2xl font-black text-yellow-400 mb-1">${total.toFixed(2)}</p>
            <p className="text-zinc-500 text-xs mb-4">Apple Pay · Google Pay · Debit · Credit</p>

            <div className="flex items-center justify-center gap-2 text-zinc-600 text-xs animate-pulse mb-5">
              <span className="w-2 h-2 rounded-full bg-zinc-600 inline-block" />
              Waiting for payment…
            </div>

            <button
              onClick={resetPOS}
              className="w-full text-zinc-600 hover:text-white text-sm py-2 transition-colors font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Zelle / Venmo Modal ───────────────────────────────────────── */}
      {step === "zelle_venmo_pending" && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-sm text-center">
            <h2 className="font-black text-2xl mb-2">💸 Zelle / Venmo</h2>
            <p className="text-zinc-400 text-sm mb-2">Total due:</p>
            <p className="text-white font-black text-4xl mb-8">${total.toFixed(2)}</p>

            <button
              onClick={async () => {
                // Record sale and immediately clear for next student
                await fetch("/api/school/purchase", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    payment_type: "zelle_venmo",
                    items: cart.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
                    total,
                  }),
                });
                resetPOS();
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl text-lg transition-colors mb-3"
            >
              ✓ I've Sent It
            </button>
            <button onClick={resetPOS} className="w-full text-zinc-600 hover:text-white text-sm py-2 transition-colors font-bold">
              Cancel
            </button>
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
      </div>

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
            <div className="text-6xl mb-5 animate-pulse">📱</div>
            <h2 className="font-black text-2xl mb-2">Generating QR…</h2>
            <p className="text-zinc-500 text-sm mb-1">Total: <span className="text-white font-black text-xl">${total.toFixed(2)}</span></p>
            <p className="text-zinc-700 text-xs mt-3">One moment…</p>
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
    </div>
  );
}
