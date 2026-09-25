import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

const nextConfig: NextConfig = {
  typedRoutes: false,
  experimental: { serverActions: { bodySizeLimit: '12mb' } },
  async headers() {
    const securityHeaders = [
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
    ];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
      { source: "/talent-sw.js", headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }] },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
