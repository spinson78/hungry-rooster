"use client";
import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import { supabase } from "@/lib/supabase";

type Location = {
  id: string;
  name: string;
  address: string;
  slug: string;
  is_active: boolean;
};

export default function GroupOrdersPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", address: "", notes: "" });

  useEffect(() => {
    supabase.from("group_locations").select("*").then(({ data, error }) => {
      console.log("locations:", data, error);
      if (data) setLocations(data);
    });
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.email || !form.company) return;
    setSubmitting(true);
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_type: "group_inquiry",
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email,
        customer_address: form.address || "TBD",
        special_requests: `Company: ${form.company} · Notes: ${form.notes}`,
        items: [{ name: "Group Order Inquiry", description: form.company }],
        total: 0,
      }),
    });
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <main className="bg-black text-white min-h-screen">
      <NavBar />

      {/* HERO */}
      <section className="px-6 py-20 max-w-5xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <img src="/group%20orders%20fred.png" alt="Group Orders Fred" className="h-48 w-auto" />
        </div>
        <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-4">Group Orders</p>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
          Lunch for the whole flock.<br />
          <span className="text-yellow-400">No Uber fees. Ever.</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-10">
          Each person orders individually from a dedicated menu. We group everything together and deliver flat to your door. No platform fees, no surprises — just great food at a great price.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="#locations"
            className="bg-teal-500 hover:bg-teal-400 text-black font-black px-8 py-4 rounded-full text-lg transition-colors"
          >
            Feed My Flock
          </a>
          <button
            onClick={() => setShowForm(true)}
            className="border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-black px-8 py-4 rounded-full text-lg transition-colors"
          >
            Get Us Our Own Link
          </button>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Share the link", desc: "Your flock gets a dedicated ordering link. Share it with the crew — takes 10 seconds." },
            { step: "02", title: "Everyone orders", desc: "Each person picks what they want from our group menu. $165 minimum per delivery." },
            { step: "03", title: "We deliver flat", desc: "One delivery to your door, 2 hours after your cutoff. No Uber, no third-party fees." },
          ].map(item => (
            <div key={item.step} className="text-center">
              <p className="text-teal-400 font-black text-4xl mb-3">{item.step}</p>
              <h3 className="font-black text-lg mb-2">{item.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY US */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: "Zero platform fees", sub: "No Uber Eats, no DoorDash markup" },
            { label: "2-hour delivery", sub: "Order by cutoff, delivered fresh" },
            { label: "Certified Kosher", sub: "Full community approved" },
          ].map(item => (
            <div key={item.label} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 text-center">
              <p className="font-black text-lg">{item.label}</p>
              <p className="text-zinc-400 text-sm">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ACTIVE LOCATIONS */}
      <section id="locations" className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black mb-2">Find your flock</h2>
        <p className="text-zinc-400 mb-8">Click your location and place your order. Fred handles the rest.</p>
        {locations.length === 0 ? (
          <p className="text-zinc-500">No locations set up yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {locations.map(loc => (
              <a
                key={loc.id}
                href={`/group/${loc.slug}`}
                className="bg-zinc-900 border border-zinc-700 hover:border-teal-500 rounded-2xl p-6 transition-colors block"
              >
                <p className="font-black text-lg mb-1">{loc.name}</p>
                <p className="text-zinc-400 text-sm mb-4">{loc.address}</p>
                <span className="text-teal-400 font-bold text-sm">Place your order →</span>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* INTERESTED? CTA */}
      <section className="px-6 py-16 max-w-5xl mx-auto border-t border-zinc-800 text-center">
        <h2 className="text-3xl font-black mb-3">Your flock not listed?</h2>
        <p className="text-zinc-400 mb-8 max-w-lg mx-auto">We're roosting at new spots across Dallas. Hit us up and we'll get your crew their own link — fast.</p>
        <button
          onClick={() => setShowForm(true)}
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-10 py-4 rounded-full text-lg transition-colors"
        >
          Set Up Our Link
        </button>
      </section>

      {/* INQUIRY FORM MODAL */}
      {showForm && !submitted && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <button onClick={() => setShowForm(false)} className="float-right text-zinc-500 hover:text-white text-lg">✕</button>
            <h2 className="text-2xl font-black mb-1">Let's Get Your Flock Fed</h2>
            <p className="text-zinc-400 text-sm mb-6">Fill this out and we'll set up your crew's dedicated ordering link within 24 hours.</p>
            <div className="space-y-3">
              <input type="text" placeholder="Your name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 text-sm" />
              <input type="text" placeholder="Company / Organization *" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 text-sm" />
              <input type="tel" placeholder="Phone *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 text-sm" />
              <input type="email" placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 text-sm" />
              <input type="text" placeholder="Flock address (delivery location)" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 text-sm" />
              <textarea placeholder="Anything else we should know? (team size, preferred days...)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 resize-none h-20 text-sm" />
            </div>
            <button onClick={handleSubmit} disabled={submitting} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-full text-lg transition-colors mt-6 disabled:opacity-50">
              {submitting ? "Sending..." : "Let's Talk"}
            </button>
          </div>
        </div>
      )}

      {showForm && submitted && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
                        <h2 className="text-2xl font-black mb-2">We'll be in touch!</h2>
            <p className="text-zinc-400 mb-6">We'll reach out within 24 hours and get your flock their own link. Fred can't wait.</p>
            <button onClick={() => { setShowForm(false); setSubmitted(false); }} className="bg-teal-500 text-black font-black px-8 py-3 rounded-full">Done</button>
          </div>
        </div>
      )}

      <footer className="border-t border-zinc-800 px-6 py-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-10 w-auto mb-2" />
            <p className="text-zinc-500 text-sm">1499 Regal Row, Suite 206, Dallas, TX 75247</p>
          </div>
          <p className="text-zinc-600 text-xs">Food that happens to be kosher. Fred Approved.</p>
        </div>
      </footer>
    </main>
  );
}
