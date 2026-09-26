import Link from "next/link";

import { requireExhibitorWorkspace } from "@/lib/dashboard-workspace";
import { DashboardPageHeader } from "@/components/dashboard-primitives";
import { EmptyState } from "@/components/empty-state";
import { flattenStaffingRoles } from "@/lib/dashboard-read-models";
import { markSettlementSent } from "@/app/actions/settlements";
import { applicantCountLabel, talentRequirementLabel } from "@/lib/staffing-request-view";
import { StatusBadge } from "@/components/status-badge";
import { PlusCircle, Building2, MapPin, CalendarDays, Users, UserCheck, CreditCard, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export default async function ExhibitorRequests() {
  const { profile, db } = await requireExhibitorWorkspace();
  const { data, error } = await db.from("events").select("id,title,city,starts_at,verification_status,staffing_roles(id,title,headcount,status,applications(id),staffing_settlements(id,status,gross_amount,payer_type))").eq("created_by", profile.id).order("created_at", { ascending: false });
  if (error) throw new Error("Unable to load requests.");
  const roles = flattenStaffingRoles(data ?? []);

  return (
    <>
      <DashboardPageHeader eyebrow="Exhibitor panel" title="Staff Requests" description="Manage staffing requirements independently from event verification and review applicants in real time." />

      <div className="my-6">
        <Link className="button button-primary gap-2 shadow-sm hover:shadow-md" href="/dashboard/exhibitor/requests/new">
          <PlusCircle size={18} aria-hidden />
          <span>New staffing request</span>
        </Link>
      </div>

      <div className="grid gap-5">
        {roles.map(role => {
          const settlement = Array.isArray(role.staffing_settlements) ? role.staffing_settlements[0] : role.staffing_settlements;
          const isVerifiedEvent = role.event.verification_status === "verified";

          return (
            <article
              className="panel relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md group flex flex-col justify-between"
              key={role.id}
            >
              <div>
                {/* Header Badge Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--line)]/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={role.status} />
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold border capitalize ${
                      isVerifiedEvent
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                        : "bg-amber-50 text-amber-900 border-amber-200/80"
                    }`}>
                      <ShieldCheck size={13} className={isVerifiedEvent ? "text-emerald-600" : "text-amber-600"} />
                      <span>Event {role.event.verification_status.replaceAll("_", " ")}</span>
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[var(--muted)] flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-[var(--accent)]" />
                    <span>Starts {role.event.starts_at}</span>
                  </span>
                </div>

                {/* Main Content */}
                <div className="mt-4">
                  <h2 className="text-xl font-black tracking-tight text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                    {role.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-semibold text-[var(--muted)]">
                    <span className="flex items-center gap-1.5">
                      <Building2 size={15} className="text-[var(--accent)] shrink-0" />
                      <span>{role.event.title}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={15} className="text-[var(--accent)] shrink-0" />
                      <span>{role.event.city}</span>
                    </span>
                  </div>
                </div>

                {/* Key Metrics Cards */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-3 rounded-xl bg-[var(--surface)] p-3 border border-[var(--line)]/70">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                      <Users size={18} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)]">Requirement</span>
                      <strong className="text-sm font-extrabold text-[var(--foreground)]">{talentRequirementLabel(role.headcount)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-blue-50/70 p-3 border border-blue-100">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-blue-700">Applicants</span>
                      <strong className="text-sm font-extrabold text-blue-950">{applicantCountLabel(role.applications?.length ?? 0)}</strong>
                    </div>
                  </div>
                </div>

                {/* Settlement Section */}
                {settlement ? (
                  <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <CreditCard size={17} className="text-amber-700" />
                        <span className="text-xs font-bold text-amber-950 capitalize">
                          Payment: {settlement.status.replaceAll("_", " ")}
                        </span>
                      </div>
                      <span className="text-sm font-black text-amber-900">
                        ₹{Number(settlement.gross_amount).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {settlement.payer_type === "exhibitor" && ["pending", "failed"].includes(settlement.status) ? (
                      <form action={markSettlementSent} className="mt-3 flex flex-wrap items-end gap-3 pt-3 border-t border-amber-200/60">
                        <input type="hidden" name="settlement_id" value={settlement.id} />
                        <label className="label flex-1 min-w-[180px]">
                          <span>Payment reference</span>
                          <input className="input bg-white" name="reference" placeholder="UTR / Txn Reference" />
                        </label>
                        <button className="button button-primary gap-1.5 text-xs py-2 px-4 shadow-xs">
                          <CheckCircle2 size={15} />
                          <span>Mark payment sent</span>
                        </button>
                      </form>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* Footer Row */}
              <div className="mt-5 pt-4 border-t border-[var(--line)]/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--muted)]">Staffing request</span>
                <Link
                  className="button button-secondary gap-2 text-xs px-4 py-2 hover:bg-[var(--accent)] hover:text-white transition-all shadow-xs group-hover:border-[var(--accent)]/50"
                  href={`/dashboard/exhibitor/requests/${role.id}`}
                >
                  <span>View request details</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          );
        })}

        {!roles.length && (
          <EmptyState icon={Users} title="No staffing requests yet" description="Create a staffing request to start hiring promoters, hosts, or event crew for your upcoming events." action={<Link className="button button-primary gap-2" href="/dashboard/exhibitor/requests/new"><PlusCircle size={18} aria-hidden /><span>Create staffing request</span></Link>} />
        )}
      </div>
    </>
  );
}
