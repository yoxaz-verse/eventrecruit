import { updateApplicationStatus } from "@/app/actions/workflow";
import { AgencyClientSelector } from "@/components/agency-client-selector";
import { DashboardShell } from "@/components/dashboard-shell";
import { SubmitButton } from "@/components/submit-button";
import { WorkflowActionForm } from "@/components/workflow-action-form";
import { agencyClients, selectedAgencyClient } from "@/lib/agency-workspace";
import { createClient } from "@/lib/supabase/server";

export default async function AgencyApplicants({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const clients = await agencyClients();
  const selected = selectedAgencyClient(clients, (await searchParams).client);
  const db = await createClient();
  if (!db) throw new Error("Applicants unavailable.");
  const { data: events, error } = selected
    ? await db.from("events").select("id,title,staffing_roles(id,title,headcount,applications(id,status,talent_id,cancellation_requested_at))").eq("exhibitor_id", selected.exhibitorId)
    : { data: [], error: null };
  if (error) throw new Error("Unable to load applicants.");
  const apps = (events ?? []).flatMap(event => (event.staffing_roles ?? []).flatMap(role => (role.applications ?? []).map(application => ({ ...application, event: event.title, role: role.title, headcount: role.headcount }))));
  const { data: people } = apps.length
    ? await db.from("profiles").select("id,full_name,city,avatar_url").in("id", [...new Set(apps.map(application => application.talent_id))])
    : { data: [] };
  const names = new Map((people ?? []).map(person => [person.id, person]));
  return <DashboardShell active="agency" current="/dashboard/agency/applicants">
    <h1 className="text-4xl font-black">Client applicants</h1>
    <AgencyClientSelector clients={clients} selected={selected} path="/dashboard/agency/applicants"/>
    <div className="grid gap-4">{apps.map(application => {
      const person = names.get(application.talent_id);
      return <article className="panel p-5" key={application.id}>
        <div className="flex items-start gap-4">{person?.avatar_url ? <img className="h-16 w-16 rounded-full border border-[var(--line)] object-cover" src={`/api/media/talent/${application.talent_id}`} alt={`${person.full_name} profile picture`}/> : null}<div><span className="badge capitalize">{application.status}</span><h2 className="mt-3 text-xl font-black">{person?.full_name ?? "Applicant"}</h2><p>{application.role} · {application.event}</p><p className="text-sm text-[var(--muted)]">{person?.city ?? "City unavailable"}</p></div></div>
        <WorkflowActionForm action={updateApplicationStatus} className="mt-4 flex flex-wrap items-end gap-3"><input type="hidden" name="application_id" value={application.id}/><label className="label">Status<select className="input" name="status" defaultValue={application.status}>{["applied", "shortlisted", "accepted", "rejected", "completed", "cancelled"].map(status => <option key={status}>{status}</option>)}</select></label><SubmitButton pendingText="Saving…">Save</SubmitButton></WorkflowActionForm>
      </article>;
    })}{selected && !apps.length ? <p className="panel p-5">No applications for this client.</p> : null}</div>
  </DashboardShell>;
}
