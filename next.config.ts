import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,
  experimental: { serverActions: { bodySizeLimit: '12mb' } },
};

export default nextConfig;
