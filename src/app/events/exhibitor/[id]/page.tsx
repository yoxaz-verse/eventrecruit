import Link from "next/link";
import { notFound } from "next/navigation";
import { TopNav } from "@/components/top-nav";
import { createClient } from "@/lib/supabase/server";
import { EventAmenities } from "@/components/event-amenities";

export default async function ExhibitorEventDetail({ params }: { params: Promise<{id:string}> }) {
  const { id } = await params;
  const db = await createClient();
  if (!db) throw new Error("Event is temporarily unavailable.");
  const { data: event, error } = await db.from("exhibitor_event_submissions").select("title,description,venue,city,starts_at,ends_at,status,amenities,custom_amenities").eq("id", id).eq("status", "approved").maybeSingle();
  if (error) throw new Error("Unable to load event.");
  if (!event) notFound();
 return <div className="shell public-page"><TopNav/><main className="page py-12"><Link className="button button-secondary mb-6" href="/events">All events</Link><span className="badge">Exporb Approved</span><h1 className="mt-4 text-4xl font-black">{event.title}</h1><p className="mt-3 text-[var(--muted)]">{event.venue}, {event.city} · {event.starts_at} – {event.ends_at}</p><article className="panel mt-8 max-w-3xl p-6"><p>{event.description || "No description provided."}</p><EventAmenities amenities={event.amenities} customAmenities={event.custom_amenities}/></article></main></div>;
}
