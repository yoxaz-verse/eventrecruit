import Link from "next/link";
import { notFound } from "next/navigation";
import { ProgressiveImage } from "@/components/progressive-image";
import { updateApplicationStatus } from "@/app/actions/workflow";
import { DashboardShell } from "@/components/dashboard-shell";
import { SubmitButton } from "@/components/submit-button";
import { WorkflowActionForm } from "@/components/workflow-action-form";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { applicantCountLabel, newestApplicationsFirst, talentRequirementLabel } from "@/lib/staffing-request-view";
import type { ApplicationStatus } from "@/lib/types";

const applicationStatuses: ApplicationStatus[] = [
  "applied", "under_review", "shortlisted", "documents_requested", "approved", "assigned",
  "rejected", "withdrawn", "no_response", "cancelled", "completed", "closed",
];

const dateTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

function displayList(values?: string[] | null) {
  return values?.length ? values.join(", ") : "Not specified";
}

function displayRate(role: { rate_mode?: string | null; proposed_rate_min?: number | null; proposed_rate_max?: number | null; hourly_rate?: number | null }) {
  if (role.rate_mode === "negotiable") return "Negotiable";
  const minimum = Number(role.proposed_rate_min ?? role.hourly_rate ?? 0).toLocaleString("en-IN");
  if (role.rate_mode === "range" && role.proposed_rate_max != null) return `₹${minimum}–₹${Number(role.proposed_rate_max).toLocaleString("en-IN")}`;
  return `₹${minimum}`;
}

