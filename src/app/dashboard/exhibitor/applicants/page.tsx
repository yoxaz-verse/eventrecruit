import { ApplicationStatusActions } from "@/components/application-status-actions";
import { ProgressiveImage } from "@/components/progressive-image";

import { StatusBadge } from "@/components/status-badge";
import { DashboardPageHeader } from "@/components/dashboard-primitives";
import { EmptyState } from "@/components/empty-state";
import { requireExhibitorWorkspace } from "@/lib/dashboard-workspace";
import { Building2, MapPin, CalendarDays, Users, AlertCircle, Sparkles, User } from "lucide-react";

export default async function ExhibitorApplicants() {
  const { profile, db } = await requireExhibitorWorkspace();
  const { data: events, error } = await db
    .from("events")
    .select("id,title,staffing_roles(id,title,headcount,work_starts_on,work_ends_on,applications(id,status,talent_id,cancellation_requested_at))")
    .eq("created_by", profile.id);

  if (error) throw new Error("Unable to load applicants.");

  const applications = (events ?? []).flatMap((event) =>
    (event.staffing_roles ?? []).flatMap((role) =>
      (role.applications ?? []).map((application) => ({
        ...application,
        role: role.title,
        event: event.title,
        workDays: `${role.work_starts_on} – ${role.work_ends_on}`,
        booked: (role.applications ?? []).filter((item) => item.status === "assigned").length,
        headcount: role.headcount,
      }))
    )
  );

  const profiles = applications.length
    ? await db
        .from("profiles")
        .select("id,full_name,city,avatar_url")
        .in("id", [...new Set(applications.map((item) => item.talent_id))])
    : { data: [], error: null };

  if (profiles.error) throw new Error("Unable to load applicant profiles.");
  const byId = new Map((profiles.data ?? []).map((person) => [person.id, person]));

  return (
    <>
      <DashboardPageHeader eyebrow="Exhibitor panel" title="Applicants" description="Review incoming talent profiles, evaluate experience, request documents, and confirm assignments." />

      <div className="mt-6 grid gap-5">
        {applications.map((application) => {
          const person = byId.get(application.talent_id);
          const isFull = application.booked >= application.headcount;

          return (
            <article
              className="panel p-6 rounded-2xl border border-[var(--line)] bg-white shadow-xs hover:shadow-md transition-all duration-200"
              key={application.id}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-[var(--line)]/60">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    {person?.avatar_url ? (
                      <ProgressiveImage
                        src={`/api/media/talent/${application.talent_id}`}
                        alt={`${person.full_name} profile picture`}
                        className="h-16 w-16 rounded-2xl border border-[var(--line)] object-cover shadow-xs"
                        containerClassName="h-16 w-16 shrink-0"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--muted)] border border-[var(--line)]">
                        <User size={28} />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={application.status} />
                      {application.cancellation_requested_at && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-200">
                          <AlertCircle size={13} />
                          <span>Cancellation Requested</span>
                        </span>
                      )}
                    </div>

                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                      {person?.full_name ?? "Applicant"}
                    </h2>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-[var(--muted)]">
                      <span className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Sparkles size={14} className="text-[var(--accent)]" />
                        <span>{application.role}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Building2 size={14} className="text-[var(--accent)]" />
                        <span>{application.event}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-[var(--accent)]" />
                        <span>{person?.city ?? "Location not specified"}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-[var(--accent)]" />
                        <span>{application.workDays}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex md:flex-col items-end justify-between gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-[var(--line)]">
                  <div className="flex items-center gap-2 rounded-xl bg-[var(--surface)] px-3.5 py-2 border border-[var(--line)] text-xs">
                    <Users size={16} className="text-[var(--accent)]" />
                    <div>
                      <span className="block text-[10px] font-extrabold uppercase text-[var(--muted)]">Confirmed Roster</span>
                      <strong className={`font-black text-xs ${isFull ? "text-emerald-700" : "text-slate-900"}`}>
                        {application.booked} / {application.headcount} slots filled
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {application.cancellation_requested_at && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-900 font-semibold flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600 shrink-0" />
                  <span>Applicant requested cancellation. Choose Cancelled in actions to release this booking slot.</span>
                </div>
              )}

              <ApplicationStatusActions applicationId={application.id} currentStatus={application.status} key={`${application.id}:${application.status}`} />
            </article>
          );
        })}

        {!applications.length && (
          <EmptyState title="No applications yet" description="Applications submitted for your staffing requests will appear here." />
        )}
      </div>
    </>
  );
}
