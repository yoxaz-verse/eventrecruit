import Link from "next/link";

import { requireExhibitorWorkspace } from "@/lib/dashboard-workspace";
import { dashboardPagination } from "@/lib/pagination";
import { DashboardPagination } from "@/components/dashboard-pagination";
import { StatusBadge } from "@/components/status-badge";
import { PlusCircle, CalendarDays, MapPin, CheckCircle2, Search } from "lucide-react";

export default async function ExhibitorEvents({ searchParams }: { searchParams: Promise<{submitted?:string;page?:string}> }) {
  const [{db,entity},params] = await Promise.all([requireExhibitorWorkspace(),searchParams]);
  const pagination = dashboardPagination(params.page);
  const { data, error } = await db.from("exhibitor_event_submissions").select("id,title,city,venue,starts_at,ends_at,status").eq("exhibitor_id", entity.id).order("created_at", { ascending: false }).range(pagination.from,pagination.to);
  if (error) throw new Error("Unable to load submitted events.");
  const isSubmitted = params.submitted === "1";

  return (
    <>
      <span className="badge badge-accent">Exhibitor panel</span>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Submitted events</h1>
      <p className="mt-2 text-[var(--muted)]">Suggest missing events for review. Admin approval unlocks them for staffing requests.</p>
      
      <div className="my-6 flex flex-wrap gap-3">
        <Link className="button button-primary gap-2" href="/dashboard/exhibitor/events/new">
          <PlusCircle size={18} aria-hidden />
          <span>Submit event for review</span>
        </Link>
        <Link className="button button-secondary gap-2" href="/events">
          <Search size={18} aria-hidden />
          <span>Browse public events</span>
        </Link>
      </div>

      {isSubmitted && (
        <div className="callout-banner callout-banner-blue mb-6" role="status">
          <div className="flex items-start gap-3">
            <div className="callout-icon">
              <CheckCircle2 size={22} aria-hidden />
            </div>
            <div className="callout-content">
              <h4 className="callout-title">Event submitted successfully!</h4>
              <p className="callout-desc">
                Your event submission has been logged and sent for admin review. Once approved, it will appear here and in the request creator.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {data?.map(event => (
          <article className="panel p-6 transition-all hover:shadow-lg" key={event.id}>
            <div className="flex items-center justify-between gap-4">
              <StatusBadge status={event.status} label={event.status === "approved" ? "Exporb Approved" : undefined} />
              <span className="text-xs text-[var(--muted)] flex items-center gap-1">
                <CalendarDays size={14} aria-hidden />
                {event.starts_at} – {event.ends_at}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-bold tracking-tight">{event.title}</h2>
            <p className="mt-1 text-sm text-[var(--muted)] flex items-center gap-1.5">
              <MapPin size={15} className="text-[var(--accent)] shrink-0" aria-hidden />
              <span>{event.venue}, {event.city}</span>
            </p>
          </article>
        ))}

        {!data?.length && (
          <div className="panel p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--muted)]">
              <CalendarDays size={24} aria-hidden />
            </div>
            <h3 className="text-lg font-bold">No events submitted yet</h3>
            <p className="mt-1 text-sm text-[var(--muted)] max-w-md mx-auto">
              Submit your first event for approval so you can start creating staffing requests.
            </p>
            <div className="mt-5">
              <Link className="button button-primary gap-2" href="/dashboard/exhibitor/events/new">
                <PlusCircle size={18} aria-hidden />
                <span>Submit event for approval</span>
              </Link>
            </div>
          </div>
        )}
      </div>
      <DashboardPagination path="/dashboard/exhibitor/events" page={pagination.page} hasNext={(data?.length ?? 0) === pagination.pageSize} params={params} />
    </>
  );
}
