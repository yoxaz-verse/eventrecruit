import Link from "next/link";

import { AgencyClientSelector } from "@/components/agency-client-selector";
import { DashboardPageHeader } from "@/components/dashboard-primitives";
import { EmptyState } from "@/components/empty-state";
import { agencyClients, selectedAgencyClient } from "@/lib/agency-workspace";
import { requireAgencyWorkspace } from "@/lib/dashboard-workspace";
import { flattenStaffingRoles } from "@/lib/dashboard-read-models";
import { publishStaffCall } from "@/app/actions/agency-operations";
import { configureSettlement, markSettlementSent } from "@/app/actions/settlements";
import { StatusBadge } from "@/components/status-badge";
import { PlusCircle, Building2, MapPin, CalendarDays, Users, Send, CheckCircle2 } from "lucide-react";

export default async function AgencyRequests({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const [clients, params, workspace] = await Promise.all([agencyClients(), searchParams, requireAgencyWorkspace()]);
  const selected = selectedAgencyClient(clients, params.client);
  const { db } = workspace;

  const { data, error } = selected
    ? await db
        .from("events")
        .select("id,title,city,payer_type,staffing_roles(id,title,headcount,status,publication_status,operation_status,work_starts_on,work_ends_on,final_client_charge,agency_share,staffing_settlements(id,status,gross_amount,payer_type))")
        .eq("exhibitor_id", selected.exhibitorId)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (error) throw new Error("Unable to load requirements.");
  const roles = flattenStaffingRoles(data ?? []);

  return (
    <>
      <DashboardPageHeader eyebrow="Agency workspace" title="Staff Calls" description="Create staffing requirements for your clients as drafts, configure rates and payouts, then publish them to talent." />

      <AgencyClientSelector clients={clients} selected={selected} path="/dashboard/agency/requests" />

      {selected ? (
        <div className="mb-6">
          <Link className="button button-primary gap-2 shadow-sm hover:shadow-md" href={`/dashboard/agency/requests/new?client=${selected.exhibitorId}`}>
            <PlusCircle size={18} aria-hidden />
            <span>New event requirement</span>
          </Link>
        </div>
      ) : null}

      <div className="grid gap-5">
        {roles.map((role) => {
          const settlement = Array.isArray(role.staffing_settlements) ? role.staffing_settlements[0] : role.staffing_settlements;
          return (
            <article className="panel rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md group flex flex-col justify-between" key={role.id}>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--line)]/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge capitalize">{role.publication_status}</span>
                    <StatusBadge status={role.operation_status} label={role.operation_status.replaceAll("_", " ")} />
                  </div>
                  <span className="text-xs font-semibold text-[var(--muted)] flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-[var(--accent)]" />
                    <span>{role.work_starts_on} – {role.work_ends_on}</span>
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">{role.title}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-semibold text-[var(--muted)]">
                      <span className="flex items-center gap-1.5">
                        <Building2 size={15} className="text-[var(--accent)] shrink-0" />
                        <span>{role.event.title}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={15} className="text-[var(--accent)] shrink-0" />
                        <span>{role.event.city}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users size={15} className="text-[var(--accent)] shrink-0" />
                        <span>{role.headcount} {role.headcount === 1 ? "person" : "people"} needed</span>
                      </span>
                    </div>
                  </div>

                  {role.publication_status === "draft" ? (
                    <form action={publishStaffCall}>
                      <input type="hidden" name="staffing_role_id" value={role.id} />
                      <button className="button button-primary gap-1.5 text-xs px-4 py-2 shadow-xs">
                        <Send size={14} />
                        <span>Publish staff call</span>
                      </button>
                    </form>
                  ) : null}
                </div>

                {/* Settlement Form Container */}
                <form action={configureSettlement} className="mt-5 grid gap-3 rounded-xl bg-[var(--surface)] p-4 border border-[var(--line)] sm:grid-cols-2">
                  <input type="hidden" name="staffing_role_id" value={role.id} />
                  <label className="label">
                    <span>Final client charge (₹)</span>
                    <input className="input bg-white" name="gross_amount" type="number" min="0" step="0.01" required defaultValue={role.final_client_charge ?? ""} placeholder="0.00" />
                  </label>
                  <label className="label">
                    <span>Agency payout (₹)</span>
                    <input className="input bg-white" name="agency_amount" type="number" min="0" step="0.01" required defaultValue={role.agency_share ?? 0} placeholder="0.00" />
                  </label>
                  <button className="button button-secondary sm:col-span-2 text-xs py-2">Save settlement rates</button>
                </form>

                {settlement?.payer_type === "agency" && ["pending", "failed"].includes(settlement.status) ? (
                  <form action={markSettlementSent} className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-amber-200/80 bg-amber-50/60 p-4">
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
            </article>
          );
        })}

        {selected && !roles.length ? (
          <EmptyState title="No active requirements" description="Create the first staffing requirement for this client." />
        ) : null}
      </div>
    </>
  );
}
