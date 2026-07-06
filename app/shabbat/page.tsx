import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import NavBar from "../components/NavBar";
import ShabbatCheckout from "./ShabbatCheckout";

export const metadata: Metadata = {
  title: "Shabbat Box | Kosher Shabbat Meals Delivered in Dallas",
  description: "Order your weekly Shabbat Box from The Hungry Rooster. Kosher roasted chicken, fresh sides, babka, and salmon delivered every Friday in Dallas, TX. Order by Friday 9AM.",
  alternates: { canonical: "/shabbat" },
  openGraph: {
    title: "Shabbat Box | Kosher Shabbat Meals Delivered in Dallas",
    description: "Weekly kosher Shabbat meals delivered to your door every Friday in Dallas. Roasted chicken, sides, babka, salmon add-ons. Order by Friday 9AM.",
    url: "https://thehungryroostertx.com/shabbat",
  },
};

export default async function ShabbatPage() {
  // Server-side fetch so crawlers see real menu content instead of "Loading..."
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("shabbat_menus")
    .select("*")
    .gte("cutoff_time", now)
    .order("cutoff_time", { ascending: true })
    .limit(1);

  const initialMenu = (data && data.length > 0) ? data[0] : null;
  const initialIsOpen = initialMenu
    ? (initialMenu.is_active && new Date() < new Date(initialMenu.cutoff_time) && initialMenu.quantity_remaining > 0)
    : false;

  return (
    <main className="bg-black text-white min-h-screen">
      <NavBar />
      <div className="px-6 py-12 max-w-2xl mx-auto">
        <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-2">Every Friday · Dallas, TX</p>
        <h1 className="text-4xl font-black mb-2">Shabbat Box</h1>
        <p className="text-zinc-400 mb-10">
          Kosher Shabbat meals delivered to your door every Friday in Dallas.
          Protein, three fresh sides, and optional add-ons like babka, salmon, and dessert.
          Order by Friday 9AM — free delivery on orders $100+.
        </p>
        {initialMenu && (
          <p className="sr-only">
            This week&apos;s Shabbat Box features {initialMenu.protein} with {initialMenu.side1}, {initialMenu.side2}, and {initialMenu.extra}.
            Available in 2-person ($65), 4–6 person ($115), and 10–12 person ($225) sizes.
            Add-ons include salmon, babka, greens, and dessert.
          </p>
        )}
        <ShabbatCheckout initialMenu={initialMenu} initialIsOpen={initialIsOpen} />
      </div>
    </main>
  );
}
