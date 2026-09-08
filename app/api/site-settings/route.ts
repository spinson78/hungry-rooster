import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET() {
  const db = supabase();
  const { data } = await db.from("site_settings").select("key,value");
  const settings: Record<string, unknown> = {};
  for (const row of data || []) settings[row.key] = row.value;
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const { key, value } = await req.json();
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
  const db = supabase();
  await db.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() });
  return NextResponse.json({ success: true });
}
