"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";

type OrderRow = {
  id: string;
  order_type: string;
  total: number;
  tax_amount?: number | null;
  tip_amount?: number | null;
  status: string;
  created_at: string;
};

type InvoiceRow = {
  id: string;
  total: number;
  tax_amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
};

type ReportRow = {
  id: string;
  type: string;
  total: number;
  tax: number;
  tip: number;
  date: string;
};

const RANGE_OPTIONS = [
  { label: "This Week",   value: "week"       },
  { label: "This Month",  value: "month"      },
  { label: "Last Month",  value: "last_month" },
  { label: "YTD",         value: "ytd"        },
  { label: "All Time",    value: "all"        },
] as const;
type Range = typeof RANGE_OPTIONS[number]["value"];

const TYPE_LABELS: Record<string, string> = {
  menu:    "Menu (Walk-in)",
  dinner:  "Dinner Drop",
  shabbat: "Shabbat Box",
  bakery:  "Esther's Bakery",
  invoice: "Catering / Invoices",
};

const TYPE_COLOR: Record<string, string> = {
  menu:    "text-teal-400",
  dinner:  "text-teal-400",
  shabbat: "text-yellow-400",
  bakery:  "text-orange-400",
  invoice: "text-purple-400",
};

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + "T12:00:00");
  const end   = new Date(weekStart + "T12:00:00");
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

function getRangeDates(range: Range): { from: Date | null; to: Date | null } {
  const now = new Date();
  if (range === "all") return { from: null, to: null };
  if (range === "week") {
    const start = new Date(now);
    const diff = start.getDay() === 0 ? -6 : 1 - start.getDay();
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    return { from: start, to: null };
  }
  if (range === "month") {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: null };
  }
  if (range === "last_month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to:   new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
    };
  }
  if (range === "ytd") {
    return { from: new Date(now.getFullYear(), 0, 1), to: null };
  }
  return { from: null, to: null };
}

const fmt = (n: number) => `$${Number(n).toFixed(2)}`;

