import { createClient } from "@supabase/supabase-js";

/**
 * Returns true if today (America/Chicago) is listed in the site_settings closed_dates array.
 * Used by checkout API routes to honor the Operations Tab "Quick Close" / scheduled closures.
 */
export async function isClosedToday(): Promise<{ closed: boolean; reason?: string }> {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await db
    .from("site_settings")
    .select("value")
    .eq("key", "closed_dates")
    .single();

  if (!data) return { closed: false };

  const closedDates: { date: string; reason: string }[] = data.value || [];

  // Get today as YYYY-MM-DD in Chicago timezone
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === "year")?.value ?? "";
  const m = parts.find(p => p.type === "month")?.value ?? "";
  const d = parts.find(p => p.type === "day")?.value ?? "";
  const today = `${y}-${m}-${d}`;

  const match = closedDates.find(c => c.date === today);
  return match ? { closed: true, reason: match.reason } : { closed: false };
}
