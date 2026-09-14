import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ExhibitorDashboard() {
  const profile = await requireRole(["exhibitor"]);
  const db = await createClient();
  if (!db) throw new Error("Workspace is temporarily unavailable.");
  const { data: exhibitor } = await db.from("exhibitors").select("id,company_name").eq("owner_id", profile.id).maybeSingle();
  const submissions = exhibitor ? await db.from("exhibitor_event_submissions").select("id").eq("exhibitor_id", exhibitor.id) : { data: [], error: null };
  const requests = await db.from("events").select("id,staffing_roles(id)").eq("created_by", profile.id);
  if (submissions.error || requests.error) throw new Error("Unable to load workspace summary.");
  const requestCount = (requests.data ?? []).reduce((sum, event) => sum + (event.staffing_roles?.length ?? 0), 0);
  return <DashboardShell active="exhibitor"><span className="badge">Exhibitor panel</span><h1 className="mt-3 text-4xl font-black">{exhibitor?.company_name ?? "Exhibitor overview"}</h1><p className="mt-2 text-[var(--muted)]">Manage your event presence and the requests connected to it.</p>
    <div className="mt-8 grid gap-5 md:grid-cols-3"><Link className="panel p-6" href="/dashboard/exhibitor/events"><strong className="text-3xl">{submissions.data?.length ?? 0}</strong><p>Submitted events</p></Link><Link className="panel p-6" href="/dashboard/exhibitor/requests"><strong className="text-3xl">{requestCount}</strong><p>Staffing requests</p></Link><Link className="panel p-6" href="/dashboard/exhibitor/applicants"><strong className="text-xl">Applicants</strong><p>Review responses to your requests</p></Link></div>
    <div className="mt-8 flex flex-wrap gap-3"><Link className="button button-primary" href="/dashboard/exhibitor/requests/new">Create staffing request</Link><Link className="button button-secondary" href="/dashboard/exhibitor/events/new">Submit an event</Link></div>
  </DashboardShell>;
}
