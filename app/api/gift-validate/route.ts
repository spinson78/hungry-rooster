import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/gift-validate?code=THR-XXXX  — check balance
export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get("code")?.toUpperCase().trim();
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  const { data, error } = await supabase
    .from("gift_cards")
    .select("id, code, balance_cents, status, recipient_name")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ valid: false, message: "Gift card not found." });
  if (data.status !== "active") return NextResponse.json({ valid: false, message: "This gift card has already been used." });
  if (data.balance_cents <= 0) return NextResponse.json({ valid: false, message: "This gift card has no remaining balance." });

  return NextResponse.json({
    valid: true,
    code: data.code,
    balance: (data.balance_cents / 100).toFixed(2),
    balance_cents: data.balance_cents,
    recipient_name: data.recipient_name,
  });
}

// POST /api/gift-validate — redeem (deduct) against an order
export async function POST(req: NextRequest) {
  try {
    const { code, deductCents } = await req.json();
    const cleanCode = (code || "").toUpperCase().trim();
    if (!cleanCode || !deductCents) return NextResponse.json({ error: "Code and amount required" }, { status: 400 });

    const { data, error } = await supabase
      .from("gift_cards")
      .select("id, balance_cents, status")
      .eq("code", cleanCode)
      .maybeSingle();

    if (error || !data) return NextResponse.json({ success: false, message: "Gift card not found." });
    if (data.status !== "active") return NextResponse.json({ success: false, message: "Gift card already used." });
    if (data.balance_cents <= 0) return NextResponse.json({ success: false, message: "No remaining balance." });

    const actualDeduct = Math.min(deductCents, data.balance_cents);
    const newBalance = data.balance_cents - actualDeduct;

    await supabase
      .from("gift_cards")
      .update({
        balance_cents: newBalance,
        status: newBalance <= 0 ? "depleted" : "active",
      })
      .eq("id", data.id);

    return NextResponse.json({
      success: true,
      deducted_cents: actualDeduct,
      remaining_cents: newBalance,
      deducted: (actualDeduct / 100).toFixed(2),
      remaining: (newBalance / 100).toFixed(2),
    });
  } catch (err) {
    console.error("Gift redeem error:", err);
    return NextResponse.json({ error: "Failed to redeem gift card" }, { status: 500 });
  }
}