export default function ReportsTab() {
  const [orders,   setOrders]   = useState<OrderRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [range,    setRange]    = useState<Range>("month");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [{ data: orderData }, { data: invoiceData }] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_type, total, tax_amount, tip_amount, status, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("invoices")
          .select("id, total, tax_amount, status, paid_at, created_at")
          .eq("status", "paid")
          .order("created_at", { ascending: false }),
      ]);
      setOrders((orderData as OrderRow[]) || []);
      setInvoices((invoiceData as InvoiceRow[]) || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Merge orders + invoices into unified rows
  const allRows: ReportRow[] = useMemo(() => [
    ...orders.map(o => ({
      id:    o.id,
      type:  o.order_type,
      total: Number(o.total)      || 0,
      tax:   Number(o.tax_amount) || 0,
      tip:   Number(o.tip_amount) || 0,
      date:  o.created_at,
    })),
    ...invoices.map(i => ({
      id:    i.id,
      type:  "invoice",
      total: Number(i.total)      || 0,
      tax:   Number(i.tax_amount) || 0,
      tip:   0,
      date:  i.paid_at || i.created_at,
    })),
  ], [orders, invoices]);

  // Date-filtered rows
  const filtered = useMemo(() => {
    const { from, to } = getRangeDates(range);
    return allRows.filter(r => {
      const d = new Date(r.date);
      if (from && d < from) return false;
      if (to   && d > to)   return false;
      return true;
    });
  }, [allRows, range]);

  // Summary totals
  const summary = useMemo(() => filtered.reduce(
    (acc, r) => ({
      count:   acc.count + 1,
      revenue: acc.revenue + Math.max(0, r.total - r.tax - r.tip),
      tax:     acc.tax   + r.tax,
      tips:    acc.tips  + r.tip,
      total:   acc.total + r.total,
    }),
    { count: 0, revenue: 0, tax: 0, tips: 0, total: 0 }
  ), [filtered]);

  // By order type
  const byType = useMemo(() => {
    const map: Record<string, { count: number; revenue: number; tax: number; tips: number; total: number }> = {};
    filtered.forEach(r => {
      if (!map[r.type]) map[r.type] = { count: 0, revenue: 0, tax: 0, tips: 0, total: 0 };
      map[r.type].count++;
      map[r.type].tax     += r.tax;
      map[r.type].tips    += r.tip;
      map[r.type].total   += r.total;
      map[r.type].revenue += Math.max(0, r.total - r.tax - r.tip);
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [filtered]);

  // By week (newest first)
  const byWeek = useMemo(() => {
    const map: Record<string, { label: string; count: number; revenue: number; tax: number; tips: number; total: number }> = {};
    filtered.forEach(r => {
      const ws = getWeekStart(new Date(r.date));
      if (!map[ws]) map[ws] = { label: formatWeekLabel(ws), count: 0, revenue: 0, tax: 0, tips: 0, total: 0 };
      map[ws].count++;
      map[ws].tax     += r.tax;
      map[ws].tips    += r.tip;
      map[ws].total   += r.total;
      map[ws].revenue += Math.max(0, r.total - r.tax - r.tip);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const hasTaxData = allRows.some(r => r.tax > 0);
  const hasTipData = allRows.some(r => r.tip > 0);

  const thCls  = "text-right px-5 py-3 text-zinc-500 font-black uppercase tracking-widest text-xs";
  const thLCls = "text-left  px-5 py-3 text-zinc-500 font-black uppercase tracking-widest text-xs";

  if (loading) {
    return <div className="text-zinc-500 py-16 text-center">Loading reports…</div>;
  }

  return (
    <div>
      {/* Header + range filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-black mb-1">Sales Reports</h2>
          <p className="text-zinc-500 text-sm">Revenue across all order types. Tax &amp; tips shown where captured.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`text-sm font-black px-4 py-2 rounded-full transition-colors ${
                range === opt.value
                  ? "bg-teal-500 text-black"
                  : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Migration warning */}
      {(!hasTaxData || !hasTipData) && (
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-4 py-3 mb-6 text-sm text-yellow-300">
          ⚠ Tax and/or tip columns are not yet populated on older orders. Run the orders table migration in Supabase to capture these on new orders going forward.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Orders",         value: summary.count.toString(), color: "text-white"    },
          { label: "Revenue",        value: fmt(summary.revenue),     color: "text-teal-400" },
          { label: "Tax Collected",  value: fmt(summary.tax),         color: "text-yellow-400" },
          { label: "Tips",           value: fmt(summary.tips),        color: "text-orange-400" },
          { label: "Gross Total",    value: fmt(summary.total),       color: "text-white font-black" },
        ].map(card => (
          <div key={card.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-2">{card.label}</p>
            <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue by order type */}
      <div className="mb-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Revenue by Order Type</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className={thLCls}>Type</th>
                <th className={thCls}>Orders</th>
                <th className={thCls}>Revenue</th>
                <th className={thCls}>Tax</th>
                <th className={thCls}>Tips</th>
                <th className={thCls}>Total</th>
              </tr>
            </thead>
            <tbody>
              {byType.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-zinc-600 py-10">No orders in this period</td></tr>
              ) : byType.map(([type, d]) => (
                <tr key={type} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors">
                  <td className={`px-5 py-3 font-bold ${TYPE_COLOR[type] || "text-white"}`}>
                    {TYPE_LABELS[type] || type}
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-400">{d.count}</td>
                  <td className="px-5 py-3 text-right text-teal-400 font-bold">{fmt(d.revenue)}</td>
                  <td className="px-5 py-3 text-right text-yellow-400">{fmt(d.tax)}</td>
                  <td className="px-5 py-3 text-right text-orange-400">{fmt(d.tips)}</td>
                  <td className="px-5 py-3 text-right text-white font-black">{fmt(d.total)}</td>
                </tr>
              ))}
            </tbody>
            {byType.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-zinc-700 bg-zinc-800/80">
                  <td className="px-5 py-3 font-black text-white">TOTAL</td>
                  <td className="px-5 py-3 text-right font-black text-white">{summary.count}</td>
                  <td className="px-5 py-3 text-right font-black text-teal-400">{fmt(summary.revenue)}</td>
                  <td className="px-5 py-3 text-right font-black text-yellow-400">{fmt(summary.tax)}</td>
                  <td className="px-5 py-3 text-right font-black text-orange-400">{fmt(summary.tips)}</td>
                  <td className="px-5 py-3 text-right font-black text-white">{fmt(summary.total)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Weekly breakdown */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Weekly Breakdown</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className={thLCls}>Week</th>
                <th className={thCls}>Orders</th>
                <th className={thCls}>Revenue</th>
                <th className={thCls}>Tax Collected</th>
                <th className={thCls}>Tips</th>
                <th className={thCls}>Total</th>
              </tr>
            </thead>
            <tbody>
              {byWeek.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-zinc-600 py-10">No orders in this period</td></tr>
              ) : byWeek.map(([ws, d]) => (
                <tr key={ws} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors">
                  <td className="px-5 py-3 font-bold text-white">{d.label}</td>
                  <td className="px-5 py-3 text-right text-zinc-400">{d.count}</td>
                  <td className="px-5 py-3 text-right text-teal-400 font-bold">{fmt(d.revenue)}</td>
                  <td className="px-5 py-3 text-right text-yellow-400">{fmt(d.tax)}</td>
                  <td className="px-5 py-3 text-right text-orange-400">{fmt(d.tips)}</td>
                  <td className="px-5 py-3 text-right text-white font-black">{fmt(d.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-zinc-600 text-xs mt-3">Weeks run Monday – Sunday. Invoice revenue counted on paid date.</p>
      </div>
    </div>
  );
}
