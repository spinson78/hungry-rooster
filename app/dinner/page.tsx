import { createClient } from "@supabase/supabase-js";
import NavBar from "../components/NavBar";
import DinnerCheckout from "./DinnerCheckout";

export default async function DinnerPage() {
  // Server-side fetch so Googlebot sees real menu content
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const today = new Date().toISOString().split("T")[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 10);
  const futureDateStr = futureDate.toISOString().split("T")[0];

  const { data } = await supabase
    .from("dinner_menus")
    .select("*")
    .gte("date", today)
    .lte("date", futureDateStr)
    .order("date", { ascending: true })
    .limit(3);

  const initialDinners = data || [];

  return (
    <main className="bg-black text-white min-h-screen">
      <NavBar />
      <div className="px-6 py-12 max-w-4xl mx-auto">

        {/* Header — server-rendered so Google sees it */}
        <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-2">Mon · Tue · Thu</p>
        <h1 className="text-4xl font-black mb-2">This Week&apos;s Dinner Drop</h1>
        <p className="text-zinc-400 mb-6">
          Delivered to your door · <span className="text-white font-semibold">3–5 PM</span> · $85 per meal · Menus drop <span className="text-white font-semibold">Sunday at 10 AM</span>
        </p>

        {/* Server-rendered menu summary for SEO */}
        {initialDinners.length > 0 && (
          <p className="sr-only">
            This week&apos;s Dinner Drop features {initialDinners.map(d =>
              `${d.day_of_week}: ${d.protein} with ${d.side1}, ${d.side2}, and ${d.extra}`
            ).join(". ")}. Kosher family-style dinner delivered to your door in Dallas, TX for $85 per meal.
          </p>
        )}

        <DinnerCheckout initialDinners={initialDinners} />
      </div>
    </main>
  );
}
