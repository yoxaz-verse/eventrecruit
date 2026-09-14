import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ExhibitorEvents({ searchParams }: { searchParams: Promise<{submitted?:string}> }) {
  const profile = await requireRole(["exhibitor"]);
  const db = await createClient();
  if (!db) throw new Error("Events are temporarily unavailable.");
  const { data: exhibitor } = await db.from("exhibitors").select("id").eq("owner_id", profile.id).maybeSingle();
  const { data, error } = exhibitor ? await db.from("exhibitor_event_submissions").select("id,title,city,venue,starts_at,ends_at,status").eq("exhibitor_id", exhibitor.id).order("created_at", { ascending: false }) : { data: [], error: null };
  if (error) throw new Error("Unable to load submitted events.");
  return <DashboardShell active="exhibitor" current="/dashboard/exhibitor/events"><span className="badge">Exhibitor panel</span><h1 className="mt-3 text-4xl font-black">Events</h1><p className="mt-2 text-[var(--muted)]">Suggest a missing event. Admin approval makes it available in the public directory and for staffing requests.</p><div className="my-6 flex gap-3"><Link className="button button-primary" href="/dashboard/exhibitor/events/new">Submit event</Link><Link className="button button-secondary" href="/events">Browse public events</Link></div>{(await searchParams).submitted === "1" && <p role="status" className="mb-5">Event submitted for review.</p>}<div className="grid gap-4">{data?.map(event => <article className="panel p-5" key={event.id}><span className="badge capitalize">{event.status}</span><h2 className="mt-3 text-xl font-bold">{event.title}</h2><p>{event.venue}, {event.city} · {event.starts_at} – {event.ends_at}</p></article>)}{!data?.length && <p className="panel p-5">No events submitted yet.</p>}</div></DashboardShell>;
}
