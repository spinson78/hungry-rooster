import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, source } = body;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Upsert so duplicate submissions don't error
  const { error } = await supabase.from("email_subscribers").upsert(
    { email: email.toLowerCase().trim(), source: source || "website", subscribed_at: new Date().toISOString() },
    { onConflict: "email", ignoreDuplicates: true }
  );

  if (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  // Also add to Resend audience if configured
  if (process.env.RESEND_AUDIENCE_ID) {
    await fetch(`https://api.resend.com/audiences/${process.env.RESEND_AUDIENCE_ID}/contacts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.toLowerCase().trim(), unsubscribed: false }),
    });
  }

  return NextResponse.json({ success: true });
}
