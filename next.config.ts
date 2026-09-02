import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
    staleTimes: {
      dynamic: 300,
      static: 300,
    },
  },
};

export default nextConfig;
