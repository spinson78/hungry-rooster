"use client";
import { useState } from "react";

export default function SchoolRegisterPage() {
  const [form, setForm] = useState({
    student_name: "",
    student_pin: "",
    grade_class: "",
    school_name: "",
    parent_name: "",
    parent_email: "",
    parent_phone: "",
    billing_preference: "invoice",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    if (!form.student_name || !form.student_pin || !form.parent_name || !form.parent_email) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!/^\d{4,6}$/.test(form.student_pin)) {
      setError("Student ID must be 4–6 digits.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/school/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.url) {
      // Redirect to Stripe card setup
      window.location.href = data.url;
    } else if (data.success) {
      setSuccess(true);
    } else {
      setError(data.error || "Registration failed. Please try again.");
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">☕</div>
          <h1 className="text-3xl font-black mb-3">Account Created!</h1>
          <p className="text-zinc-400 mb-2">Check your email for the welcome message with your student&apos;s account ID.</p>
          <p className="text-zinc-500 text-sm">You&apos;ll receive a weekly invoice every Friday for purchases made that week.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">☕</div>
          <h1 className="text-3xl font-black mb-2">Set Up Coffee Shop Account</h1>
          <p className="text-zinc-400">Create an account for your student. They&apos;ll use their ID number at the counter.</p>
        </div>

        <div className="space-y-6">
          {/* Student Info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="font-black mb-4 text-yellow-400 text-sm uppercase tracking-widest">Student Info</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Student Name *</label>
                <input type="text" value={form.student_name} onChange={e => set("student_name", e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Choose a 4–6 digit Account ID *</label>
                <input type="text" inputMode="numeric" pattern="\d*" maxLength={6}
                  value={form.student_pin}
                  onChange={e => set("student_pin", e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 1234"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 font-mono text-xl tracking-widest" />
                <p className="text-zinc-600 text-xs mt-1">Your student will type this at the counter. Write it down!</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Grade / Class</label>
                  <input type="text" value={form.grade_class} onChange={e => set("grade_class", e.target.value)}
                    placeholder="10th Grade"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">School</label>
                  <input type="text" value={form.school_name} onChange={e => set("school_name", e.target.value)}
                    placeholder="School name"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Parent Info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="font-black mb-4 text-teal-400 text-sm uppercase tracking-widest">Parent / Guardian</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Your Name *</label>
                <input type="text" value={form.parent_name} onChange={e => set("parent_name", e.target.value)}
                  placeholder="John Smith"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Email *</label>
                <input type="email" value={form.parent_email} onChange={e => set("parent_email", e.target.value)}
                  placeholder="john@email.com"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Phone</label>
                <input type="tel" value={form.parent_phone} onChange={e => set("parent_phone", e.target.value)}
                  placeholder="(214) 555-0100"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
              </div>
            </div>
          </div>

          {/* Billing Preference */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="font-black mb-4 text-purple-400 text-sm uppercase tracking-widest">Weekly Billing</h2>
            <div className="space-y-3">
              {[
                { value: "invoice", label: "📧 Send me an invoice", desc: "You'll get a Stripe invoice by email each Friday to pay online. Payment due in 7 days." },
                { value: "auto_charge", label: "💳 Auto-charge my card", desc: "Your card is charged automatically each Friday. Setup takes 30 seconds on the next screen." },
              ].map(opt => (
                <label key={opt.value} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${form.billing_preference === opt.value ? "border-purple-500 bg-purple-500/10" : "border-zinc-700 hover:border-zinc-500"}`}>
                  <input type="radio" name="billing" value={opt.value} checked={form.billing_preference === opt.value}
                    onChange={() => set("billing_preference", opt.value)} className="mt-0.5 accent-purple-500" />
                  <div>
                    <p className="font-bold text-sm">{opt.label}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black py-4 rounded-full text-lg transition-colors">
            {submitting ? "Setting up…" : form.billing_preference === "auto_charge" ? "Continue to Card Setup →" : "Create Account →"}
          </button>
          <p className="text-zinc-600 text-xs text-center">Powered by Stripe · Accounts billed every Friday</p>
        </div>
      </div>
    </main>
  );
}
