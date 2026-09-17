"use client";
import { useState, useEffect, useCallback } from "react";

type Employee = { id: string; name: string; hourly_rate: number; token: string; is_active: boolean };
type Entry = {
  id: string;
  employee_id: string;
  clock_in: string;
  clock_out: string | null;
  notes: string;
  employees: { name: string };
};

const CDT = "America/Chicago";

function toLocal(iso: string) {
  // Returns "YYYY-MM-DDTHH:MM" in America/Chicago for datetime-local input
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CDT, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}`;
}

function fromLocal(localStr: string) {
  // Treat input as America/Chicago → UTC ISO
  return new Date(localStr + ":00").toISOString();
}

function duration(clockIn: string, clockOut: string | null) {
  const end = clockOut ? new Date(clockOut) : new Date();
  const h = (end.getTime() - new Date(clockIn).getTime()) / 3600000;
  return h;
}

function fmtH(h: number) {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${hrs}h ${mins}m`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: CDT, weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

// Pay period: current week Mon–Sun
function weekBounds() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: CDT }));
  const day = now.getDay(); // 0=Sun
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return { start: mon.toISOString(), end: sun.toISOString() };
}

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://www.thehungryroostertx.com";

export default function TimeclockTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [view, setView] = useState<"summary" | "entries">("summary");
  const [selectedEmp, setSelectedEmp] = useState<string>("all");
  const [saving, setSaving] = useState(false);

  // New employee form
  const [newName, setNewName] = useState("");
  const [newRate, setNewRate] = useState("");
  const [addingEmp, setAddingEmp] = useState(false);

  // Edit punch modal
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [editIn, setEditIn] = useState("");
  const [editOut, setEditOut] = useState("");

  const { start: weekStart } = weekBounds();

  const loadAll = useCallback(async () => {
    const [empRes, entRes] = await Promise.all([
      fetch("/api/timeclock/employees"),
      fetch(`/api/timeclock/entries?since=${weekStart}`),
    ]);
    if (empRes.ok) setEmployees(await empRes.json());
    if (entRes.ok) setEntries(await entRes.json());
  }, [weekStart]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Hours summary per employee this week
  const summary = employees.filter(e => e.is_active).map(emp => {
    const empEntries = entries.filter(e => e.employee_id === emp.id);
    const hours = empEntries.reduce((sum, e) => sum + duration(e.clock_in, e.clock_out), 0);
    const pay = hours * emp.hourly_rate;
    const isClockedIn = empEntries.some(e => !e.clock_out);
    return { emp, hours, pay, isClockedIn, shifts: empEntries.length };
  });

  const totalHours = summary.reduce((s, r) => s + r.hours, 0);
  const totalPay = summary.reduce((s, r) => s + r.pay, 0);

  const addEmployee = async () => {
    if (!newName.trim()) return;
    setAddingEmp(true);
    const res = await fetch("/api/timeclock/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), hourly_rate: Number(newRate) || 0 }),
    });
    if (res.ok) { setNewName(""); setNewRate(""); await loadAll(); }
    setAddingEmp(false);
  };

  const toggleActive = async (emp: Employee) => {
    await fetch(`/api/timeclock/employees/${emp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !emp.is_active }),
    });
    await loadAll();
  };

  const updateRate = async (emp: Employee, rate: string) => {
    await fetch(`/api/timeclock/employees/${emp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hourly_rate: Number(rate) }),
    });
    await loadAll();
  };

  const openEdit = (entry: Entry) => {
    setEditEntry(entry);
    setEditIn(toLocal(entry.clock_in));
    setEditOut(entry.clock_out ? toLocal(entry.clock_out) : "");
  };

  const saveEdit = async () => {
    if (!editEntry) return;
    setSaving(true);
    await fetch(`/api/timeclock/entries/${editEntry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clock_in: fromLocal(editIn),
        clock_out: editOut ? fromLocal(editOut) : null,
      }),
    });
    setEditEntry(null);
    await loadAll();
    setSaving(false);
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Delete this punch?")) return;
    await fetch(`/api/timeclock/entries/${id}`, { method: "DELETE" });
    await loadAll();
  };

  const visibleEntries = selectedEmp === "all"
    ? entries
    : entries.filter(e => e.employee_id === selectedEmp);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">⏱️ Timeclock</h2>
          <p className="text-zinc-400 text-sm">Current pay week · All times Central</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView("summary")}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${view === "summary" ? "bg-teal-500 text-black" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}>
            Summary
          </button>
          <button onClick={() => setView("entries")}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${view === "entries" ? "bg-teal-500 text-black" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}>
            All Punches
          </button>
        </div>
      </div>

      {/* Weekly totals */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 rounded-2xl p-5">
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Total Hours This Week</p>
          <p className="text-3xl font-black text-white">{fmtH(totalHours)}</p>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-5">
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Est. Payroll This Week</p>
          <p className="text-3xl font-black text-teal-400">${totalPay.toFixed(2)}</p>
        </div>
      </div>

      {view === "summary" && (
        <>
          {/* Per-employee cards */}
          <div className="space-y-4">
            {summary.map(({ emp, hours, pay, isClockedIn, shifts }) => (
              <div key={emp.id} className="bg-zinc-900 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${isClockedIn ? "bg-green-400 animate-pulse" : "bg-zinc-600"}`} />
                    <p className="font-black text-lg">{emp.name}</p>
                    <span className="text-xs text-zinc-500">{isClockedIn ? "Clocked in" : "Clocked out"}</span>
                  </div>
                  <button onClick={() => toggleActive(emp)}
                    className="text-xs text-zinc-500 hover:text-red-400 transition-colors">
                    {emp.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Hours</p>
                    <p className="font-black text-xl">{fmtH(hours)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Shifts</p>
                    <p className="font-black text-xl">{shifts}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Est. Pay</p>
                    <p className="font-black text-xl text-teal-400">${pay.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-zinc-500">Hourly rate: $</p>
                  <input
                    type="number"
                    defaultValue={emp.hourly_rate}
                    onBlur={e => updateRate(emp, e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-sm w-20 text-white focus:outline-none focus:border-teal-500"
                    step="0.25"
                    min="0"
                  />
                  <span className="text-xs text-zinc-500">/hr</span>
                </div>
                <div className="border-t border-zinc-800 pt-3">
                  <p className="text-xs text-zinc-500 mb-1">Their clock-in link:</p>
                  <p className="text-xs font-mono text-teal-400 break-all select-all">
                    {BASE}/timeclock/{emp.token}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Inactive employees */}
          {employees.filter(e => !e.is_active).length > 0 && (
            <div className="space-y-2">
              <p className="text-zinc-500 text-xs uppercase tracking-widest">Inactive</p>
              {employees.filter(e => !e.is_active).map(emp => (
                <div key={emp.id} className="bg-zinc-900/50 rounded-xl px-4 py-3 flex items-center justify-between opacity-50">
                  <p className="text-sm">{emp.name}</p>
                  <button onClick={() => toggleActive(emp)} className="text-xs text-teal-400 hover:text-teal-300">Reactivate</button>
                </div>
              ))}
            </div>
          )}

          {/* Add employee */}
          <div className="bg-zinc-900 rounded-2xl p-5 space-y-3">
            <p className="font-bold text-sm uppercase tracking-widest text-zinc-400">Add Employee</p>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
              />
              <div className="flex items-center gap-1">
                <span className="text-zinc-400 text-sm">$</span>
                <input
                  type="number"
                  placeholder="Rate"
                  value={newRate}
                  onChange={e => setNewRate(e.target.value)}
                  className="w-20 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
                  step="0.25"
                  min="0"
                />
                <span className="text-zinc-400 text-sm">/hr</span>
              </div>
            </div>
            <button
              onClick={addEmployee}
              disabled={addingEmp || !newName.trim()}
              className="bg-teal-500 hover:bg-teal-400 text-black font-black px-6 py-2 rounded-full text-sm disabled:opacity-50 transition-colors"
            >
              {addingEmp ? "Adding…" : "Add Employee"}
            </button>
          </div>
        </>
      )}

      {view === "entries" && (
        <div className="space-y-4">
          {/* Filter */}
          <select
            value={selectedEmp}
            onChange={e => setSelectedEmp(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none"
          >
            <option value="all">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>

          {visibleEntries.length === 0 && (
            <p className="text-zinc-500 text-sm text-center py-8">No punches this week</p>
          )}

          <div className="space-y-2">
            {visibleEntries.map(entry => (
              <div key={entry.id} className="bg-zinc-900 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm">{entry.employees?.name}</p>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      {formatDateTime(entry.clock_in)} →{" "}
                      {entry.clock_out ? formatDateTime(entry.clock_out) : <span className="text-green-400 font-bold">still in</span>}
                    </p>
                    <p className="text-teal-400 text-xs font-bold mt-0.5">
                      {fmtH(duration(entry.clock_in, entry.clock_out))}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(entry)}
                      className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-full transition-colors">
                      Edit
                    </button>
                    <button onClick={() => deleteEntry(entry.id)}
                      className="text-xs bg-red-900/30 hover:bg-red-900/60 text-red-400 px-3 py-1 rounded-full transition-colors">
                      Del
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit punch modal */}
      {editEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <p className="font-black text-lg">Edit Punch — {editEntry.employees?.name}</p>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-widest block mb-1">Clock In (Central)</label>
              <input
                type="datetime-local"
                value={editIn}
                onChange={e => setEditIn(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-widest block mb-1">Clock Out (Central) — leave blank if still in</label>
              <input
                type="datetime-local"
                value={editOut}
                onChange={e => setEditOut(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditEntry(null)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 rounded-full text-sm transition-colors">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={saving}
                className="flex-1 bg-teal-500 hover:bg-teal-400 text-black font-black py-2 rounded-full text-sm transition-colors disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
