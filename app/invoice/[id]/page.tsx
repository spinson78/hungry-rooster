"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type LineItem = { id: string; description: string; qty: number; rate: number };

type Invoice = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_company: string;
  line_items: LineItem[];
  notes: string;
  total: number;
  tax_amount: number;
  delivery_fee: number;
  service_fee: number;
  delivery_type: string;
  delivery_address: string;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  payment_method: string;
  created_at: string;
};

const fmt = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;
const TAX_RATE = 0.0825;
const GRAT_PRESETS = [0, 10, 20, 50];

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [gratInput, setGratInput] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    const loadInvoice = async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        setNotFound(true);
      } else {
        setInvoice(data as Invoice);
      }
      setLoading(false);
    };
    if (id) loadInvoice();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <p className="text-zinc-400 text-sm">Loading invoice...</p>
    </div>
  );

  if (notFound || !invoice) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-zinc-800 font-black text-2xl mb-2">Invoice not found</p>
        <p className="text-zinc-500 text-sm">Check the link and try again.</p>
      </div>
    </div>
  );

  const lineItems = invoice.line_items as LineItem[];
  const subtotal = lineItems.reduce((s, i) => s + i.qty * i.rate, 0);
  const tax = invoice.tax_amount ?? subtotal * TAX_RATE;
  const deliveryFee = Number(invoice.delivery_fee) || 0;
  const serviceFee = Number(invoice.service_fee) || 0;
  const baseTotal = subtotal + tax + deliveryFee + serviceFee;

  const gratuity = parseFloat(gratInput) || 0;

  const grandTotal = baseTotal + gratuity;
  const isPaid = invoice.status === "paid";

  const handlePay = async () => {
    setPaying(true);
    setPayError("");
    try {
      const res = await fetch("/api/invoice-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoice.id, gratuity }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPayError("Could not generate payment link. Please try again.");
        setPaying(false);
      }
    } catch {
      setPayError("Network error. Please try again.");
      setPaying(false);
    }
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .invoice-shell { box-shadow: none !important; border: none !important; border-radius: 0 !important; }
          body { background: white !important; }
        }
        @page { margin: 0.75in; size: letter; }
      `}</style>

      {/* Top bar */}
      <div className="no-print bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <a href="/" className="opacity-60 hover:opacity-100 transition-opacity">
          <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-8 w-auto" />
        </a>
        <button
          onClick={() => window.print()}
          className="text-sm font-black text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-5 py-2 rounded-full transition-colors"
        >
          🖨 Print / Save PDF
        </button>
      </div>

      <div className="min-h-screen bg-zinc-100 py-10 px-4 print:bg-white print:py-0 print:px-0">
        <div className="invoice-shell max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Dark header */}
          <div className="bg-zinc-900 px-10 py-8 flex items-start justify-between">
            <div>
              <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-10 w-auto mb-4" />
              <p className="text-zinc-400 text-xs">1499 Regal Row, Suite 206</p>
              <p className="text-zinc-400 text-xs">Dallas, TX 75247</p>
            </div>
            <div className="text-right">
              <p className="text-yellow-400 font-black text-3xl tracking-widest uppercase">Invoice</p>
              <p className="text-white font-mono text-lg mt-1">{invoice.invoice_number}</p>
              <p className="text-zinc-400 text-xs mt-2">
                Issued: {new Date(invoice.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
              {invoice.due_date && (
                <p className="text-zinc-400 text-xs">
                  Due: {new Date(invoice.due_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              )}
              <span className={`inline-block mt-2 text-xs font-black px-3 py-1 rounded-full ${
                isPaid ? "bg-teal-500/20 text-teal-400" : "bg-zinc-700 text-zinc-400"
              }`}>
                {isPaid ? "✓ PAID" : "UNPAID"}
              </span>
            </div>
          </div>

          <div className="px-10 py-8">

            {/* Bill To + Fulfillment */}
            <div className="flex gap-10 mb-8 pb-8 border-b border-zinc-200">
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">Bill To</p>
                <p className="font-black text-zinc-900 text-lg">{invoice.customer_name}</p>
                {invoice.customer_company && <p className="text-zinc-600 text-sm">{invoice.customer_company}</p>}
                {invoice.customer_email && <p className="text-zinc-500 text-sm">{invoice.customer_email}</p>}
                {invoice.customer_phone && <p className="text-zinc-500 text-sm">{invoice.customer_phone}</p>}
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">Fulfillment</p>
                <p className="font-black text-zinc-900">{invoice.delivery_type === "delivery" ? "🚗 Delivery" : "🏪 Pickup"}</p>
                {invoice.delivery_type === "delivery" && invoice.delivery_address && (
                  <p className="text-zinc-500 text-sm mt-1">{invoice.delivery_address}</p>
                )}
              </div>
              {isPaid && invoice.paid_at && (
                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">Payment</p>
                  <p className="font-black text-teal-600">Paid in Full</p>
                  <p className="text-zinc-500 text-sm">{new Date(invoice.paid_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                  {invoice.payment_method && <p className="text-zinc-500 text-sm capitalize">{invoice.payment_method}</p>}
                </div>
              )}
            </div>

            {/* Line Items */}
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="border-b-2 border-zinc-200">
                  <th className="text-left text-xs font-black uppercase tracking-widest text-zinc-400 pb-3">Description</th>
                  <th className="text-center text-xs font-black uppercase tracking-widest text-zinc-400 pb-3 w-16">Qty</th>
                  <th className="text-right text-xs font-black uppercase tracking-widest text-zinc-400 pb-3 w-28">Rate</th>
                  <th className="text-right text-xs font-black uppercase tracking-widest text-zinc-400 pb-3 w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, i) => (
                  <tr key={i} className="border-b border-zinc-100">
                    <td className="py-3 text-zinc-800 font-medium">{item.description}</td>
                    <td className="py-3 text-center text-zinc-500">{item.qty}</td>
                    <td className="py-3 text-right text-zinc-500">{fmt(item.rate)}</td>
                    <td className="py-3 text-right font-black text-zinc-900">{fmt(item.qty * item.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Base Totals */}
            <div className="flex justify-end mb-2">
              <div className="w-72 space-y-2 text-sm">
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal</span><span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Sales Tax (8.25%)</span><span>{fmt(tax)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-zinc-500">
                    <span>Delivery Fee</span><span>{fmt(deliveryFee)}</span>
                  </div>
                )}
                {serviceFee > 0 && (
                  <div className="flex justify-between text-zinc-500">
                    <span>Service Fee</span><span>{fmt(serviceFee)}</span>
                  </div>
                )}
                {gratuity > 0 && (
                  <div className="flex justify-between text-teal-700 font-bold">
                    <span>Gratuity</span><span>{fmt(gratuity)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-zinc-900 text-lg border-t-2 border-zinc-900 pt-3 mt-3">
                  <span>Total Due</span><span>{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="bg-zinc-50 rounded-xl p-5 mb-8 border border-zinc-200 mt-6">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Notes</p>
                <p className="text-zinc-600 text-sm leading-relaxed">{invoice.notes}</p>
              </div>
            )}

            {/* Gratuity + Pay — hidden on print */}
            {!isPaid && (
              <div className="no-print mt-8 border-t border-zinc-200 pt-8">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">Add Gratuity (Optional)</p>
                <div className="relative w-48 mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={gratInput}
                    onChange={e => setGratInput(e.target.value)}
                    className="w-full border border-zinc-300 rounded-xl pl-8 pr-4 py-3 text-zinc-900 focus:outline-none focus:border-zinc-900 text-sm"
                  />
                </div>

                <div className="flex items-center justify-between bg-zinc-50 rounded-xl px-5 py-4 border border-zinc-200 mb-4">
                  <span className="text-zinc-500 text-sm">Total with gratuity</span>
                  <span className="text-zinc-900 font-black text-xl">{fmt(grandTotal)}</span>
                </div>

                {payError && <p className="text-red-500 text-sm mb-3">{payError}</p>}

                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-black text-lg py-4 rounded-full transition-colors disabled:opacity-50"
                >
                  {paying ? "Redirecting to payment..." : `Pay ${fmt(grandTotal)} — Secure Checkout →`}
                </button>
                <p className="text-zinc-400 text-xs text-center mt-3">Powered by Stripe. Your card info is never stored on our servers.</p>
              </div>
            )}

            {isPaid && (
              <div className="mt-8 bg-teal-50 border border-teal-200 rounded-xl p-6 text-center">
                <p className="text-teal-700 font-black text-xl">✓ Paid in Full</p>
                <p className="text-teal-600 text-sm mt-1">Thank you — payment received.</p>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="border-t border-zinc-200 px-10 py-5 flex items-center justify-between">
            <p className="text-zinc-400 text-xs">Thank you for your business — The Hungry Rooster</p>
            <p className="text-zinc-400 text-xs">thehungryroostertx.com</p>
          </div>

        </div>
      </div>
    </>
  );
}
