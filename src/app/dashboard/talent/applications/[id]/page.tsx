import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Gift,
  Globe2,
  MapPin,
  Shirt,
  Sparkles,
  Users,
} from "lucide-react";

import { EventAmenities } from "@/components/event-amenities";
import { StatusBadge } from "@/components/status-badge";
import { TalentLiveRefresh } from "@/components/talent-live-refresh";
import { requireTalentWorkspace } from "@/lib/dashboard-workspace";
import {
  formatDateRangeDisplay,
  formatShiftTime,
  formatTime,
  formatTitleCase,
} from "@/lib/formatters";
import { talentApplicationStatusMeta } from "@/lib/talent-applications";
import type { ApplicationStatus } from "@/lib/types";

type NamedRelation = { name: string };
type ExhibitorRelation = { company_name: string };

type EventRow = {
  id: string;
  title: string;
  venue: string;
  city: string;
  starts_at: string;
  ends_at: string;
  map_url: string | null;
  organizer_event_id: string | null;
  exhibitor_event_submission_id: string | null;
  exhibitors: ExhibitorRelation | ExhibitorRelation[] | null;
  agencies: NamedRelation | NamedRelation[] | null;
};

type RoleRow = {
  title: string;
  description: string | null;
  headcount: number;
  hourly_rate: number;
  rate_mode: string | null;
  proposed_rate_min: number | null;
  proposed_rate_max: number | null;
  shift_start: string;
  shift_end: string;
  work_starts_on: string;
  work_ends_on: string;
  required_skills: string[] | null;
  preferred_skills: string[] | null;
  required_languages: string[] | null;
  worker_standard: string | null;
  reporting_time: string | null;
  working_hours: string | null;
  dress_code: string | null;
  benefits: string | null;
  special_instructions: string | null;
  application_deadline: string | null;
  events: EventRow | EventRow[] | null;
};

type ApplicationRow = {
  id: string;
  cover_note: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  cancellation_requested_at: string | null;
  staffing_roles: RoleRow | RoleRow[] | null;
};

type CatalogEvent = {
  description: string | null;
  amenities: string[] | null;
  custom_amenities: string[] | null;
  publicHref: string;
  hostName: string | null;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function relatedRow<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function displayList(values: string[] | null) {
  return values?.length ? values.join(", ") : "Not specified";
}

function displayRate(role: RoleRow) {
  if (role.rate_mode === "negotiable") return "Negotiable";
  const minimum = Number(role.proposed_rate_min ?? role.hourly_rate ?? 0);
  const minimumLabel = minimum > 0 ? `₹${minimum.toLocaleString("en-IN")}` : "Competitive";
  if (role.rate_mode === "range" && role.proposed_rate_max != null) {
    return `${minimumLabel}–₹${Number(role.proposed_rate_max).toLocaleString("en-IN")}/hour`;
  }
  return minimum > 0 ? `${minimumLabel}/hour` : minimumLabel;
}

function DetailFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-2xs">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[var(--accent)]">
          <Icon size={18} aria-hidden />
        </span>
        <div className="min-w-0">
          <dt className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)]">{label}</dt>
          <dd className="mt-1 text-sm font-bold leading-relaxed text-[var(--foreground)]">{value}</dd>
        </div>
      </div>
    </div>
  );
}

