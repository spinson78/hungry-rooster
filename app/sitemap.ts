import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.thehungryroostertx.com";
  const now = new Date();

  return [
    { url: base,                  lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/menu`,        lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/catering`,    lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/shabbat`,     lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/dinner`,      lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/gift`,        lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/group`,       lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/gallery`,     lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/story`,       lastModified: now, changeFrequency: "yearly",  priority: 0.5 },
    { url: `${base}/reviews`,     lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${base}/review`,      lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
    { url: `${base}/privacy`,     lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
