import { getCurrentAccount } from "@/lib/auth";
import { INDIA_BOUNDS, normalizePhotonCollection } from "@/lib/location";

const photonBaseUrl = process.env.PHOTON_BASE_URL ?? "https://photon.komoot.io";

export async function GET(request: Request) {
  if (!await getCurrentAccount()) return Response.json({ error: "Authentication required." }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 3 || query.length > 160) return Response.json({ error: "Enter at least 3 characters." }, { status: 400 });
  const url = new URL("/api", photonBaseUrl);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "10");
  url.searchParams.set("lang", "en");
  url.searchParams.set("bbox", `${INDIA_BOUNDS.west},${INDIA_BOUNDS.south},${INDIA_BOUNDS.east},${INDIA_BOUNDS.north}`);
  try {
    const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "exporb-location-picker/1.0" }, next: { revalidate: 300 }, signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error("upstream");
    return Response.json({ results: normalizePhotonCollection(await response.json()) });
  } catch {
    return Response.json({ error: "Location search is temporarily unavailable." }, { status: 502 });
  }
}