async function loadCatalogEvent(
  db: Awaited<ReturnType<typeof requireTalentWorkspace>>["db"],
  event: EventRow,
): Promise<CatalogEvent | null> {
  if (event.organizer_event_id) {
    const { data, error } = await db
      .from("organizer_events")
      .select("description,amenities,custom_amenities,status,published_at,organizer_companies(name)")
      .eq("id", event.organizer_event_id)
      .in("status", ["published", "cancelled"])
      .not("published_at", "is", null)
      .maybeSingle();
    if (error) throw new Error("Unable to load the linked event details.");
    if (!data) return null;
    const company = relatedRow(data.organizer_companies);
    return {
      description: data.description,
      amenities: data.amenities,
      custom_amenities: data.custom_amenities,
      publicHref: `/events/${event.organizer_event_id}`,
      hostName: company?.name ?? null,
    };
  }

  if (event.exhibitor_event_submission_id) {
    const { data, error } = await db
      .from("exhibitor_event_submissions")
      .select("description,amenities,custom_amenities,status,exhibitors(company_name)")
      .eq("id", event.exhibitor_event_submission_id)
      .eq("status", "approved")
      .maybeSingle();
    if (error) throw new Error("Unable to load the linked event details.");
    if (!data) return null;
    const exhibitor = relatedRow(data.exhibitors);
    return {
      description: data.description,
      amenities: data.amenities,
      custom_amenities: data.custom_amenities,
      publicHref: `/events/exhibitor/${event.exhibitor_event_submission_id}`,
      hostName: exhibitor?.company_name ?? null,
    };
  }

  return null;
}

