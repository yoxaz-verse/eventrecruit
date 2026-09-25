import type { MetadataRoute } from "next";
import { getPublicSitemapEvents } from "@/lib/public-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const events = await getPublicSitemapEvents();
  return [
    { url: origin, changeFrequency: "daily", priority: 1 },
    { url: `${origin}/events`, changeFrequency: "hourly", priority: 0.9 },
    ...events.map((event) => ({ url: `${origin}/events/${event.source === "organizer" ? "" : "exhibitor/"}${event.id}`, lastModified: event.updatedAt, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
