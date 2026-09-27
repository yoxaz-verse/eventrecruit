import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  IndianRupee,
  MapPin,
  RefreshCw,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { TalentLiveRefresh } from "@/components/talent-live-refresh";
import { requireTalentWorkspace } from "@/lib/dashboard-workspace";
import {
  formatDateRangeDisplay,
  formatHourlyRate,
  formatShiftTime,
  formatTitleCase,
} from "@/lib/formatters";
import {
  talentApplicationGroup,
  talentApplicationStatusMeta,
} from "@/lib/talent-applications";
import type { ApplicationStatus } from "@/lib/types";

type EventRow = {
  title: string;
  venue: string;
  city: string;
};

type StaffingRoleRow = {
  title: string;
  hourly_rate: number;
  shift_start: string;
  shift_end: string;
  work_starts_on: string;
  work_ends_on: string;
  events: EventRow | EventRow[] | null;
};

type ApplicationRow = {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  cancellation_requested_at: string | null;
  staffing_roles: StaffingRoleRow | StaffingRoleRow[] | null;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function relatedRow<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function ApplicationCard({ application }: { application: ApplicationRow }) {
  const role = relatedRow(application.staffing_roles);
  const event = relatedRow(role?.events ?? null);
  const status = talentApplicationStatusMeta[application.status];

  if (!role || !event) return null;

  return (
    <article className="panel rounded-2xl border border-[var(--line)] bg-white p-5 shadow-xs sm:p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--line)]/70 pb-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--accent)]">
            {formatTitleCase(event.title)}
          </p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-[var(--foreground)]">
            {formatTitleCase(role.title)}
          </h3>
        </div>
        <StatusBadge status={application.status} label={status.label} />
      </div>

      <p className="mt-4 text-sm font-medium leading-relaxed text-[var(--muted)]">
        {status.description}
      </p>

      {application.cancellation_requested_at ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs font-bold text-amber-800">
          Cancellation requested on {formatDateTime(application.cancellation_requested_at)}. The hiring team will review your request.
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 text-xs text-[var(--muted)] sm:grid-cols-2">
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 shrink-0 text-[var(--accent)]" size={15} aria-hidden />
          <span className="font-semibold text-slate-700">{formatTitleCase(`${event.venue}, ${event.city}`)}</span>
        </p>
        <p className="flex items-start gap-2">
          <CalendarDays className="mt-0.5 shrink-0 text-[var(--accent)]" size={15} aria-hidden />
          <span>{formatDateRangeDisplay(role.work_starts_on, role.work_ends_on)}</span>
        </p>
        <p className="flex items-start gap-2">
          <Clock3 className="mt-0.5 shrink-0 text-[var(--accent)]" size={15} aria-hidden />
          <span>{formatShiftTime(role.shift_start, role.shift_end)}</span>
        </p>
        <p className="flex items-start gap-2">
          <IndianRupee className="mt-0.5 shrink-0 text-[var(--accent)]" size={15} aria-hidden />
          <span>{formatHourlyRate(Number(role.hourly_rate))}</span>
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-1 border-t border-[var(--line)]/70 pt-4 text-[11px] font-semibold text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
        <span>Applied {formatDateTime(application.created_at)}</span>
        <span className="inline-flex items-center gap-1.5">
          <RefreshCw size={12} aria-hidden />
          Last updated {formatDateTime(application.updated_at)}
        </span>
      </div>
    </article>
  );
}

function ApplicationSection({
  title,
  description,
  applications,
}: {
  title: string;
  description: string;
  applications: ApplicationRow[];
}) {
  return (
    <section className="mt-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
      </div>
      {applications.length ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      ) : (
        <EmptyState
          compact
          className="mt-4"
          icon={BriefcaseBusiness}
          title={`No ${title.toLowerCase()}`}
          description={title === "Active applications" ? "Applications being considered will appear here." : "Finished application updates will appear here."}
        />
      )}
    </section>
  );
}

export default async function TalentApplicationsPage() {
  const { profile: talent, db } = await requireTalentWorkspace();
  const { data, error } = await db
    .from("applications")
    .select("id,status,created_at,updated_at,cancellation_requested_at,staffing_roles(title,hourly_rate,shift_start,shift_end,work_starts_on,work_ends_on,events(title,venue,city))")
    .eq("talent_id", talent.id)
    .order("updated_at", { ascending: false });

  if (error) throw new Error("Unable to load your applications.");

  const applications = (data ?? []) as ApplicationRow[];
  const active = applications.filter((application) => talentApplicationGroup(application.status) === "active");
  const past = applications.filter((application) => talentApplicationGroup(application.status) === "past");

  return (
    <>
      <TalentLiveRefresh />
      <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 p-7 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-blue-200">
              Application updates
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">My applications</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100/80">
              Follow the latest status of every role you have applied for.
            </p>
          </div>
          <Link className="button button-light w-fit font-extrabold text-slate-900 shadow-lg" href="/dashboard/talent">
            Browse opportunities
          </Link>
        </div>
      </div>

      {!applications.length ? (
        <EmptyState
          className="mt-8"
          icon={BriefcaseBusiness}
          title="You have not applied for any roles yet"
          description="Browse available opportunities and submit an application. Its latest status will appear here."
          action={<Link className="button button-primary" href="/dashboard/talent">Browse opportunities</Link>}
        />
      ) : (
        <>
          <ApplicationSection
            title="Active applications"
            description="Applications currently being reviewed or prepared for assignment."
            applications={active}
          />
          <ApplicationSection
            title="Past applications"
            description="Completed, closed, or otherwise finished applications."
            applications={past}
          />
        </>
      )}
    </>
  );
}
