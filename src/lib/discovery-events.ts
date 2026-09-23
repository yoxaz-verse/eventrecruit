export type DiscoveryEventSource = "exhibitor" | "organizer";

export type DiscoveryEvent<T, S extends DiscoveryEventSource> = {
  source: S;
  event: T;
};

type DatedEvent = { starts_at: string | null; title: string };

const chronological = <T extends DatedEvent>(a: T, b: T) =>
  (a.starts_at ?? "").localeCompare(b.starts_at ?? "") || a.title.localeCompare(b.title);

export function rankDiscoveryEvents<E extends DatedEvent, O extends DatedEvent>(
  exhibitorEvents: E[],
  organizerEvents: O[],
): Array<DiscoveryEvent<E, "exhibitor"> | DiscoveryEvent<O, "organizer">> {
  return [
    ...[...exhibitorEvents].sort(chronological).map(event => ({ source: "exhibitor" as const, event })),
    ...[...organizerEvents].sort(chronological).map(event => ({ source: "organizer" as const, event })),
  ];
}
