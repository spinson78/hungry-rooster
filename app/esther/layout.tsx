import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fred's Fixins' | Fresh-Baked Kosher Bakery · Dallas",
  description: "Fresh-baked kosher challahs, babka, cakes, and pastries delivered every Friday in Dallas. Order from Fred's Fixins' — The Hungry Rooster's weekly bakery drop.",
  alternates: { canonical: "/esther" },
  openGraph: {
    title: "Fred's Fixins' | Fresh-Baked Kosher Bakery · Dallas",
    description: "Weekly kosher bakery drop — challahs, babka, cakes, and pastries baked fresh and delivered every Friday in Dallas, TX.",
    url: "https://www.thehungryroostertx.com/esther",
  },
};

export default function EstherLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
