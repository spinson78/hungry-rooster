"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Review = {
  id: string;
  customer_name: string;
  customer_email: string | null;
  rating: number;
  body: string;
  is_published: boolean;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400 text-lg tracking-tight">
      {"★".repeat(rating)}
      <span className="text-zinc-700">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function ReviewsTab() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setReviews(data);
      const init: Record<string, string> = {};
      data.forEach((r: Review) => { init[r.id] = r.admin_response || ""; });
      setResponses(init);
    }
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const togglePublished = async (review: Review) => {
    const { error } = await supabase
      .from("reviews")
      .update({ is_published: !review.is_published })
      .eq("id", review.id);
    if (!error) setReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_published: !r.is_published } : r));
  };

  const saveResponse = async (review: Review) => {
    setSaving(review.id);
    const responseText = responses[review.id] || "";
    const { error } = await supabase
      .from("reviews")
      .update({
        admin_response: responseText || null,
        responded_at: responseText ? new Date().toISOString() : null,
      })
      .eq("id", review.id);
    if (!error) {
      setReviews(prev => prev.map(r =>
        r.id === review.id
          ? { ...r, admin_response: responseText || null, responded_at: responseText ? new Date().toISOString() : null }
          : r
      ));
    }
    setSaving(null);
  };

  const published = reviews.filter(r => r.is_published);
  const pending = reviews.filter(r => !r.is_published);

  if (loading) return <div className="text-zinc-500 text-sm py-10 text-center">Loading reviews...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black mb-1">Reviews</h2>
          <p className="text-zinc-500 text-sm">{reviews.length} total · {published.length} published · {pending.length} pending</p>
        </div>
        <a
          href="/review"
          target="_blank"
          className="text-xs border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white px-4 py-2 rounded-full transition-colors font-semibold"
        >
          View Review Page ↗
        </a>
      </div>

      {reviews.length === 0 && (
        <div className="text-center py-20 text-zinc-600">
          <p className="text-4xl mb-4">⭐</p>
          <p className="font-black text-lg text-zinc-500">No reviews yet</p>
          <p className="text-sm mt-1">Share your review page link to start collecting feedback.</p>
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className={"bg-zinc-900 border rounded-2xl p-6 transition-colors " + (review.is_published ? "border-teal-800" : "border-zinc-800")}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Stars rating={review.rating} />
                  <span className="font-black text-white">{review.customer_name}</span>
                  {review.is_published && (
                    <span className="text-xs bg-teal-500/20 text-teal-400 font-bold px-2 py-0.5 rounded-full">Published</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-zinc-500 text-xs">{new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  {review.customer_email && (
                    <p className="text-zinc-600 text-xs">{review.customer_email}</p>
                  )}
                </div>
              </div>

              {/* Publish toggle */}
              <button
                type="button"
                onClick={() => togglePublished(review)}
                className={"shrink-0 px-4 py-2 rounded-full font-black text-xs transition-colors " +
                  (review.is_published
                    ? "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
                    : "bg-teal-500 text-black hover:bg-teal-400"
                  )
                }
              >
                {review.is_published ? "Unpublish" : "Post to Site"}
              </button>
            </div>

            {/* Review body */}
            <p className="text-zinc-300 text-sm leading-relaxed mb-4 bg-zinc-800/50 rounded-xl p-4">
              &ldquo;{review.body}&rdquo;
            </p>

            {/* Admin response */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-2">
                {review.admin_response ? "Your Response" : "Reply to this Review"}
              </label>
              <textarea
                value={responses[review.id] ?? ""}
                onChange={(e) => setResponses(prev => ({ ...prev, [review.id]: e.target.value }))}
                rows={3}
                placeholder="Write a response... It will appear publicly below the review when posted."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-teal-400 resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                {review.responded_at && (
                  <p className="text-zinc-600 text-xs">Last saved {new Date(review.responded_at).toLocaleDateString()}</p>
                )}
                <button
                  type="button"
                  onClick={() => saveResponse(review)}
                  disabled={saving === review.id}
                  className="ml-auto bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white font-black text-xs px-5 py-2 rounded-full transition-colors"
                >
                  {saving === review.id ? "Saving..." : "Save Response"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
