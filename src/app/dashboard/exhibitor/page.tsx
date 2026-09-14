import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CalendarDays, ClipboardList, Users, PlusCircle, ArrowRight, Building2 } from "lucide-react";

export default async function ExhibitorDashboard() {
  const profile = await requireRole(["exhibitor"]);
  const db = await createClient();
  if (!db) throw new Error("Workspace is temporarily unavailable.");
  const { data: exhibitor } = await db.from("exhibitors").select("id,company_name").eq("owner_id", profile.id).maybeSingle();
  const submissions = exhibitor ? await db.from("exhibitor_event_submissions").select("id").eq("exhibitor_id", exhibitor.id) : { data: [], error: null };
  const requests = await db.from("events").select("id,staffing_roles(id)").eq("created_by", profile.id);
  if (submissions.error || requests.error) throw new Error("Unable to load workspace summary.");
  const requestCount = (requests.data ?? []).reduce((sum, event) => sum + (event.staffing_roles?.length ?? 0), 0);

  return (
    <DashboardShell active="exhibitor">
      <span className="badge badge-accent">Exhibitor panel</span>
      <h1 className="mt-3 text-4xl font-black tracking-tight">{exhibitor?.company_name ?? "Exhibitor overview"}</h1>
      <p className="mt-2 text-[var(--muted)]">Manage your event presence, staffing requests, and applicant reviews.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Link className="panel p-6 transition-all hover:shadow-lg group flex flex-col justify-between min-h-[160px]" href="/dashboard/exhibitor/events">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">Submitted events</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[var(--accent)] group-hover:scale-110 transition-transform">
                <CalendarDays size={20} aria-hidden />
              </div>
            </div>
            <strong className="mt-3 block text-4xl font-black text-[var(--foreground)]">{submissions.data?.length ?? 0}</strong>
          </div>
          <p className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1 mt-4">
            <span>Manage events</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" aria-hidden />
          </p>
        </Link>

        <Link className="panel p-6 transition-all hover:shadow-lg group flex flex-col justify-between min-h-[160px]" href="/dashboard/exhibitor/requests">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">Staffing requests</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 group-hover:scale-110 transition-transform">
                <ClipboardList size={20} aria-hidden />
              </div>
            </div>
            <strong className="mt-3 block text-4xl font-black text-[var(--foreground)]">{requestCount}</strong>
          </div>
          <p className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1 mt-4">
            <span>View requests</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" aria-hidden />
          </p>
        </Link>

        <Link className="panel p-6 transition-all hover:shadow-lg group flex flex-col justify-between min-h-[160px]" href="/dashboard/exhibitor/applicants">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">Applicants</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 group-hover:scale-110 transition-transform">
                <Users size={20} aria-hidden />
              </div>
            </div>
            <strong className="mt-3 block text-xl font-bold text-[var(--foreground)]">Review responses</strong>
          </div>
          <p className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1 mt-4">
            <span>Review applicants</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" aria-hidden />
          </p>
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-3.5">
        <Link className="button button-primary gap-2 shadow-md hover:shadow-lg" href="/dashboard/exhibitor/requests/new">
          <PlusCircle size={18} aria-hidden />
          <span>Create staffing request</span>
        </Link>
        <Link className="button button-secondary gap-2" href="/dashboard/exhibitor/events/new">
          <CalendarDays size={18} className="text-[var(--accent)]" aria-hidden />
          <span>Submit an event</span>
        </Link>
      </div>
    </DashboardShell>
  );
}

