import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { subject, previewText, htmlBody, password } = body;

  if (password !== "fredapproves") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!subject || !htmlBody) {
    return NextResponse.json({ error: "Subject and body required" }, { status: 400 });
  }

  // Fetch all subscribers
  const { data: subscribers, error } = await supabase
    .from("email_subscribers")
    .select("email");

  if (error || !subscribers) {
    return NextResponse.json({ error: "Could not fetch subscribers" }, { status: 500 });
  }

  const emails = subscribers.map((s) => s.email);
  const total = emails.length;

  // Build the full HTML email
  const fullHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 32px; border-radius: 12px;">
      <img src="https://hungry-rooster.vercel.app/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" style="height: 48px; margin-bottom: 28px;" />
      <div style="color: #ffffff; font-size: 15px; line-height: 1.7;">
        ${htmlBody}
      </div>
      <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;" />
      <p style="color: #3f3f46; font-size: 12px; text-align: center; margin: 0;">
        The Hungry Rooster · 1499 Regal Row, Suite 206, Dallas TX<br/>
        <a href="https://hungry-rooster.vercel.app" style="color: #2dd4bf; text-decoration: none;">hungry-rooster.vercel.app</a>
      </p>
    </div>
  `;

  // Resend batch API — max 100 per call
  const BATCH_SIZE = 100;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE);
    const batchPayload = chunk.map((email) => ({
      from: "The Hungry Rooster <onboarding@resend.dev>",
      to: [email],
      subject,
      html: fullHtml,
      headers: previewText ? { "X-PM-Message-Preview": previewText } : {},
    }));

    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batchPayload),
    });

    if (res.ok) {
      sent += chunk.length;
    } else {
      const err = await res.text();
      console.error(`Batch ${i / BATCH_SIZE + 1} failed:`, err);
      failed += chunk.length;
    }
  }

  return NextResponse.json({ success: true, total, sent, failed });
}
