"use client";
import { useState, useEffect, useRef, useCallback } from "react";

type MenuItem = { id: string; name: string; price: number; category: string; emoji: string };
type CartItem = MenuItem & { qty: number };
type PaymentMode = null | "account" | "card" | "cash";
type Step = "pos" | "account_pin" | "account_confirm" | "card_processing" | "cash_entry" | "success" | "error";

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
  const categories = Array.from(new Set(menu.map(m => m.category)));

  useEffect(() => {
    fetch("/api/school/menu").then(r => r.json()).then(d => setMenu(d.items || []));
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
      // 1. Create PaymentIntent
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

      // 2. Collect card on reader
      const collectResult = await terminalRef.current.collectPaymentMethod(piData.client_secret);
      if (collectResult.error) throw new Error(collectResult.error.message);

      // 3. Process payment
      const processResult = await terminalRef.current.processPayment(collectResult.paymentIntent!);
      if (processResult.error) throw new Error(processResult.error.message);
      if (processResult.paymentIntent?.status !== "succeeded") throw new Error("Payment did not succeed");

      // 4. Record in DB
      await fetch("/api/school/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_type: "card",
          items: cart.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
          total,
          stripe_payment_intent_id: processResult.paymentIntent.id,
        }),
      });

      setSuccessMsg(`✓ Card payment of $${total.toFixed(2)} successful`);
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

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden select-none">

      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">☕</span>
          <span className="font-black text-base">THE COOP POS</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => terminalStatus === "connected" ? null : discoverReaders()}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
              terminalStatus === "connected" ? "border-green-500 text-green-400 bg-green-500/10"
              : terminalStatus === "connecting" ? "border-yellow-500 text-yellow-400 animate-pulse"
              : "border-zinc-600 text-zinc-400 hover:border-zinc-400"
            }`}
          >
            <span>{terminalStatus === "connected" ? "●" : "○"}</span>
            {terminalStatus === "connected" ? connectedReader?.label || "Reader" : terminalStatus === "connecting" ? "Connecting…" : "Connect Reader"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Menu Panel ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {menu.length === 0 && (
            <div className="text-center py-16 text-zinc-600">
              <p className="text-3xl mb-2">☕</p>
              <p>No menu items yet — add them in Admin → School → Menu</p>
            </div>
          )}
          {categories.map(cat => (
            <div key={cat}>
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2 px-1">{cat}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {menu.filter(m => m.category === cat).map(item => {
                  const cartItem = cart.find(c => c.id === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => addItem(item)}
                      className={`relative p-3 rounded-xl border text-left transition-all active:scale-95 ${
                        cartItem ? "border-yellow-400 bg-yellow-400/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                      }`}
                    >
                      <p className="text-2xl mb-1">{item.emoji}</p>
                      <p className="font-bold text-sm leading-tight">{item.name}</p>
                      <p className="text-yellow-400 font-black text-sm mt-0.5">${item.price.toFixed(2)}</p>
                      {cartItem && (
                        <span className="absolute top-1.5 right-1.5 bg-yellow-400 text-black text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                          {cartItem.qty}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Order Panel ── */}
        <div className="w-72 bg-zinc-900 border-l border-zinc-800 flex flex-col flex-shrink-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Current Order</p>
            {cart.length === 0 ? (
              <p className="text-zinc-700 text-sm text-center py-8">Tap items to add</p>
            ) : cart.map(item => (
              <div key={item.id} className="flex items-center gap-2 py-1.5 border-b border-zinc-800">
                <span className="text-zinc-400 text-sm w-5">{item.qty}×</span>
                <span className="flex-1 text-sm font-bold truncate">{item.name}</span>
                <span className="text-xs text-zinc-400">${(item.price * item.qty).toFixed(2)}</span>
                <button onClick={() => removeItem(item.id)} className="text-zinc-600 hover:text-red-400 text-lg leading-none">×</button>
              </div>
            ))}
          </div>

          {/* Total + Charge button */}
          <div className="p-3 border-t border-zinc-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Total</span>
              <span className="text-2xl font-black text-white">${total.toFixed(2)}</span>
            </div>
            {cart.length > 0 && (
              <>
                <button onClick={() => openPayment("account")} className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-black py-3 rounded-xl text-sm transition-colors">
                  📋 Account
                </button>
                <button
                  onClick={() => openPayment("card")}
                  className={`w-full font-black py-3 rounded-xl text-sm transition-colors ${
                    terminalStatus === "connected"
                      ? "bg-teal-500 hover:bg-teal-400 text-black"
                      : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                  }`}
                >
                  💳 Card {terminalStatus !== "connected" && "(no reader)"}
                </button>
                <button onClick={() => openPayment("cash")} className="w-full bg-green-700 hover:bg-green-600 text-white font-black py-3 rounded-xl text-sm transition-colors">
                  💵 Cash
                </button>
                <button onClick={clearCart} className="w-full text-zinc-600 hover:text-red-400 text-xs py-1 transition-colors">
                  Clear Order
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Reader Discovery Modal ── */}
      {showReaderModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full">
            <h2 className="font-black text-lg mb-4">Available Readers</h2>
            {readers.length === 0 ? (
              <p className="text-zinc-400 text-sm mb-4">No readers found. Make sure your Stripe Reader is powered on and on the same network.</p>
            ) : readers.map(r => (
              <button
                key={r.id}
                onClick={() => connectReader(r)}
                className="w-full text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl p-4 mb-2 transition-colors"
              >
                <p className="font-bold">{r.label || r.id}</p>
                <p className="text-zinc-500 text-xs">{r.device_type} · {r.status}</p>
              </button>
            ))}
            <button onClick={() => setShowReaderModal(false)} className="w-full text-zinc-500 text-sm mt-2">Cancel</button>
          </div>
        </div>
      )}

      {/* ── Account PIN Modal ── */}
      {(step === "account_pin" || step === "account_confirm") && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-xs">
            {step === "account_pin" && (
              <>
                <h2 className="font-black text-lg mb-1">Student Account ID</h2>
                <p className="text-zinc-500 text-sm mb-4">Student says their ID number</p>
                <div className="bg-zinc-800 rounded-xl px-4 py-4 text-center mb-4">
                  <p className="text-4xl font-black tracking-[0.3em] text-yellow-400 min-h-[3rem]">
                    {pin || <span className="text-zinc-700">——</span>}
                  </p>
                </div>
                {pinError && <p className="text-red-400 text-sm mb-3">{pinError}</p>}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
                    <button key={i} onClick={() => d === "⌫" ? numpadBack() : d ? numpadDigit(d) : null}
                      className={`py-4 rounded-xl text-xl font-black transition-colors ${d ? "bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600" : "pointer-events-none"} ${d === "⌫" ? "text-red-400" : "text-white"}`}>
                      {d}
                    </button>
                  ))}
                </div>
                <button onClick={lookupAccount} disabled={pin.length < 4}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black font-black py-3 rounded-xl mb-2">
                  Find Account →
                </button>
                <button onClick={resetPOS} className="w-full text-zinc-500 text-sm py-2">Cancel</button>
              </>
            )}

            {step === "account_confirm" && accountInfo && (
              <>
                <h2 className="font-black text-lg mb-4">Confirm Account Charge</h2>
                <div className="bg-zinc-800 rounded-xl p-4 mb-4">
                  <p className="text-xl font-black">{accountInfo.student_name}</p>
                  <p className="text-zinc-400 text-sm">Current tab: <span className="text-yellow-400 font-bold">${accountInfo.balance.toFixed(2)}</span></p>
                </div>
                <div className="space-y-1 mb-4 text-sm">
                  {cart.map(i => (
                    <div key={i.id} className="flex justify-between text-zinc-300">
                      <span>{i.qty}× {i.name}</span>
                      <span>${(i.price * i.qty).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-black border-t border-zinc-700 pt-2 mt-2">
                    <span>Add to tab</span>
                    <span className="text-yellow-400">${total.toFixed(2)}</span>
                  </div>
                </div>
                <button onClick={confirmAccountPurchase}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-xl text-lg mb-2">
                  Confirm ✓
                </button>
                <button onClick={() => setStep("account_pin")} className="w-full text-zinc-500 text-sm py-2">← Back</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Cash Modal ── */}
      {step === "cash_entry" && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-xs">
            <h2 className="font-black text-lg mb-1">Cash Payment</h2>
            <p className="text-zinc-400 text-sm mb-4">Total due: <span className="text-white font-black text-xl">${total.toFixed(2)}</span></p>
            <div className="bg-zinc-800 rounded-xl px-4 py-4 text-center mb-4">
              <p className="text-xs text-zinc-500 mb-1">Cash received</p>
              <p className="text-3xl font-black text-green-400">${cashReceived || "0.00"}</p>
              {cashReceived && parseFloat(cashReceived) >= total && (
                <p className="text-xs text-zinc-400 mt-1">Change: <span className="text-green-400 font-bold">${(parseFloat(cashReceived) - total).toFixed(2)}</span></p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {["1","2","3","4","5","6","7","8","9",".","0","⌫"].map((d, i) => (
                <button key={i} onClick={() => d === "⌫" ? numpadBack() : d === "." ? numpadDot() : numpadDigit(d)}
                  className={`py-4 rounded-xl text-xl font-black bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 transition-colors ${d === "⌫" ? "text-red-400" : "text-white"}`}>
                  {d}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[5, 10, 20].map(amt => (
                <button key={amt} onClick={() => setCashReceived(amt.toFixed(2))}
                  className="py-2 rounded-xl text-sm font-black bg-zinc-700 hover:bg-zinc-600 text-white transition-colors">
                  ${amt}
                </button>
              ))}
            </div>
            <button onClick={processCash}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl text-lg mb-2">
              Record Cash Sale
            </button>
            <button onClick={resetPOS} className="w-full text-zinc-500 text-sm py-2">Cancel</button>
          </div>
        </div>
      )}

      {/* ── Card Processing ── */}
      {step === "card_processing" && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 w-full max-w-xs text-center">
            <div className="text-5xl mb-4 animate-pulse">💳</div>
            <h2 className="font-black text-xl mb-2">Tap, Insert, or Swipe</h2>
            <p className="text-zinc-400 text-sm mb-1">Total: <span className="text-white font-black">${total.toFixed(2)}</span></p>
            <p className="text-zinc-600 text-xs">Present card on the reader…</p>
          </div>
        </div>
      )}

      {/* ── Success ── */}
      {step === "success" && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-green-500/30 rounded-2xl p-8 w-full max-w-xs text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="font-black text-xl mb-3">Done!</h2>
            <p className="text-zinc-300 text-sm mb-6">{successMsg}</p>
            <button onClick={resetPOS} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black py-3 rounded-xl">
              Next Customer
            </button>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {step === "error" && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-8 w-full max-w-xs text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="font-black text-xl mb-3 text-red-400">Error</h2>
            <p className="text-zinc-300 text-sm mb-6">{errorMsg}</p>
            <button onClick={resetPOS} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black py-3 rounded-xl">
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
