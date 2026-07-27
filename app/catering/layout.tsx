import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kosher Catering Dallas | Full-Service Event Catering",
  description: "Full-service kosher catering in Dallas, TX. Corporate events, weddings, bar and bat mitzvahs, Shabbat dinners, and more. Packages from 10–200+ guests. Request a quote online.",
  alternates: { canonical: "/catering" },
  openGraph: {
    title: "Kosher Catering Dallas | The Hungry Rooster",
    description: "Full-service kosher catering for corporate events, weddings, bar and bat mitzvahs in Dallas, TX. From 10 to 200+ guests.",
    url: "https://www.thehungryroostertx.com/catering",
  },
};

export default function CateringLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
