export type CatalogSelection = { kind: "organizer" | "exhibitor"; id: string };

export function parseCatalogSelection(value: string): CatalogSelection | null {
  const match = /^(organizer|exhibitor):([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/.exec(value);
  return match ? { kind: match[1] as CatalogSelection["kind"], id: match[2] } : null;
}

export function isSelectableCatalogEvent(event: { status: string; starts_at: string | null; ends_at: string | null }, kind: CatalogSelection["kind"], today: string) {
  return event.status === (kind === "organizer" ? "published" : "approved") && Boolean(event.starts_at && event.ends_at && event.ends_at >= today);
}
