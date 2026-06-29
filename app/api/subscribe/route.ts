import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, phone, name, source } = body;

  if (!email && !phone) {
    return NextResponse.json({ error: "Email or phone required" }, { status: 400 });
  }
  if (email && !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Save email subscriber
  if (email) {
    const { error } = await supabase.from("email_subscribers").upsert(
      { email: email.toLowerCase().trim(), source: source || "website", subscribed_at: new Date().toISOString() },
      { onConflict: "email", ignoreDuplicates: true }
    );
    if (error) console.error("Email subscribe error:", error);

    // Sync to Resend audience
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
  }

  // Save SMS subscriber
  if (phone) {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length >= 10) {
      const { error } = await supabase.from("sms_subscribers").upsert(
        {
          phone: cleaned,
          name: name?.trim() || "",
          source: source || "website",
          opted_in_at: new Date().toISOString(),
          active: true,
        },
        { onConflict: "phone", ignoreDuplicates: true }
      );
      if (error) console.error("SMS subscribe error:", error);
    }
  }

  return NextResponse.json({ success: true });
}
