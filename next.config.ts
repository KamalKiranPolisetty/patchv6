import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve static files from knowledge_base
  async rewrites() {
    return [
      {
        source: "/knowledge_base/images/:path*",
        destination: "/api/kb-images/:path*",
      },
    ];
  },
};

export default nextConfig;
