import { todayInIndia } from "@/lib/exhibitor-listings";
import { createClient } from "@/lib/supabase/server";

export type SelectableEvent = { value: string; title: string; city: string; starts_at: string; ends_at: string; venue: string; attribution: string };

export async function selectableEvents(): Promise<SelectableEvent[]> {
  const db = await createClient();
  if (!db) throw new Error("Events are temporarily unavailable.");
  const today = todayInIndia();
  const [organizers, submissions] = await Promise.all([
    db.from("organizer_events").select("id,title,venue,city,starts_at,ends_at,company_id,organizer_companies(name)").eq("status", "published").gte("ends_at", today),
    db.from("exhibitor_event_submissions").select("id,title,venue,city,starts_at,ends_at").eq("status", "approved").gte("ends_at", today),
  ]);
  if (organizers.error || submissions.error) throw new Error("Unable to load event listings.");
  return [
    ...(organizers.data ?? []).map((event) => ({ value: `organizer:${event.id}`, title: event.title, city: event.city, venue: event.venue, starts_at: event.starts_at, ends_at: event.ends_at, attribution: Array.isArray(event.organizer_companies) ? event.organizer_companies[0]?.name ?? "Event organizer" : (event.organizer_companies as {name:string}|null)?.name ?? "Event organizer" })),
    ...(submissions.data ?? []).map((event) => ({ value: `exhibitor:${event.id}`, title: event.title, city: event.city, venue: event.venue, starts_at: event.starts_at, ends_at: event.ends_at, attribution: "Exhibitor-submitted" })),
  ].sort((a,b) => a.starts_at.localeCompare(b.starts_at) || a.title.localeCompare(b.title));
}
