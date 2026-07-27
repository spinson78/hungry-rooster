import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/kds", "/api/", "/invoice/"],
      },
    ],
    sitemap: "https://www.thehungryroostertx.com/sitemap.xml",
  };
}
