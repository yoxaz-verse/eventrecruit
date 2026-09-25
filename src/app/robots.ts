import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/events", "/events/"], disallow: ["/dashboard/", "/api/", "/client-review/", "/staff-invite/", "/login", "/signup", "/onboarding", "/verify-otp", "/reset-password", "/forgot-password"] },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/sitemap.xml`,
  };
}
