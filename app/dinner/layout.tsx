import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weekly Dinner Drop | Kosher Family Dinner Dallas",
  description: "The Hungry Rooster's weekly kosher dinner drop — a chef-driven family-style meal delivered to your door in Dallas. New menu every week. Order before it sells out.",
  alternates: { canonical: "/dinner" },
  openGraph: {
    title: "Weekly Dinner Drop | Kosher Family Dinner in Dallas",
    description: "Weekly chef-driven kosher family dinner delivered in Dallas. New menu every week from The Hungry Rooster. Order before it sells out.",
    url: "https://www.thehungryroostertx.com/dinner",
  },
};

export default function DinnerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
