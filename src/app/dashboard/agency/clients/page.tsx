import Link from "next/link";

import { ExternalClientForm, InviteExhibitorForm } from "@/components/agency-client-forms";
import { DashboardPageHeader } from "@/components/dashboard-primitives";
import { EmptyState } from "@/components/empty-state";
import { updateAgencyRelationship } from "@/app/actions/agency-clients";
import { requireAgencyWorkspace } from "@/lib/dashboard-workspace";
import { firstRelated, indexBy } from "@/lib/dashboard-read-models";
import { whatsappUrl } from "@/lib/agency-operations";
import { dashboardPagination } from "@/lib/pagination";
import { DashboardPagination } from "@/components/dashboard-pagination";
import { Building2, User, Phone, Mail, MessageSquare, ArrowRight, RotateCw, X } from "lucide-react";

export default async function AgencyClientsPage({searchParams}:{searchParams:Promise<{page?:string}>}) {
  const [{ db, entity: agency },params] = await Promise.all([requireAgencyWorkspace(),searchParams]);
  const pagination=dashboardPagination(params.page);
  const [{ data: relationships, error }, { data: clientProfiles }] = await Promise.all([
    db.from("agency_exhibitor_relationships").select("id,status,invited_email,created_at,exhibitors(id,company_name,kind,industry,primary_contact_name,contact_phone,contact_email)").eq("agency_id", agency.id).order("created_at", { ascending: false }).range(pagination.from,pagination.to),
    db.from("agency_client_profiles").select("exhibitor_id,whatsapp_phone,payment_status").eq("agency_id", agency.id),
  ]);

  if (error) throw new Error("Unable to load clients.");
  const profileMap = indexBy(clientProfiles ?? [], (item) => item.exhibitor_id);

  return (
    <>
      <DashboardPageHeader eyebrow="Agency workspace" title="Clients" description="Manage platform exhibitors and custom external clients for your agency operations." />

      <section className="mt-7 grid gap-5 lg:grid-cols-2">
        <InviteExhibitorForm />
        <ExternalClientForm />
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-black tracking-tight">Client relationships</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {relationships?.map((row) => {
            const client = firstRelated(row.exhibitors);
            const details = client ? profileMap.get(client.id) : null;
            const wa = whatsappUrl(details?.whatsapp_phone || client?.contact_phone || "");

            return (
              <article className="panel p-6 rounded-2xl border border-[var(--line)] bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between" key={row.id}>
                <div>
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--line)]/60">
                    <span className={`badge capitalize ${row.status === "active" ? "status-verified" : "status-pending"}`}>
                      {row.status}
                    </span>
                    {details?.payment_status ? (
                      <span className="badge capitalize text-xs font-semibold">
                        Payment: {details.payment_status.replaceAll("_", " ")}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <Building2 size={18} className="text-[var(--accent)] shrink-0" />
                      <span>{client?.company_name ?? "Invited client"}</span>
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-[var(--muted)] flex items-center gap-1.5">
                      <User size={14} className="text-[var(--accent)] shrink-0" />
                      <span>{client?.primary_contact_name || row.invited_email || "Contact pending"}</span>
                    </p>
                  </div>
                </div>

                {row.status === "active" && client ? (
                  <div className="mt-5 pt-3 border-t border-[var(--line)]/60 flex flex-wrap items-center gap-2">
                    <Link className="button button-primary gap-1.5 text-xs px-4 py-2 shadow-xs" href={`/dashboard/agency/clients/${client.id}`}>
                      <span>Open profile</span>
                      <ArrowRight size={14} />
                    </Link>
                    {client.contact_phone ? (
                      <a className="button button-secondary gap-1 text-xs py-2 px-3" href={`tel:${client.contact_phone}`}>
                        <Phone size={14} />
                        <span>Call</span>
                      </a>
                    ) : null}
                    {wa ? (
                      <a className="button button-secondary gap-1 text-xs py-2 px-3 text-emerald-700 hover:bg-emerald-50 border-emerald-200" href={wa}>
                        <MessageSquare size={14} />
                        <span>WhatsApp</span>
                      </a>
                    ) : null}
                    {client.contact_email ? (
                      <a className="button button-secondary gap-1 text-xs py-2 px-3" href={`mailto:${client.contact_email}`}>
                        <Mail size={14} />
                        <span>Email</span>
                      </a>
                    ) : null}
                  </div>
                ) : null}

                {row.status === "pending" ? (
                  <div className="mt-5 pt-3 border-t border-[var(--line)]/60 flex gap-2">
                    <form action={updateAgencyRelationship}>
                      <input type="hidden" name="relationship_id" value={row.id} />
                      <input type="hidden" name="intent" value="resend" />
                      <button className="button button-secondary text-xs gap-1 py-2 px-3">
                        <RotateCw size={14} />
                        <span>Resend Invite</span>
                      </button>
                    </form>
                    <form action={updateAgencyRelationship}>
                      <input type="hidden" name="relationship_id" value={row.id} />
                      <input type="hidden" name="intent" value="cancel" />
                      <button className="button button-secondary text-xs gap-1 py-2 px-3 text-red-600 hover:bg-red-50 border-red-200">
                        <X size={14} />
                        <span>Cancel</span>
                      </button>
                    </form>
                  </div>
                ) : null}
              </article>
            );
          })}

          {!relationships?.length ? (
            <EmptyState title="No clients registered yet" description="Invite an exhibitor or add an external client to begin managing their operations." className="col-span-2" />
          ) : null}
        </div>
        <DashboardPagination path="/dashboard/agency/clients" page={pagination.page} hasNext={(relationships?.length??0)===pagination.pageSize} params={params}/>
      </section>
    </>
  );
}
