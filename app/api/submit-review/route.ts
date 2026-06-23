import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Submit review error:", err);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