export default async function TalentApplicationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { profile: talent, db }] = await Promise.all([params, requireTalentWorkspace()]);
  if (!uuidPattern.test(id)) notFound();

  const { data, error } = await db
    .from("applications")
    .select(`
      id,cover_note,status,created_at,updated_at,cancellation_requested_at,
      staffing_roles(
        title,description,headcount,hourly_rate,rate_mode,proposed_rate_min,proposed_rate_max,
        shift_start,shift_end,work_starts_on,work_ends_on,required_skills,preferred_skills,
        required_languages,worker_standard,reporting_time,working_hours,dress_code,benefits,
        special_instructions,application_deadline,
        events(id,title,venue,city,starts_at,ends_at,map_url,organizer_event_id,
          exhibitor_event_submission_id,exhibitors(company_name),agencies(name))
      )
    `)
    .eq("id", id)
    .eq("talent_id", talent.id)
    .maybeSingle();

  if (error) throw new Error("Unable to load this application.");
  if (!data) notFound();

  const application = data as ApplicationRow;
  const role = relatedRow(application.staffing_roles);
  const event = relatedRow(role?.events);
  if (!role || !event) notFound();

  const catalogEvent = await loadCatalogEvent(db, event);
  const exhibitor = relatedRow(event.exhibitors);
  const agency = relatedRow(event.agencies);
  const hostName = catalogEvent?.hostName ?? exhibitor?.company_name ?? agency?.name ?? null;
  const status = talentApplicationStatusMeta[application.status];

  const roleFacts = [
    { label: "Offered pay", value: displayRate(role), icon: Banknote },
    { label: "People needed", value: `${role.headcount} ${role.headcount === 1 ? "person" : "people"}`, icon: Users },
    { label: "Work dates", value: formatDateRangeDisplay(role.work_starts_on, role.work_ends_on), icon: CalendarDays },
    { label: "Shift", value: formatShiftTime(role.shift_start, role.shift_end), icon: Clock3 },
    { label: "Reporting time", value: role.reporting_time ? formatTime(role.reporting_time) : "Not specified", icon: CalendarClock },
    { label: "Working hours", value: role.working_hours || "Not specified", icon: Clock3 },
    { label: "Required skills", value: displayList(role.required_skills), icon: Sparkles },
    { label: "Preferred skills", value: displayList(role.preferred_skills), icon: CheckCircle2 },
    { label: "Languages", value: displayList(role.required_languages), icon: Globe2 },
    { label: "Worker standard", value: role.worker_standard || "Not specified", icon: CheckCircle2 },
    { label: "Dress code", value: role.dress_code || "Not specified", icon: Shirt },
    { label: "Benefits", value: role.benefits || "Not specified", icon: Gift },
  ];

  return (
    <>
      <TalentLiveRefresh />
      <Link className="button button-secondary mb-5 gap-2 text-xs font-bold" href="/dashboard/talent/applications">
        <ArrowLeft size={15} aria-hidden />
        Back to my applications
      </Link>

      <div className="rounded-3xl border border-[var(--line)] bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 p-7 text-white shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={application.status} label={status.label} />
              <span className="rounded-full border border-blue-400/30 bg-blue-500/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-100">
                Application details
              </span>
            </div>
            <p className="mt-4 text-xs font-extrabold uppercase tracking-wider text-blue-200">{formatTitleCase(event.title)}</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">{formatTitleCase(role.title)}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100/85">{status.description}</p>
          </div>
          {catalogEvent ? (
            <Link className="button button-light w-fit gap-2 font-extrabold text-slate-900" href={catalogEvent.publicHref}>
              View public event
              <ExternalLink size={15} aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>

      {application.cancellation_requested_at ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
          Cancellation requested on {formatDateTime(application.cancellation_requested_at)}. The hiring team will review your request.
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="grid gap-6">
          <section className="panel rounded-3xl border border-[var(--line)] bg-white p-6 shadow-xs sm:p-7">
            <h2 className="text-2xl font-black tracking-tight">Event details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <DetailFact icon={CalendarDays} label="Event dates" value={formatDateRangeDisplay(event.starts_at, event.ends_at)} />
              <DetailFact icon={MapPin} label="Venue" value={formatTitleCase(`${event.venue}, ${event.city}`)} />
              {hostName ? <DetailFact icon={Building2} label="Hosted by" value={formatTitleCase(hostName)} /> : null}
            </div>
            {event.map_url ? (
              <a className="button button-secondary mt-4 w-fit gap-2 text-xs font-bold" href={event.map_url} target="_blank" rel="noopener noreferrer">
                Open location in maps
                <ExternalLink size={14} aria-hidden />
              </a>
            ) : null}
            {catalogEvent?.description ? (
              <div className="mt-6 border-t border-[var(--line)] pt-5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">About the event</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground)]">{catalogEvent.description}</p>
              </div>
            ) : null}
            {catalogEvent ? (
              <EventAmenities amenities={catalogEvent.amenities ?? []} customAmenities={catalogEvent.custom_amenities ?? []} />
            ) : null}
          </section>

          <section className="panel rounded-3xl border border-[var(--line)] bg-white p-6 shadow-xs sm:p-7">
            <h2 className="text-2xl font-black tracking-tight">Role details</h2>
            {role.description ? <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--muted)]">{role.description}</p> : null}
            <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {roleFacts.map((fact) => <DetailFact key={fact.label} {...fact} />)}
            </dl>
            {role.special_instructions ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">Special instructions</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-950">{role.special_instructions}</p>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="h-fit rounded-3xl border border-[var(--line)] bg-white p-6 shadow-xs">
          <h2 className="text-xl font-black tracking-tight">Your application</h2>
          <dl className="mt-5 grid gap-4 text-sm">
            <div><dt className="text-xs font-bold text-[var(--muted)]">Current status</dt><dd className="mt-1"><StatusBadge status={application.status} label={status.label} /></dd></div>
            <div><dt className="text-xs font-bold text-[var(--muted)]">Applied</dt><dd className="mt-1 font-semibold">{formatDateTime(application.created_at)}</dd></div>
            <div><dt className="text-xs font-bold text-[var(--muted)]">Last updated</dt><dd className="mt-1 font-semibold">{formatDateTime(application.updated_at)}</dd></div>
            <div><dt className="text-xs font-bold text-[var(--muted)]">Application deadline</dt><dd className="mt-1 font-semibold">{role.application_deadline ? formatDateTime(role.application_deadline) : "Not specified"}</dd></div>
          </dl>
          <div className="mt-5 border-t border-[var(--line)] pt-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">Your cover note</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--foreground)]">{application.cover_note || "No cover note was submitted."}</p>
          </div>
        </aside>
      </div>
    </>
  );
}