export default async function ExhibitorRequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireRole(["exhibitor"]);
  const db = await createClient();
  if (!db) throw new Error("Request details are temporarily unavailable.");

  const { data: role, error } = await db.from("staffing_roles").select(`
    id,title,description,headcount,hourly_rate,rate_mode,proposed_rate_min,proposed_rate_max,
    shift_start,shift_end,work_starts_on,work_ends_on,required_skills,preferred_skills,
    required_languages,status,publication_status,operation_status,worker_standard,reporting_time,
    working_hours,dress_code,benefits,special_instructions,application_deadline,
    applications(id,talent_id,status,cover_note,created_at,cancellation_requested_at),
    staffing_settlements(id,status,gross_amount,payer_type),
    events!inner(id,title,venue,city,starts_at,ends_at,verification_status,created_by)
  `).eq("id", id).eq("events.created_by", profile.id).maybeSingle();

  if (error) throw new Error("Unable to load this staffing request.");
  if (!role) notFound();

  const event = Array.isArray(role.events) ? role.events[0] : role.events;
  const settlement = Array.isArray(role.staffing_settlements) ? role.staffing_settlements[0] : role.staffing_settlements;
  const applications = newestApplicationsFirst(role.applications ?? []);
  const talentIds = [...new Set(applications.map(application => application.talent_id))];
  const [profilesResult, reputationResult] = talentIds.length ? await Promise.all([
    db.from("profiles").select("id,full_name,city,avatar_url,verification_status,talent_profiles(headline,bio,skills,languages,availability,experience_years)").in("id", talentIds),
    db.from("profile_reputation").select("profile_id,trust_score,average_rating,reliability_score,communication_score,professionalism_score,completed_count,cancellations,disputes").in("profile_id", talentIds),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  if (profilesResult.error || reputationResult.error) throw new Error("Unable to load applicant profiles.");
  const people = new Map((profilesResult.data ?? []).map(person => [person.id, person]));
  const reputations = new Map((reputationResult.data ?? []).map(reputation => [reputation.profile_id, reputation]));

  const requestFacts = [
    ["Talent requirement", String(role.headcount)],
    ["Work dates", `${role.work_starts_on} – ${role.work_ends_on}`],
    ["Shift", `${role.shift_start.slice(0, 5)}–${role.shift_end.slice(0, 5)}`],
    ["Pay", displayRate(role)],
    ["Required skills", displayList(role.required_skills)],
    ["Preferred skills", displayList(role.preferred_skills)],
    ["Languages", displayList(role.required_languages)],
    ["Worker standard", role.worker_standard || "Not specified"],
    ["Dress code", role.dress_code || "Not specified"],
    ["Benefits", role.benefits || "Not specified"],
  ];

  return <DashboardShell active="exhibitor" current="/dashboard/exhibitor/requests">
    <Link className="text-sm font-bold text-[var(--accent)]" href="/dashboard/exhibitor/requests">← Back to requests</Link>
    <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
      <div><div className="flex flex-wrap gap-2"><span className="badge capitalize">Staffing · {role.status.replaceAll("_", " ")}</span><span className="badge capitalize">Event · {event?.verification_status.replaceAll("_", " ")}</span><span className="badge capitalize">{role.publication_status.replaceAll("_", " ")}</span></div><h1 className="mt-3 text-4xl font-black">{role.title}</h1><p className="mt-2 text-[var(--muted)]">{event?.title} · {event?.venue}, {event?.city} · {event?.starts_at}–{event?.ends_at}</p></div>
      <div className="flex flex-wrap gap-2"><span className="badge">{talentRequirementLabel(role.headcount)}</span><span className="badge">{applicantCountLabel(applications.length)}</span></div>
    </div>

    <section className="panel mt-6 p-6">
      <h2 className="text-2xl font-black">Request details</h2>
      {role.description ? <p className="mt-3 whitespace-pre-wrap">{role.description}</p> : <p className="mt-3 text-[var(--muted)]">No role description provided.</p>}
      <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{requestFacts.map(([label, value]) => <div key={label}><dt className="text-sm font-bold text-[var(--muted)]">{label}</dt><dd className="mt-1">{value}</dd></div>)}</dl>
      {role.special_instructions ? <div className="mt-5 border-t border-[var(--line)] pt-4"><h3 className="font-bold">Special instructions</h3><p className="mt-1 whitespace-pre-wrap">{role.special_instructions}</p></div> : null}
      {settlement ? <div className="mt-5 border-t border-[var(--line)] pt-4"><h3 className="font-bold">Payment</h3><p className="mt-1 capitalize">{settlement.status.replaceAll("_", " ")} · ₹{Number(settlement.gross_amount).toLocaleString("en-IN")}</p></div> : null}
    </section>

    <section className="mt-8">
      <h2 className="text-2xl font-black">Applicants</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">Applications are shown newest first.</p>
      <div className="mt-4 grid gap-5">{applications.map(application => {
        const person = people.get(application.talent_id);
        const talentProfile = Array.isArray(person?.talent_profiles) ? person.talent_profiles[0] : person?.talent_profiles;
        const reputation = reputations.get(application.talent_id);
        return <article className="panel p-6" key={application.id}>
          <div className="flex flex-wrap items-start gap-4">
            {person?.avatar_url ? <ProgressiveImage src={`/api/media/talent/${application.talent_id}`} alt={`${person.full_name} profile picture`} className="h-20 w-20 rounded-full border border-[var(--line)] object-cover" containerClassName="h-20 w-20 shrink-0"/> : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-2xl font-black" aria-hidden="true">{person?.full_name?.charAt(0) ?? "?"}</div>}
            <div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><span className="badge capitalize">{application.status.replaceAll("_", " ")}</span><span className="badge capitalize">{person?.verification_status?.replaceAll("_", " ") ?? "Unverified"}</span></div><h3 className="mt-3 text-2xl font-black">{person?.full_name ?? "Applicant"}</h3><p className="text-sm text-[var(--muted)]">{talentProfile?.headline || "No professional headline"} · {person?.city || "City not provided"}</p><p className="mt-2 text-sm">Applied {dateTime.format(new Date(application.created_at))}</p></div>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div><h4 className="font-bold">Professional profile</h4><p className="mt-2 whitespace-pre-wrap text-sm">{talentProfile?.bio || "No bio provided."}</p><dl className="mt-4 grid gap-3 sm:grid-cols-2"><div><dt className="text-xs font-bold text-[var(--muted)]">Skills</dt><dd className="text-sm">{displayList(talentProfile?.skills)}</dd></div><div><dt className="text-xs font-bold text-[var(--muted)]">Languages</dt><dd className="text-sm">{displayList(talentProfile?.languages)}</dd></div><div><dt className="text-xs font-bold text-[var(--muted)]">Experience</dt><dd className="text-sm">{talentProfile?.experience_years != null ? `${Number(talentProfile.experience_years).toLocaleString("en-IN")} years` : "Not provided"}</dd></div><div><dt className="text-xs font-bold text-[var(--muted)]">Availability</dt><dd className="text-sm">{talentProfile?.availability || "Not provided"}</dd></div></dl></div>
            <div><h4 className="font-bold">Application</h4><p className="mt-2 whitespace-pre-wrap text-sm">{application.cover_note || "No cover note provided."}</p>{application.cancellation_requested_at ? <p className="mt-3 text-sm font-bold">Cancellation requested.</p> : null}<h4 className="mt-5 font-bold">Reputation</h4><dl className="mt-2 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-[var(--muted)]">Rating</dt><dd className="font-bold">{Number(reputation?.average_rating ?? 0).toFixed(1)}</dd></div><div><dt className="text-[var(--muted)]">Trust</dt><dd className="font-bold">{reputation?.trust_score ?? 100}</dd></div><div><dt className="text-[var(--muted)]">Reliability</dt><dd className="font-bold">{reputation?.reliability_score ?? 100}</dd></div><div><dt className="text-[var(--muted)]">Completed</dt><dd className="font-bold">{reputation?.completed_count ?? 0}</dd></div></dl></div>
          </div>
          <WorkflowActionForm action={updateApplicationStatus} className="mt-5 flex flex-wrap items-end gap-3 border-t border-[var(--line)] pt-5"><input type="hidden" name="application_id" value={application.id}/><label className="label">Update status<select className="input" name="status" defaultValue={application.status}>{applicationStatuses.map(status => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label><SubmitButton pendingText="Updating…">Save status</SubmitButton></WorkflowActionForm>
        </article>;
      })}{!applications.length ? <p className="panel p-6 text-[var(--muted)]">No talents have applied for this request yet.</p> : null}</div>
    </section>
  </DashboardShell>;
}
