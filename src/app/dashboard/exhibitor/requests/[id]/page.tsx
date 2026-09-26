import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationStatusActions } from "@/components/application-status-actions";
import { ProgressiveImage } from "@/components/progressive-image";

import { StatusBadge } from "@/components/status-badge";
import { requireExhibitorWorkspace } from "@/lib/dashboard-workspace";
import { applicantCountLabel, newestApplicationsFirst, talentRequirementLabel } from "@/lib/staffing-request-view";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  Clock,
  Banknote,
  Sparkles,
  Globe,
  ShieldCheck,
  Shirt,
  Gift,
  Star,
  Building2,
} from "lucide-react";

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
  const [{ id },{profile,db}] = await Promise.all([params,requireExhibitorWorkspace()]);

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
  const talentIds = [...new Set(applications.map((application) => application.talent_id))];
  const [profilesResult, reputationResult] = talentIds.length
    ? await Promise.all([
        db
          .from("profiles")
          .select("id,full_name,city,avatar_url,verification_status,talent_profiles(headline,bio,skills,languages,availability,experience_years)")
          .in("id", talentIds),
        db
          .from("profile_reputation")
          .select("profile_id,trust_score,average_rating,reliability_score,communication_score,professionalism_score,completed_count,cancellations,disputes")
          .in("profile_id", talentIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  if (profilesResult.error || reputationResult.error) throw new Error("Unable to load applicant profiles.");
  const people = new Map((profilesResult.data ?? []).map((person) => [person.id, person]));
  const reputations = new Map((reputationResult.data ?? []).map((reputation) => [reputation.profile_id, reputation]));

  const requestFacts = [
    { label: "Pay Rate", value: displayRate(role), icon: Banknote, color: "text-emerald-600 bg-emerald-50" },
    { label: "Talent Requirement", value: `${role.headcount} ${role.headcount === 1 ? "person" : "people"}`, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Work Dates", value: `${role.work_starts_on} – ${role.work_ends_on}`, icon: CalendarDays, color: "text-indigo-600 bg-indigo-50" },
    { label: "Shift Hours", value: `${role.shift_start.slice(0, 5)} – ${role.shift_end.slice(0, 5)}`, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Required Skills", value: displayList(role.required_skills), icon: Sparkles, color: "text-violet-600 bg-violet-50" },
    { label: "Languages", value: displayList(role.required_languages), icon: Globe, color: "text-sky-600 bg-sky-50" },
    { label: "Worker Standard", value: role.worker_standard || "Standard verified", icon: ShieldCheck, color: "text-rose-600 bg-rose-50" },
    { label: "Dress Code", value: role.dress_code || "Not specified", icon: Shirt, color: "text-purple-600 bg-purple-50" },
    { label: "Benefits", value: role.benefits || "Not specified", icon: Gift, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <>
      {/* Back Navigation Button */}
      <Link
        className="button button-secondary text-xs font-bold gap-2 mb-4 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
        href="/dashboard/exhibitor/requests"
      >
        <ArrowLeft size={15} />
        <span>Back to Staff Requests</span>
      </Link>

      {/* Header Banner Section */}
      <div className="panel p-6 md:p-8 bg-white border border-[var(--line)] rounded-3xl shadow-xs mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <StatusBadge status={role.status} label={`Staffing: ${role.status.replaceAll("_", " ")}`} />
              <span className="badge badge-accent capitalize font-bold">Event: {event?.verification_status.replaceAll("_", " ")}</span>
              <span className="badge badge-surface capitalize font-bold">{role.publication_status.replaceAll("_", " ")}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--foreground)]">{role.title}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-bold text-[var(--muted)]">
              <span className="flex items-center gap-1.5">
                <Building2 size={15} className="text-[var(--accent)] shrink-0" />
                <span>{event?.title}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={15} className="text-[var(--accent)] shrink-0" />
                <span>{event?.venue}, {event?.city}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays size={15} className="text-[var(--accent)] shrink-0" />
                <span>{event?.starts_at} – {event?.ends_at}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]/70 px-4 py-3 text-center min-w-[120px]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)] block">Needed</span>
              <span className="text-xl font-black text-[var(--accent)]">{talentRequirementLabel(role.headcount)}</span>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-center min-w-[120px]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block">Applicants</span>
              <span className="text-xl font-black text-blue-700">{applicantCountLabel(applications.length)}</span>
            </div>
          </div>
        </div>

        {role.description ? (
          <div className="mt-6 pt-5 border-t border-[var(--line)]">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)] mb-1">Role Description</h3>
            <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">{role.description}</p>
          </div>
        ) : null}
      </div>

      {/* Structured Fact Grid */}
      <section className="mb-8">
        <h2 className="text-xl font-black tracking-tight mb-4 text-[var(--foreground)]">Request Details</h2>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {requestFacts.map(({ label, value, icon: Icon, color }) => (
            <div className="panel p-4 bg-white border border-[var(--line)] rounded-2xl flex items-center gap-3.5 shadow-2xs" key={label}>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <dt className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--muted)]">{label}</dt>
                <dd className="mt-0.5 text-sm font-black text-[var(--foreground)] truncate">{value}</dd>
              </div>
            </div>
          ))}
        </div>

        {role.special_instructions ? (
          <div className="panel mt-4 p-5 bg-amber-50/60 border border-amber-200/80 rounded-2xl">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 mb-1">Special Instructions</h3>
            <p className="text-xs font-semibold text-amber-950 whitespace-pre-wrap leading-relaxed">{role.special_instructions}</p>
          </div>
        ) : null}

        {settlement ? (
          <div className="panel mt-4 p-5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900">Payment Status</h3>
              <p className="text-sm font-bold text-emerald-950 capitalize mt-0.5">
                {settlement.status.replaceAll("_", " ")} · ₹{Number(settlement.gross_amount).toLocaleString("en-IN")}
              </p>
            </div>
            <span className="badge badge-accent bg-emerald-100 text-emerald-800 border-emerald-300">Settlement Ready</span>
          </div>
        ) : null}
      </section>

      {/* Applicants Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)]">Applicants</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">Applications are sorted with newest submissions first.</p>
          </div>
          <span className="badge badge-surface text-xs font-bold">{applications.length} Total</span>
        </div>

        <div className="grid gap-6">
          {applications.map((application) => {
            const person = people.get(application.talent_id);
            const talentProfile = Array.isArray(person?.talent_profiles) ? person.talent_profiles[0] : person?.talent_profiles;
            const reputation = reputations.get(application.talent_id);

            return (
              <article className="panel p-6 md:p-7 bg-white border border-[var(--line)] rounded-3xl shadow-sm transition-all hover:shadow-md" key={application.id}>
                {/* Applicant Profile Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[var(--line)]">
                  <div className="flex items-start gap-4">
                    {person?.avatar_url ? (
                      <ProgressiveImage
                        src={`/api/media/talent/${application.talent_id}`}
                        alt={`${person.full_name} profile picture`}
                        className="h-16 w-16 rounded-2xl border-2 border-[var(--line)] object-cover shadow-xs"
                        containerClassName="h-16 w-16 shrink-0"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-blue-200 bg-blue-50 text-blue-700 text-2xl font-black shadow-xs">
                        {person?.full_name?.charAt(0) ?? "?"}
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={application.status} />
                        <StatusBadge status={person?.verification_status ?? "unverified"} />
                      </div>
                      <h3 className="mt-1 text-2xl font-black tracking-tight text-[var(--foreground)]">{person?.full_name ?? "Applicant"}</h3>
                      <p className="text-xs font-bold text-[var(--muted)]">
                        {talentProfile?.headline || "Verified Talent"} · {person?.city || "City not provided"}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-[var(--muted)] flex items-center gap-1">
                        <Clock size={12} className="text-[var(--accent)]" /> Applied {dateTime.format(new Date(application.created_at))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile Details & Reputation Grid */}
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">Professional Profile</h4>
                      <p className="mt-1.5 text-xs text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
                        {talentProfile?.bio || "No bio provided."}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 text-xs bg-[var(--surface)]/70 p-3.5 rounded-2xl border border-[var(--line)]">
                      <div>
                        <dt className="font-extrabold text-[var(--muted)] text-[10px] uppercase">Skills</dt>
                        <dd className="font-bold text-[var(--foreground)] mt-0.5">{displayList(talentProfile?.skills)}</dd>
                      </div>
                      <div>
                        <dt className="font-extrabold text-[var(--muted)] text-[10px] uppercase">Languages</dt>
                        <dd className="font-bold text-[var(--foreground)] mt-0.5">{displayList(talentProfile?.languages)}</dd>
                      </div>
                      <div>
                        <dt className="font-extrabold text-[var(--muted)] text-[10px] uppercase">Experience</dt>
                        <dd className="font-bold text-[var(--foreground)] mt-0.5">
                          {talentProfile?.experience_years != null ? `${Number(talentProfile.experience_years).toLocaleString("en-IN")} years` : "Not specified"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-extrabold text-[var(--muted)] text-[10px] uppercase">Availability</dt>
                        <dd className="font-bold text-[var(--foreground)] mt-0.5">{talentProfile?.availability || "Not specified"}</dd>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">Cover Note</h4>
                      <p className="mt-1.5 text-xs text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
                        {application.cover_note || "No cover note provided."}
                      </p>
                      {application.cancellation_requested_at ? (
                        <p className="mt-2 text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                          Cancellation requested by talent.
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-[var(--muted)] mb-2">Reputation & Trust</h4>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="p-2.5 rounded-xl border border-[var(--line)] bg-white text-center shadow-2xs">
                          <span className="text-[10px] font-bold text-[var(--muted)] block">Rating</span>
                          <span className="text-sm font-black text-amber-600 flex items-center justify-center gap-0.5 mt-0.5">
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                            {Number(reputation?.average_rating ?? 0).toFixed(1)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl border border-[var(--line)] bg-white text-center shadow-2xs">
                          <span className="text-[10px] font-bold text-[var(--muted)] block">Trust</span>
                          <span className="text-sm font-black text-blue-600 mt-0.5 block">{reputation?.trust_score ?? 100}</span>
                        </div>
                        <div className="p-2.5 rounded-xl border border-[var(--line)] bg-white text-center shadow-2xs">
                          <span className="text-[10px] font-bold text-[var(--muted)] block">Reliability</span>
                          <span className="text-sm font-black text-emerald-600 mt-0.5 block">{reputation?.reliability_score ?? 100}</span>
                        </div>
                        <div className="p-2.5 rounded-xl border border-[var(--line)] bg-white text-center shadow-2xs">
                          <span className="text-[10px] font-bold text-[var(--muted)] block">Completed</span>
                          <span className="text-sm font-black text-[var(--foreground)] mt-0.5 block">{reputation?.completed_count ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workflow Actions */}
                <ApplicationStatusActions applicationId={application.id} currentStatus={application.status} key={`${application.id}:${application.status}`} />
              </article>
            );
          })}

          {!applications.length ? (
            <div className="panel p-10 text-center bg-white border border-[var(--line)] rounded-3xl">
              <Users size={32} className="mx-auto text-[var(--muted)] mb-2" />
              <p className="text-base font-extrabold text-[var(--foreground)]">No applications submitted yet</p>
              <p className="mt-1 text-xs text-[var(--muted)] max-w-sm mx-auto">
                Once verified talent apply for this role, their profiles and application notes will appear right here.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
