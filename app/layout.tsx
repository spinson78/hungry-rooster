import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "The Hungry Rooster | Kosher Kitchen & Catering · Dallas, TX",
    template: "%s | The Hungry Rooster",
  },
  description: "Dallas's premier kosher kitchen and catering company. Online ordering for delivery & pickup, weekly dinner drops, Shabbat meals, bakery, and full-service kosher catering.",
  keywords: ["kosher food Dallas", "kosher catering Dallas", "kosher delivery Dallas", "kosher restaurant Dallas", "Shabbat meals Dallas", "kosher meal delivery Texas", "Jewish catering Dallas"],
  authors: [{ name: "The Hungry Rooster" }],
  creator: "The Hungry Rooster",
  metadataBase: new URL("https://thehungryroostertx.com"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://thehungryroostertx.com",
    siteName: "The Hungry Rooster",
    title: "The Hungry Rooster | Kosher Kitchen & Catering · Dallas, TX",
    description: "Dallas's premier kosher kitchen and catering company. Online ordering, weekly dinner drops, Shabbat meals, bakery, and full-service kosher catering.",
    images: [{ url: "/THR%20hor%20logo%20final.png", width: 1200, height: 630, alt: "The Hungry Rooster" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Hungry Rooster | Kosher Kitchen & Catering · Dallas, TX",
    description: "Dallas's premier kosher kitchen and catering company.",
    images: ["/THR%20hor%20logo%20final.png"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
