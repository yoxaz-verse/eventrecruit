import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CalendarDays, ClipboardList, Users, PlusCircle, ArrowRight, Sparkles, Building2 } from "lucide-react";
import { ProfileImageForm } from "@/components/profile-image-form";

export default async function ExhibitorDashboard() {
  const profile = await requireRole(["exhibitor"]);
  const db = await createClient();
  if (!db) throw new Error("Workspace is temporarily unavailable.");
  const { data: exhibitor } = await db.from("exhibitors").select("id,company_name,logo_path").eq("owner_id", profile.id).maybeSingle();
  const [submissions, requests] = await Promise.all([
    exhibitor ? db.from("exhibitor_event_submissions").select("id").eq("exhibitor_id", exhibitor.id) : Promise.resolve({ data: [], error: null }),
    db.from("events").select("id,staffing_roles(id)").eq("created_by", profile.id),
  ]);
  if (submissions.error || requests.error) throw new Error("Unable to load workspace summary.");
  const requestCount = (requests.data ?? []).reduce((sum, event) => sum + (event.staffing_roles?.length ?? 0), 0);

  return (
    <DashboardShell active="exhibitor">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-8 text-white shadow-xl mb-8">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-blue-200 border border-blue-400/30">
              <Sparkles size={13} className="text-amber-400" /> Exhibitor Panel
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-white">
              {exhibitor?.company_name ?? "Exhibitor Overview"}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-blue-100/80 leading-relaxed">
              Manage your upcoming event presence, create staffing requirements, and review talent applications across India.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="button button-primary gap-2 bg-white text-slate-900 hover:bg-blue-50 shadow-lg border-0" href="/dashboard/exhibitor/requests/new">
              <PlusCircle size={17} className="text-blue-600" aria-hidden />
              <span>Create Staffing Request</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Link className="panel p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group flex flex-col justify-between min-h-[170px] border border-[var(--line)] bg-white rounded-2xl" href="/dashboard/exhibitor/events">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">Submitted Events</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[var(--accent)] group-hover:scale-110 transition-transform shadow-2xs">
                <CalendarDays size={22} aria-hidden />
              </div>
            </div>
            <strong className="mt-4 block text-4xl font-black text-[var(--foreground)]">{submissions.data?.length ?? 0}</strong>
          </div>
          <p className="text-xs font-bold text-[var(--accent)] flex items-center gap-1.5 mt-5">
            <span>Manage submitted events</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" aria-hidden />
          </p>
        </Link>

        <Link className="panel p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group flex flex-col justify-between min-h-[170px] border border-[var(--line)] bg-white rounded-2xl" href="/dashboard/exhibitor/requests">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">Staffing Requests</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 group-hover:scale-110 transition-transform shadow-2xs">
                <ClipboardList size={22} aria-hidden />
              </div>
            </div>
            <strong className="mt-4 block text-4xl font-black text-[var(--foreground)]">{requestCount}</strong>
          </div>
          <p className="text-xs font-bold text-[var(--accent)] flex items-center gap-1.5 mt-5">
            <span>View staffing requirements</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" aria-hidden />
          </p>
        </Link>

        <Link className="panel p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group flex flex-col justify-between min-h-[170px] border border-[var(--line)] bg-white rounded-2xl" href="/dashboard/exhibitor/applicants">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">Applicants</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 group-hover:scale-110 transition-transform shadow-2xs">
                <Users size={22} aria-hidden />
              </div>
            </div>
            <strong className="mt-4 block text-xl font-bold text-[var(--foreground)]">Review Applications</strong>
          </div>
          <p className="text-xs font-bold text-[var(--accent)] flex items-center gap-1.5 mt-5">
            <span>Review responses</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" aria-hidden />
          </p>
        </Link>
      </div>

      {/* Quick Action Row & Secondary Options */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="button button-primary gap-2 shadow-md hover:shadow-lg" href="/dashboard/exhibitor/requests/new">
          <PlusCircle size={18} aria-hidden />
          <span>Create Staffing Request</span>
        </Link>
        <Link className="button button-secondary gap-2" href="/dashboard/exhibitor/events/new">
          <CalendarDays size={18} className="text-[var(--accent)]" aria-hidden />
          <span>Submit an Event</span>
        </Link>
        <Link className="button button-secondary gap-2" href="/dashboard/exhibitor/agencies">
          <Building2 size={18} className="text-[var(--accent)]" aria-hidden />
          <span>Partner Agencies</span>
        </Link>
      </div>

      {/* Exhibitor Branding Panel */}
      {exhibitor ? (
        <div className="panel mt-8 max-w-2xl p-6 bg-white border border-[var(--line)] rounded-2xl shadow-xs">
          <h3 className="font-extrabold text-base mb-1">Company Branding</h3>
          <p className="mb-4 text-xs text-[var(--muted)]">Your logo is private. Only you, administrators, and actively assigned staffing agencies can view it.</p>
          <ProfileImageForm kind="Exhibitor logo" imageUrl={exhibitor.logo_path ? `/api/media/exhibitor/${exhibitor.id}` : null} />
        </div>
      ) : null}
    </DashboardShell>
  );
}

