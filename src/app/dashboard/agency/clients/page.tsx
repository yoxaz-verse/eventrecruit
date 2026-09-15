import { DashboardShell } from "@/components/dashboard-shell";
import { ExternalClientForm, InviteExhibitorForm } from "@/components/agency-client-forms";
import { updateAgencyRelationship } from "@/app/actions/agency-clients";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AgencyClientsPage() {
  const profile=await requireRole(["agency"]); const db=await createClient(); if(!db) throw new Error("Workspace unavailable.");
  const {data:agency}=await db.from("agencies").select("id").eq("owner_id",profile.id).maybeSingle();
  const {data:relationships,error}=agency?await db.from("agency_exhibitor_relationships").select("id,status,invited_email,created_at,exhibitors(company_name,kind)").eq("agency_id",agency.id).order("created_at",{ascending:false}):{data:[],error:null};
  if(error) throw new Error("Unable to load clients.");
  return <DashboardShell active="agency" current="/dashboard/agency/clients"><span className="badge badge-accent">Agency panel</span><h1 className="mt-3 text-4xl font-black">Exhibitor clients</h1><p className="mt-2 text-[var(--muted)]">Platform exhibitors approve access. External clients are clearly categorized and can be claimed later.</p><section className="mt-7 grid gap-5 lg:grid-cols-2"><InviteExhibitorForm/><ExternalClientForm/></section><section className="mt-8"><h2 className="mb-4 text-2xl font-black">Relationships</h2><div className="grid gap-4">{relationships?.map(row=>{const exhibitor=Array.isArray(row.exhibitors)?row.exhibitors[0]:row.exhibitors;return <article className="panel flex flex-wrap items-center justify-between gap-4 p-5" key={row.id}><div><span className="badge capitalize">{row.status}</span><h3 className="mt-2 text-lg font-black">{exhibitor?.company_name??"Invited exhibitor"}</h3><p className="text-sm text-[var(--muted)]">{exhibitor?.kind??"platform"}{row.invited_email?` · ${row.invited_email}`:""}</p></div>{row.status==="pending"?<div className="flex gap-2"><form action={updateAgencyRelationship}><input type="hidden" name="relationship_id" value={row.id}/><input type="hidden" name="intent" value="resend"/><button className="button button-secondary">Resend</button></form><form action={updateAgencyRelationship}><input type="hidden" name="relationship_id" value={row.id}/><input type="hidden" name="intent" value="cancel"/><button className="button button-secondary">Cancel</button></form></div>:null}</article>})}{!relationships?.length?<p className="panel p-5">No clients yet.</p>:null}</div></section></DashboardShell>;
}
