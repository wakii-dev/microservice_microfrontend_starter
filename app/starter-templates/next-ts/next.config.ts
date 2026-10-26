import type { NextConfig } from "next";

// Tailwind v4 chạy qua Turbopack loader; cacheComponents/partialPrefetching là
// mặc định của create-next-app 16 (bộ config đã build-xanh ở spike Next).
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
