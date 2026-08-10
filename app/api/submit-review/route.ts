import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ← Paste your GBP "Get more reviews" link here once you have it
const GOOGLE_REVIEW_URL = "https://g.page/r/CelZGPN-7w0SEBE/review";

export async function POST(req: NextRequest) {
  try {
    const { customerName, customerEmail, rating, body } = await req.json();

    if (!customerName?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!body?.trim()) return NextResponse.json({ error: "Review text is required" }, { status: 400 });
    if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: "Please select a star rating" }, { status: 400 });

    const { error } = await supabase.from("reviews").insert({
      customer_name: customerName.trim(),
      customer_email: customerEmail?.trim() || null,
      rating,
      body: body.trim(),
      is_published: false,
    });

    if (error) throw error;

    // Send Google review nudge email for 4-5 star reviews
    if (rating >= 4 && customerEmail?.trim()) {
      const stars = "★".repeat(rating);
      const htmlBody = `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 40px 32px; border-radius: 12px;">
          <img src="https://thehungryroostertx.com/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" style="height: 44px; margin-bottom: 32px;" />

          <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; margin-bottom: 8px;">Thank you, ${customerName.trim()}! ${stars}</h1>
          <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            We loved reading your review — it genuinely means the world to us. If you have 30 seconds, sharing it on Google helps more people in Dallas find us.
          </p>

          <a href="${GOOGLE_REVIEW_URL}" style="display: block; background: #facc15; color: #000000; font-weight: 900; font-size: 18px; text-align: center; padding: 18px 32px; border-radius: 50px; text-decoration: none; margin-bottom: 16px;">
            Post it on Google too →
          </a>
          <p style="color: #52525b; font-size: 12px; text-align: center; margin-bottom: 32px;">Takes about 30 seconds. Every review helps us reach more people.</p>

          <p style="color: #3f3f46; font-size: 12px; text-align: center;">The Hungry Rooster · Dallas, TX · <a href="https://thehungryroostertx.com" style="color: #3f3f46;">thehungryroostertx.com</a></p>
        </div>
      `;

      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "The Hungry Rooster <chef@thehungryroostertx.com>",
            to: [customerEmail.trim()],
            subject: `Thank you for the ${rating}-star review, ${customerName.trim().split(" ")[0]}!`,
            html: htmlBody,
          }),
        });
      } catch (emailErr) {
        console.error("Google nudge email failed:", emailErr);
        // Non-fatal — review was saved successfully
      }
    }

    return NextResponse.json({ success: true, rating });
  } catch (err) {
    console.error("Submit review error:", err);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
