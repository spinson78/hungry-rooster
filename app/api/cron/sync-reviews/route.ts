import { NextRequest, NextResponse } from "next/server";
// NextRequest used for type annotation on _req
import { createClient } from "@supabase/supabase-js";

export async function GET(_req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY not set" }, { status: 500 });
  }

  // Hardcoded Place ID for The Hungry Rooster (1499 Regal Row, Dallas TX)
  const placeId = "ChIJm6ckg0qdToYR6VkY837vDRI";

  // Fetch place details with reviews
  const detailsRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}&reviews_sort=newest`
  );
  const detailsData = await detailsRes.json();
  const googleReviews: Array<{
    author_name: string;
    author_url: string;
    rating: number;
    text: string;
    time: number;
    profile_photo_url?: string;
  }> = detailsData.result?.reviews || [];

  if (googleReviews.length === 0) {
    return NextResponse.json({ synced: 0, message: "No reviews returned from Google" });
  }

  let synced = 0;

  for (const gr of googleReviews) {
    // Skip reviews with no text
    if (!gr.text?.trim()) continue;

    // Use author_url as a stable unique ID for this reviewer's review
    const googleReviewId = gr.author_url || `${gr.author_name}_${gr.time}`;

    const { error } = await supabase
      .from("reviews")
      .upsert(
        {
          customer_name:    gr.author_name,
          rating:           gr.rating,
          body:             gr.text.trim(),
          created_at:       new Date(gr.time * 1000).toISOString(),
          is_published:     true,
          source:           "google",
          google_review_id: googleReviewId,
        },
        { onConflict: "google_review_id", ignoreDuplicates: false }
      );

    if (error) {
      console.error("sync-reviews: upsert error for", gr.author_name, error);
    } else {
      synced++;
    }
  }

  console.log(`sync-reviews: synced ${synced} of ${googleReviews.length} Google reviews`);
  return NextResponse.json({
    synced,
    total_google_reviews: detailsData.result?.user_ratings_total,
    overall_rating: detailsData.result?.rating,
  });
}
