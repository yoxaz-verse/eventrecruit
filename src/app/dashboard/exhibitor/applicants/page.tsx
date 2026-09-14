import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { WorkflowActionForm } from "@/components/workflow-action-form";
import { updateApplicationStatus } from "@/app/actions/workflow";
import { SubmitButton } from "@/components/submit-button";

export default async function ExhibitorApplicants() {
  const profile = await requireRole(["exhibitor"]);
  const db = await createClient();
  if (!db) throw new Error("Applicants are temporarily unavailable.");
  const { data: events, error } = await db.from("events").select("id,title,staffing_roles(id,title,applications(id,status,talent_id))").eq("created_by", profile.id);
  if (error) throw new Error("Unable to load applicants.");
  const applications = (events ?? []).flatMap(event => (event.staffing_roles ?? []).flatMap(role => (role.applications ?? []).map(application => ({...application, role: role.title, event: event.title}))));
  const profiles = applications.length ? await db.from("profiles").select("id,full_name,city").in("id", [...new Set(applications.map(item => item.talent_id))]) : { data: [], error: null };
  if (profiles.error) throw new Error("Unable to load applicant profiles.");
  const byId = new Map((profiles.data ?? []).map(person => [person.id, person]));
  return <DashboardShell active="exhibitor" current="/dashboard/exhibitor/applicants"><span className="badge">Exhibitor panel</span><h1 className="mt-3 mb-6 text-4xl font-black">Applicants</h1><div className="grid gap-4">{applications.map(application => <article className="panel p-5" key={application.id}><span className="badge capitalize">{application.status}</span><h2 className="mt-3 text-xl font-bold">{byId.get(application.talent_id)?.full_name ?? "Applicant"}</h2><p>{application.role} · {application.event}</p><p className="text-sm text-[var(--muted)]">{byId.get(application.talent_id)?.city ?? "City not provided"}</p><WorkflowActionForm action={updateApplicationStatus} className="mt-4 flex flex-wrap items-center gap-3"><input type="hidden" name="application_id" value={application.id}/><label className="label">Update status<select className="input" name="status" defaultValue={application.status}>{["applied","shortlisted","accepted","rejected","completed","cancelled"].map(status => <option key={status} value={status}>{status}</option>)}</select></label><SubmitButton pendingText="Updating…">Save</SubmitButton></WorkflowActionForm></article>)}{!applications.length && <p className="panel p-5">No applications for your staffing requests yet.</p>}</div></DashboardShell>;
}
