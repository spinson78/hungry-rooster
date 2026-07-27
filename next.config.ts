import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "thehungryroostertx.com" }],
        destination: "https://www.thehungryroostertx.com/:path*",
        permanent: true, // 301 — tells Google which version is canonical
      },
    ];
  },
};

export default nextConfig;
