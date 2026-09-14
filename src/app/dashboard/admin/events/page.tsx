import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { reviewExhibitorEvent } from "@/app/actions/exhibitor-events";

export default async function AdminEventReviews() {
  await requireRole(["admin"]);
  const db = await createClient();
  if (!db) throw new Error("Event reviews are temporarily unavailable.");
  const { data, error } = await db.from("exhibitor_event_submissions").select("id,title,description,venue,city,starts_at,ends_at,status,exhibitors(company_name)").eq("status", "pending").order("created_at");
  if (error) throw new Error("Unable to load event review queue.");
  return <DashboardShell active="admin" current="/dashboard/admin/events"><span className="badge">Admin control</span><h1 className="mt-3 mb-6 text-4xl font-black">Event reviews</h1><div className="grid gap-4">{data?.map(event => <article className="panel p-5" key={event.id}><h2 className="text-xl font-bold">{event.title}</h2><p>{event.venue}, {event.city} · {event.starts_at} – {event.ends_at}</p><p className="mt-2">{event.description}</p><p className="text-sm text-[var(--muted)]">Submitted by {Array.isArray(event.exhibitors) ? event.exhibitors[0]?.company_name : (event.exhibitors as {company_name:string}|null)?.company_name}</p><div className="mt-4 flex gap-3">{["approved", "rejected"].map(status => <form action={reviewExhibitorEvent} key={status}><input type="hidden" name="id" value={event.id}/><input type="hidden" name="status" value={status}/><button className={`button ${status === "approved" ? "button-primary" : "button-secondary"}`} type="submit">{status === "approved" ? "Approve" : "Reject"}</button></form>)}</div></article>)}{!data?.length && <p className="panel p-5">No events awaiting review.</p>}</div></DashboardShell>;
}
