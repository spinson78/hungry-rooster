import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { message, password } = await req.json();

  if (password !== "fredapproves") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json({ error: "Twilio credentials not configured" }, { status: 500 });
  }

  // Fetch active subscribers
  const { data: subscribers, error: dbError } = await supabase
    .from("sms_subscribers")
    .select("phone, name")
    .eq("active", true);

  if (dbError || !subscribers) {
    return NextResponse.json({ error: "Failed to load subscribers" }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  for (const sub of subscribers) {
    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: sub.phone,
            From: fromNumber,
            Body: message,
          }).toString(),
        }
      );

      if (res.ok) {
        sent++;
      } else {
        const err = await res.json();
        failed++;
        errors.push(`${sub.phone}: ${err.message}`);
      }
    } catch {
      failed++;
      errors.push(`${sub.phone}: network error`);
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    failed,
    total: subscribers.length,
    errors: errors.slice(0, 5),
  });
}
