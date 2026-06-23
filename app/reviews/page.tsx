"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import NavBar from "../components/NavBar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  body: string;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
};

function Stars({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "text-3xl" : size === "sm" ? "text-sm" : "text-xl";
  return (
    <span className={sz + " tracking-tight"}>
      <span className="text-yellow-400">{"★".repeat(rating)}</span>
      <span className="text-zinc-700">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function StarBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-zinc-400 text-sm w-12 shrink-0">{label}</span>
      <div className="flex-1 bg-zinc-800 rounded-full h-2">
        <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: pct + "%" }} />
      </div>
      <span className="text-zinc-500 text-xs w-6 text-right">{count}</span>
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("reviews")
      .select("id, customer_name, rating, body, admin_response, responded_at, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setReviews(data);
        setLoading(false);
      });
  }, []);

  const total = reviews.length;
  const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const countFor = (n: number) => reviews.filter(r => r.rating === n).length;

  return (
    <main className="bg-black text-white min-h-screen">
      <NavBar />

      {/* HERO */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-10">
        <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-3 text-center">The Hungry Rooster</p>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-center mb-10">What People Are Saying</h1>

        {!loading && total > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 mb-12">
            {/* Overall score */}
            <div className="text-center shrink-0">
              <p className="text-7xl font-black text-yellow-400 leading-none">{avg.toFixed(1)}</p>
              <Stars rating={Math.round(avg)} size="lg" />
              <p className="text-zinc-500 text-sm mt-2">{total} review{total !== 1 ? "s" : ""}</p>
            </div>
            {/* Star breakdown */}
            <div className="flex-1 w-full space-y-2">
              {[5, 4, 3, 2, 1].map(n => (
                <StarBar key={n} label={n + " ★"} count={countFor(n)} total={total} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* REVIEWS GRID */}
      <section className="max-w-4xl mx-auto px-6 pb-10">
        {loading && (
          <div className="text-center py-20 text-zinc-600">Loading reviews...</div>
        )}

        {!loading && total === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🐓</p>
            <p className="text-zinc-500 text-lg font-black">No reviews yet — be the first!</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          {reviews.map(review => (
            <div key={review.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-black text-white">{review.customer_name}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">
                    {new Date(review.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <Stars rating={review.rating} size="sm" />
              </div>

              {/* Review text */}
              <p className="text-zinc-300 text-sm leading-relaxed">&ldquo;{review.body}&rdquo;</p>

              {/* Owner response */}
              {review.admin_response && (
                <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 mt-1">
                  <p className="text-teal-400 font-black text-xs uppercase tracking-widest mb-1">Response from The Hungry Rooster</p>
                  <p className="text-zinc-300 text-sm leading-relaxed">{review.admin_response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="border-t border-zinc-800 pt-16">
          <p className="text-2xl font-black mb-2">Ordered from us recently?</p>
          <p className="text-zinc-400 mb-8">We read every review — good or bad. Fred demands the feedback.</p>
          <a
            href="/review"
            className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-black px-10 py-4 rounded-full text-lg transition-colors"
          >
            Leave a Review
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 px-6 py-10 text-center">
        <p className="text-zinc-600 text-xs">Food that happens to be kosher. Fred Approved.</p>
      </footer>
    </main>
  );
}
