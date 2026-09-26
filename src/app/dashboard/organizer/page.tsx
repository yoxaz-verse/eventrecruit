import Link from "next/link";
import { PlusCircle, Building2, Globe, CalendarDays, MapPin, Sparkles } from "lucide-react";

import { organizerContext } from "@/lib/organizer-server";
import { eventPhase, eventTypeLabels, venueSettingLabels, type OrganizerEvent } from "@/lib/organizer";

export default async function OrganizerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; message?: string }>;
}) {
  const { filter, message } = await searchParams;
  const { db, company, companies } = await organizerContext();
  const { data, error } = await db
    .from("organizer_events")
    .select("*")
    .in(
      "company_id",
      companies.map((item) => item.id)
    )
    .order("starts_at", { ascending: true, nullsFirst: false });

  if (error) throw new Error("Unable to load events.");
  const events: OrganizerEvent[] = data ?? [];
  const filters = ["all", "draft", "submitted", "upcoming", "ongoing", "completed", "cancelled"];
  const active = filters.includes(filter ?? "") ? filter! : "all";

  return (
    <>
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 p-8 text-white shadow-xl mb-8">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-200 border border-emerald-400/30">
              <Sparkles size={13} className="text-amber-400" /> Event Company Portal
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-white">
              {companies.length === 1 ? company!.name : "Organizer Workspace"}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-emerald-100/80 leading-relaxed">
              Manage exhibitions, trade shows, store activations, and public events across {companies.length} company profile{companies.length === 1 ? "" : "s"}.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link className="button button-primary gap-2 bg-white text-slate-900 hover:bg-emerald-50 shadow-lg border-0" href="/dashboard/organizer/events/new">
              <PlusCircle size={17} className="text-emerald-600" />
              <span>Create Event</span>
            </Link>
            <Link className="button button-secondary gap-2 text-white border-white/20 bg-white/10 hover:bg-white/20" href="/dashboard/organizer/company">
              <Building2 size={17} />
              <span>Company Profile</span>
            </Link>
          </div>
        </div>
      </div>

      {message && (
        <div className="callout-banner callout-banner-blue mb-6" role="status">
          <p className="font-bold text-sm">{message === "Company saved" ? "Company profile saved successfully." : message === "Event saved" ? "Event saved successfully." : message}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <nav className="mb-6 flex flex-wrap gap-2 p-1.5 bg-white border border-[var(--line)] rounded-2xl w-fit shadow-2xs" aria-label="Filter events">
        {filters.map((item) => {
          const count = item === "all" ? events.length : events.filter((e) => eventPhase(e) === item).length;
          const isActive = active === item;
          return (
            <Link
              key={item}
              aria-current={isActive ? "page" : undefined}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all ${
                isActive
                  ? "bg-[var(--ink)] text-white shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
              }`}
              href={`?filter=${item}`}
            >
              {item} <span className={`ml-1 text-[10px] opacity-80 ${isActive ? "text-amber-300" : ""}`}>({count})</span>
            </Link>
          );
        })}
      </nav>

      {/* Events Grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        {events
          .filter((e) => active === "all" || eventPhase(e) === active)
          .map((e) => (
            <article className="panel p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg bg-white border border-[var(--line)] rounded-2xl flex flex-col justify-between" key={e.id}>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="badge badge-accent capitalize text-xs px-2.5 py-0.5 font-extrabold">{eventPhase(e)}</span>
                  <span className="badge badge-surface text-xs font-bold">{eventTypeLabels[e.event_type]}</span>
                </div>
                <h2 className="text-xl font-black tracking-tight text-[var(--foreground)]">{e.title}</h2>
                <div className="mt-3 space-y-1 text-xs font-semibold text-[var(--muted)]">
                  <p className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-[var(--accent)] shrink-0" />
                    <span>{e.city || "Location to be added"}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-[var(--accent)] shrink-0" />
                    <span>
                      {e.starts_at || "Dates to be added"}
                      {e.ends_at ? ` – ${e.ends_at}` : ""}
                    </span>
                  </p>
                  <p className="flex items-center gap-1.5 text-[var(--muted)]">
                    <Globe size={14} className="shrink-0" />
                    <span>Setting: {venueSettingLabels[e.venue_setting]}</span>
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-[var(--line)]">
                <Link className="button button-primary text-xs py-2 px-3.5" href={`/dashboard/organizer/events/${e.id}`}>
                  Manage Event
                </Link>
                <Link className="button button-secondary text-xs py-2 px-3.5" href={`/dashboard/organizer/events/${e.id}/participants`}>
                  Exhibitor Directory
                </Link>
              </div>
            </article>
          ))}
      </div>

      {!events.some((e) => active === "all" || eventPhase(e) === active) && (
        <div className="panel p-10 text-center bg-white border border-[var(--line)] rounded-2xl">
          <p className="text-base font-bold text-[var(--foreground)]">No {active === "all" ? "" : active} events found</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Create your first event or switch filters to view existing events.</p>
          <div className="mt-4">
            <Link className="button button-primary text-xs" href="/dashboard/organizer/events/new">
              Create Event
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
