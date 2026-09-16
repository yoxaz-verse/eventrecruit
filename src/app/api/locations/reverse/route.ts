import { getCurrentAccount } from "@/lib/auth";
import { isIndiaCoordinate, normalizePhotonCollection } from "@/lib/location";

const photonBaseUrl = process.env.PHOTON_BASE_URL ?? "https://photon.komoot.io";

export async function GET(request: Request) {
  if (!await getCurrentAccount()) return Response.json({ error: "Authentication required." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const latitude = Number(params.get("lat"));
  const longitude = Number(params.get("lon"));
  if (!isIndiaCoordinate(latitude, longitude)) return Response.json({ error: "Choose a location within India." }, { status: 400 });
  const url = new URL("/reverse", photonBaseUrl);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("limit", "1");
  url.searchParams.set("lang", "en");
  try {
    const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "exporb-location-picker/1.0" }, next: { revalidate: 300 }, signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error("upstream");
    const result = normalizePhotonCollection(await response.json(), 1)[0];
    if (!result) return Response.json({ error: "No Indian venue was found at that point." }, { status: 404 });
    return Response.json({ result });
  } catch {
    return Response.json({ error: "Unable to identify that location right now." }, { status: 502 });
  }
}
