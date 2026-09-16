export const INDIA_BOUNDS = {
  south: 6,
  west: 68,
  north: 37.5,
  east: 97.5,
} as const;

export type LocationResult = {
  id: string;
  venue: string;
  city: string;
  label: string;
  latitude: number;
  longitude: number;
  countryCode: "IN";
};

type PhotonFeature = {
  geometry?: { type?: string; coordinates?: unknown[] };
  properties?: Record<string, unknown>;
};

export function isIndiaCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= INDIA_BOUNDS.south && latitude <= INDIA_BOUNDS.north
    && longitude >= INDIA_BOUNDS.west && longitude <= INDIA_BOUNDS.east;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

export function normalizePhotonFeature(feature: PhotonFeature): LocationResult | null {
  const coordinates = feature.geometry?.coordinates;
  const properties = feature.properties ?? {};
  const longitude = Number(coordinates?.[0]);
  const latitude = Number(coordinates?.[1]);
  const countryCode = text(properties.countrycode).toUpperCase();
  if (feature.geometry?.type !== "Point" || countryCode !== "IN" || !isIndiaCoordinate(latitude, longitude)) return null;

  const venue = text(properties.name) || text(properties.street) || text(properties.district) || text(properties.city);
  const city = text(properties.city) || text(properties.town) || text(properties.village) || text(properties.county) || text(properties.state);
  const parts = [
    text(properties.name),
    [text(properties.housenumber), text(properties.street)].filter(Boolean).join(" "),
    text(properties.district),
    city,
    text(properties.state),
    text(properties.country),
  ].filter((part, index, all) => part && all.indexOf(part) === index);
  if (!venue || !city || !parts.length) return null;
  const osmType = text(properties.osm_type);
  const osmId = text(properties.osm_id);
  return {
    id: osmType && osmId ? `${osmType}:${osmId}` : `${latitude}:${longitude}`,
    venue,
    city,
    label: parts.join(", "),
    latitude,
    longitude,
    countryCode: "IN",
  };
}

export function normalizePhotonCollection(payload: unknown, limit = 5): LocationResult[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { features?: unknown }).features)) return [];
  return ((payload as { features: PhotonFeature[] }).features)
    .map(normalizePhotonFeature)
    .filter((result): result is LocationResult => Boolean(result))
    .slice(0, limit);
}

export function parseLockedLocation(data: FormData) {
  const latitude = Number(String(data.get("latitude") ?? ""));
  const longitude = Number(String(data.get("longitude") ?? ""));
  const locationLabel = String(data.get("location_label") ?? "").trim();
  const countryCode = String(data.get("location_country_code") ?? "").trim().toUpperCase();
  const locked = String(data.get("location_locked") ?? "") === "1";
  const valid = locked && countryCode === "IN" && locationLabel.length > 0 && locationLabel.length <= 500 && isIndiaCoordinate(latitude, longitude);
  return { valid, locked, latitude, longitude, locationLabel, countryCode };
}
