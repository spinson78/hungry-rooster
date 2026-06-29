import type { Metadata } from "next";
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

export default function ShabbatPage() {
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
        <ShabbatCheckout />
      </div>
    </main>
  );
}
