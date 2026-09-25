import { ApplicationStatusActions } from "@/components/application-status-actions";
import { ProgressiveImage } from "@/components/progressive-image";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ExhibitorApplicants() {
  const profile = await requireRole(["exhibitor"]);
  const db = await createClient();
  if (!db) throw new Error("Applicants are temporarily unavailable.");
  const { data: events, error } = await db.from("events").select("id,title,staffing_roles(id,title,headcount,work_starts_on,work_ends_on,applications(id,status,talent_id,cancellation_requested_at))").eq("created_by", profile.id);
  if (error) throw new Error("Unable to load applicants.");
  const applications = (events ?? []).flatMap(event => (event.staffing_roles ?? []).flatMap(role => (role.applications ?? []).map(application => ({
    ...application,
    role: role.title,
    event: event.title,
    workDays: `${role.work_starts_on} – ${role.work_ends_on}`,
    booked: (role.applications ?? []).filter(item => item.status === "assigned").length,
    headcount: role.headcount,
  }))));
  const profiles = applications.length
    ? await db.from("profiles").select("id,full_name,city,avatar_url").in("id", [...new Set(applications.map(item => item.talent_id))])
    : { data: [], error: null };
  if (profiles.error) throw new Error("Unable to load applicant profiles.");
  const byId = new Map((profiles.data ?? []).map(person => [person.id, person]));
  return <DashboardShell active="exhibitor" current="/dashboard/exhibitor/applicants">
    <span className="badge">Exhibitor panel</span><h1 className="mt-3 mb-6 text-4xl font-black">Applicants</h1>
    <div className="grid gap-4">{applications.map(application => {
      const person = byId.get(application.talent_id);
      return <article className="panel p-5" key={application.id}>
        <div className="flex items-start gap-4">{person?.avatar_url ? <ProgressiveImage src={`/api/media/talent/${application.talent_id}`} alt={`${person.full_name} profile picture`} className="h-16 w-16 rounded-full border border-[var(--line)] object-cover" containerClassName="h-16 w-16 shrink-0"/> : null}<div><StatusBadge status={application.status}/><h2 className="mt-3 text-xl font-bold">{person?.full_name ?? "Applicant"}</h2><p>{application.role} · {application.event} · {application.workDays}</p><p className="text-sm">Confirmed roster: {application.booked}/{application.headcount}</p>{application.cancellation_requested_at ? <p className="text-sm font-bold">Cancellation requested — choose Cancelled to release this booking.</p> : null}<p className="text-sm text-[var(--muted)]">{person?.city ?? "City not provided"}</p></div></div>
        <ApplicationStatusActions applicationId={application.id} currentStatus={application.status} key={`${application.id}:${application.status}`}/>
      </article>;
    })}{!applications.length && <p className="panel p-5">No applications for your staffing requests yet.</p>}</div>
  </DashboardShell>;
}
