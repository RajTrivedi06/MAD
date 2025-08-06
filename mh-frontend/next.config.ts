import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable client-side routing for TanStack Router
  trailingSlash: false,
  async rewrites() {
    return [
      // Handle all routes through the main page for client-side routing
      {
        source: "/(.*)",
        destination: "/",
      },
    ];
  },
};

export default nextConfig;
