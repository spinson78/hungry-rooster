import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { summary } = await req.json();

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    const to = "+19452157907";

    if (!accountSid || !authToken || !from) {
      return NextResponse.json({ error: "Twilio not configured" }, { status: 500 });
    }

    const body = `🐓 Hungry Rooster SEO Report:\n\n${summary}\n\nFull report: thehungryroostertx.com/admin`;

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ From: from, To: to, Body: body }).toString(),
      }
    );

    if (!res.ok) throw new Error(await res.text());
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SEO SMS error:", err);
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}
