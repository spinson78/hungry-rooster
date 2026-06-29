import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Online | Kosher Food Delivery & Pickup Dallas",
  description: "Order kosher food online from The Hungry Rooster — chicken sandwiches, wraps, salads, and more. Delivery and pickup in Dallas, TX. Fresh, scratch-made, chef-driven.",
  alternates: { canonical: "/menu" },
  openGraph: {
    title: "Online Menu | Kosher Food Delivery & Pickup in Dallas",
    description: "Order kosher chicken sandwiches, wraps, salads, and more for delivery or pickup in Dallas, TX. Scratch-made by The Hungry Rooster.",
    url: "https://thehungryroostertx.com/menu",
  },
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
