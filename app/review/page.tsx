"use client";
import { useState } from "react";
import NavBar from "../components/NavBar";

function StarPicker({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={"text-5xl transition-colors " + (star <= (hovered || rating) ? "text-yellow-400" : "text-zinc-700 hover:text-yellow-400/50")}
          aria-label={star + " star" + (star !== 1 ? "s" : "")}
        >
          ★
        </button>
      ))}
    </div>
  );
}

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export default function ReviewPage() {
  const [rating, setRating] = useState(0);
  const [form, setForm] = useState({ customerName: "", customerEmail: "", body: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedRating, setSubmittedRating] = useState(0);

  const GOOGLE_REVIEW_URL = "https://g.page/r/CelZGPN-7w0SEBE/review";

  const handleSubmit = async () => {
    setError("");
    if (!rating) { setError("Please select a star rating."); return; }
    if (!form.customerName.trim()) { setError("Please enter your name."); return; }
    if (!form.body.trim()) { setError("Please write your review."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/submit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, rating }),
      });
      const data = await res.json();
      if (data.success) { setSubmitted(true); setSubmittedRating(rating); }
      else setError(data.error || "Something went wrong.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="bg-black text-white min-h-screen">
        <NavBar />
        <div className="max-w-lg mx-auto px-6 py-32 text-center">
          <img src="/fred%20thumbs%20up.png" alt="Fred gives a thumbs up" className="w-40 h-40 object-contain mx-auto mb-6" />
          <h1 className="text-4xl font-black mb-4">Fred says thank you!</h1>
          <p className="text-zinc-400 text-lg mb-2">Your review has been received.</p>
          <p className="text-zinc-500 text-sm mb-8">We read every single one. It means the world to us.</p>
          {submittedRating >= 4 && (
            <div className="bg-zinc-900 border border-yellow-400/30 rounded-2xl p-6 mb-8 text-left">
              <p className="text-yellow-400 font-black text-sm uppercase tracking-widest mb-2">One more thing 🙏</p>
              <p className="text-zinc-300 text-sm mb-4 leading-relaxed">Would you mind sharing that on Google too? It helps more people in Dallas find us and takes about 30 seconds.</p>
              <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer" className="block bg-yellow-400 hover:bg-yellow-300 text-black font-black px-6 py-3 rounded-full text-sm text-center transition-colors">
                Post on Google →
              </a>
            </div>
          )}
          <a href="/" className="bg-zinc-800 hover:bg-zinc-700 text-white font-black px-8 py-4 rounded-full text-lg transition-colors">
            Back to Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-black text-white min-h-screen">
      <NavBar />

      <section className="max-w-xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center mb-10">
          <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-3">The Hungry Rooster</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Leave a Review</h1>
          <p className="text-zinc-400 text-lg">We love hearing from you — good, great, or otherwise.</p>
        </div>

        <div className="space-y-6">
          {/* Star rating */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-4">Your Rating</label>
            <StarPicker rating={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="text-yellow-400 font-black text-sm mt-3 uppercase tracking-wide">{STAR_LABELS[rating]}</p>
            )}
          </div>

          {/* Name + Email */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-2">Your Name *</label>
              <input
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder="Jane Smith"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-2">
                Email <span className="text-zinc-600 font-normal normal-case tracking-normal">(optional — only used if we need to follow up)</span>
              </label>
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                placeholder="jane@email.com"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          {/* Review body */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-2">Your Review *</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={5}
              placeholder="Tell us what you ordered, what you loved, what we can improve..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400 resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-4 rounded-full text-lg transition-colors"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </section>
    </main>
  );
}
