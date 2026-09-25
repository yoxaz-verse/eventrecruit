import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { indiaToday, type OrganizerEvent } from "@/lib/organizer";
import type { EventRole } from "@/lib/types";

export const PUBLIC_CACHE_TAGS = {
  events: "public-events",
  submissions: "public-exhibitor-events",
  participation: "public-event-participation",
  roles: "public-open-roles",
} as const;

export function invalidatePublicData(...tags: Array<(typeof PUBLIC_CACHE_TAGS)[keyof typeof PUBLIC_CACHE_TAGS]>) {
  for (const tag of tags) revalidateTag(tag, "max");
}

export type PublicDataResult<T> = { data: T; available: boolean };

export type ExhibitorPublicEvent = {
  id: string; title: string; description: string | null; city: string; venue: string;
  starts_at: string | null; ends_at: string | null; amenities: string[];
  custom_amenities: string[]; reviewed_at: string | null;
};

export type PublicDirectoryItem =
  | { source: "organizer"; event: OrganizerEvent; companyName: string; participants: string[] }
  | { source: "exhibitor"; event: ExhibitorPublicEvent };

const getCachedPublicDirectory = unstable_cache(
  async (queryText: string, city: string): Promise<PublicDataResult<PublicDirectoryItem[]>> => {
    const db = await createClient();
    if (!db) return { data: [], available: false };
    let organizerQuery = db.from("organizer_events")
      .select("id,title,description,city,venue,starts_at,ends_at,company_id,status,published_at,staffing_needs,booking_url,event_type,venue_setting,requirement_sections,requirement_details,logo_path,amenities,custom_amenities")
      .eq("status", "published").gte("ends_at", indiaToday()).order("starts_at").limit(200);
    let submittedQuery = db.from("exhibitor_event_submissions")
      .select("id,title,description,city,venue,starts_at,ends_at,amenities,custom_amenities,reviewed_at")
      .eq("status", "approved").gte("ends_at", indiaToday()).order("starts_at").limit(200);
    if (city) {
      organizerQuery = organizerQuery.eq("city", city);
      submittedQuery = submittedQuery.eq("city", city);
    }
    const [organizers, companies, submitted, participation] = await Promise.all([
      organizerQuery,
      db.from("organizer_companies").select("id,name").limit(500),
      submittedQuery,
      db.from("exhibitor_event_participation").select("event_id,exhibitors(company_name)").eq("status", "approved").limit(1000),
    ]);
    if (organizers.error || companies.error || submitted.error || participation.error) return { data: [], available: false };
    const companyNames = new Map((companies.data ?? []).map((company) => [company.id, company.name]));
    const participantNames = new Map<string, string[]>();
    for (const row of participation.data ?? []) {
      const exhibitor = Array.isArray(row.exhibitors) ? row.exhibitors[0] : row.exhibitors;
      if (exhibitor?.company_name) participantNames.set(row.event_id, [...(participantNames.get(row.event_id) ?? []), exhibitor.company_name]);
    }
    const needle = queryText.trim().toLowerCase();
    const organizerItems = (organizers.data ?? [])
      .filter((event) => !needle || `${event.title} ${companyNames.get(event.company_id) ?? ""}`.toLowerCase().includes(needle))
      .map((event) => ({ source: "organizer" as const, event: event as OrganizerEvent, companyName: companyNames.get(event.company_id) ?? "Event company", participants: participantNames.get(event.id) ?? [] }));
    const exhibitorItems = (submitted.data ?? [])
      .filter((event) => !needle || event.title.toLowerCase().includes(needle))
      .map((event) => ({ source: "exhibitor" as const, event: { ...event, amenities: event.amenities ?? [], custom_amenities: event.custom_amenities ?? [] } }));
    return { data: [...exhibitorItems, ...organizerItems], available: true };
  },
  ["public-event-directory-v1"],
  { revalidate: 60, tags: [PUBLIC_CACHE_TAGS.events, PUBLIC_CACHE_TAGS.submissions, PUBLIC_CACHE_TAGS.participation] },
);

export function getPublicEventDirectory(filters: { q?: string; city?: string } = {}) {
  return getCachedPublicDirectory((filters.q ?? "").slice(0, 160), (filters.city ?? "").slice(0, 120));
}

const getCachedOpenRoles = unstable_cache(async (): Promise<PublicDataResult<EventRole[]>> => {
  const db = await createClient();
  if (!db) return { data: [], available: false };
  const result = await db.from("staffing_roles")
    .select("id,title,description,headcount,hourly_rate,shift_start,shift_end,work_starts_on,work_ends_on,required_skills,status,events(title,venue,city,map_url,starts_at,exhibitors(company_name),agencies(name))")
    .eq("status", "open").order("created_at", { ascending: false }).limit(100);
  if (result.error) return { data: [], available: false };
  const data: EventRole[] = (result.data ?? []).flatMap((record) => {
    const event = Array.isArray(record.events) ? record.events[0] : record.events;
    if (!event) return [];
    const exhibitor = Array.isArray(event.exhibitors) ? event.exhibitors[0] : event.exhibitors;
    const agency = Array.isArray(event.agencies) ? event.agencies[0] : event.agencies;
    return [{ id: record.id, eventTitle: event.title, company: exhibitor?.company_name, agency: agency?.name, location: `${event.venue}, ${event.city}`, mapUrl: event.map_url ?? undefined, date: `${record.work_starts_on} – ${record.work_ends_on}`, shift: `${record.shift_start} – ${record.shift_end}`, role: record.title, description: record.description ?? undefined, headcount: record.headcount, rate: Number(record.hourly_rate), skills: record.required_skills ?? [], status: "open" as const }];
  });
  return { data, available: true };
}, ["public-open-roles-v1"], { revalidate: 60, tags: [PUBLIC_CACHE_TAGS.roles] });

export const getPublicOpenRoles = () => getCachedOpenRoles();

export async function getPublicSitemapEvents() {
  const result = await getPublicEventDirectory();
  return result.data.map((item) => ({ id: item.event.id, source: item.source, updatedAt: item.source === "exhibitor" && typeof item.event.reviewed_at === "string" ? new Date(item.event.reviewed_at) : undefined }));
}

export const getPublicEventMetadata = unstable_cache(async (source: "organizer" | "exhibitor", id: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = await createClient();
  if (!db) return null;
  const table = source === "organizer" ? "organizer_events" : "exhibitor_event_submissions";
  const query = db.from(table).select("id,title,description,city,venue,starts_at,ends_at,status").eq("id", id);
  const { data } = source === "organizer" ? await query.in("status", ["published", "cancelled"]).maybeSingle() : await query.eq("status", "approved").maybeSingle();
  return data;
}, ["public-event-metadata-v1"], { revalidate: 60, tags: [PUBLIC_CACHE_TAGS.events, PUBLIC_CACHE_TAGS.submissions] });
