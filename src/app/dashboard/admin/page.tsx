import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Users,
  CalendarDays,
  Sparkles,
  Briefcase,
  FileText,
  UserCheck,
  Ticket,
  Building2,
  Store,
  DollarSign,
  Star,
  CheckCircle2,
  Crown,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { adminCounts } from "@/lib/admin-data";
import { requireAdminWorkspace } from "@/lib/dashboard-workspace";

const metricConfig: Record<string, { icon: React.ElementType; bg: string; href: string }> = {
  "Users": { icon: Users, bg: "bg-blue-50 text-blue-600 border-blue-100", href: "/dashboard/admin/users" },
  "Organizer events": { icon: CalendarDays, bg: "bg-indigo-50 text-indigo-600 border-indigo-100", href: "/dashboard/admin/events" },
  "Event submissions": { icon: Sparkles, bg: "bg-sky-50 text-sky-600 border-sky-100", href: "/dashboard/admin/events?view=submissions" },
  "Staffing roles": { icon: Briefcase, bg: "bg-emerald-50 text-emerald-600 border-emerald-100", href: "/dashboard/admin/workforce" },
  "Applications": { icon: FileText, bg: "bg-amber-50 text-amber-600 border-amber-100", href: "/dashboard/admin/workforce?view=applications" },
  "Placements": { icon: UserCheck, bg: "bg-violet-50 text-violet-600 border-violet-100", href: "/dashboard/admin/workforce?view=placements" },
  "Bookings": { icon: Ticket, bg: "bg-purple-50 text-purple-600 border-purple-100", href: "/dashboard/admin/bookings" },
  "Space inquiries": { icon: Building2, bg: "bg-orange-50 text-orange-600 border-orange-100", href: "/dashboard/admin/bookings?view=inquiries" },
  "Agencies": { icon: ShieldCheck, bg: "bg-teal-50 text-teal-600 border-teal-100", href: "/dashboard/admin/organizations?view=agencies" },
  "Exhibitors": { icon: Store, bg: "bg-rose-50 text-rose-600 border-rose-100", href: "/dashboard/admin/organizations?view=exhibitors" },
  "Commissions": { icon: DollarSign, bg: "bg-green-50 text-green-600 border-green-100", href: "/dashboard/admin/network?view=commissions" },
  "Reviews": { icon: Star, bg: "bg-yellow-50 text-yellow-600 border-yellow-100", href: "/dashboard/admin/reputation" },
};

export default async function AdminDashboard() {
  const { db } = await requireAdminWorkspace();
  const [counts, pendingProfiles, pendingEvents, newInquiries, pendingRelationships, cancellationRequests, hiddenReviews] = await Promise.all([
    adminCounts(),
    db.from("profiles").select("id,full_name,role,verification_status,created_at").eq("verification_status", "pending_verification").neq("role", "admin").order("created_at", { ascending: false }).limit(5),
    db.from("exhibitor_event_submissions").select("id,title,status,created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(5),
    db.from("event_space_inquiries").select("id,event_id,status,created_at").eq("status", "new").order("created_at", { ascending: false }).limit(5),
    db.from("agency_exhibitor_relationships").select("id,invited_email,status,created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(5),
    db.from("applications").select("id,talent_id,status,cancellation_requested_at").not("cancellation_requested_at", "is", null).order("cancellation_requested_at", { ascending: false }).limit(5),
    db.from("placement_reviews").select("id,rating,visibility_status,created_at").eq("visibility_status", "hidden").order("created_at", { ascending: false }).limit(5),
  ]);

  if ([pendingProfiles, pendingEvents, newInquiries, pendingRelationships, cancellationRequests, hiddenReviews].some(x => x.error && x.error.code !== "PGRST205")) {
    throw new Error("Unable to load one or more admin attention queues.");
  }

  const queues = [
    { label: "Users awaiting verification", href: "/dashboard/admin/users?status=pending_verification", rows: pendingProfiles.data?.map(x => ({ name: x.full_name, detail: x.role, status: x.verification_status })) ?? [] },
    { label: "Events awaiting review", href: "/dashboard/admin/events?status=pending", rows: pendingEvents.data?.map(x => ({ name: x.title, detail: "Exhibitor submission", status: x.status })) ?? [] },
    { label: "New space inquiries", href: "/dashboard/admin/bookings?status=new", rows: newInquiries.data?.map(x => ({ name: `Inquiry ${x.id.slice(0, 8)}`, detail: `Event ${x.event_id.slice(0, 8)}`, status: x.status })) ?? [] },
    { label: "Pending agency relationships", href: "/dashboard/admin/network?status=pending", rows: pendingRelationships.data?.map(x => ({ name: x.invited_email || "Agency invitation", detail: "Relationship request", status: x.status })) ?? [] },
    { label: "Cancellation requests", href: "/dashboard/admin/workforce", rows: cancellationRequests.data?.map(x => ({ name: `Application ${x.id.slice(0, 8)}`, detail: `Talent ${x.talent_id.slice(0, 8)}`, status: x.status })) ?? [] },
    { label: "Hidden reviews", href: "/dashboard/admin/reputation?status=hidden", rows: hiddenReviews.data?.map(x => ({ name: `${x.rating}-star review`, detail: `Review ${x.id.slice(0, 8)}`, status: x.visibility_status })) ?? [] },
  ];

  return (
    <>
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-8 text-white shadow-xl mb-8">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-indigo-300 border border-white/10 backdrop-blur-md">
              <Crown size={14} className="text-amber-400" /> Platform Control Center
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-white">
              Admin Control Center
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300 leading-relaxed">
              Live operational telemetry, automated verification queues, placement tracking, and system moderation tools.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link className="button button-primary gap-2 bg-white text-slate-900 hover:bg-blue-50 shadow-lg border-0" href="/dashboard/admin/users">
              <Users size={17} className="text-blue-600" />
              <span>Manage Users</span>
            </Link>
            <Link className="button button-secondary gap-2 text-white border-white/20 bg-white/10 hover:bg-white/20" href="/dashboard/admin/verifications">
              <ShieldCheck size={17} />
              <span>Verifications</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {counts.map((item) => {
          const cfg = metricConfig[item.label] ?? { icon: Users, bg: "bg-blue-50 text-blue-600 border-blue-100", href: "/dashboard/admin" };
          const Icon = cfg.icon;

          return (
            <Link
              className="panel p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group flex flex-col justify-between bg-white border border-[var(--line)] rounded-2xl cursor-pointer"
              href={cfg.href}
              key={item.label}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">{item.label}</span>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${cfg.bg} group-hover:scale-110 transition-transform shadow-2xs`}>
                  <Icon size={19} />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <strong className="text-3xl font-black text-slate-900">{item.value.toLocaleString("en-IN")}</strong>
                <ArrowRight size={15} className="text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          );
        })}
      </section>

      {/* Needs Attention Queue Grid */}
      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
            <AlertTriangle size={19} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Needs Attention</h2>
            <p className="text-xs font-semibold text-[var(--muted)]">Records requiring administrator review or action</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {queues.map((queue) => (
            <article className="panel p-5 rounded-2xl bg-white border border-[var(--line)] shadow-xs flex flex-col justify-between" key={queue.label}>
              <div>
                <div className="mb-4 flex items-center justify-between gap-3 pb-3 border-b border-[var(--line)]/60">
                  <h3 className="font-extrabold text-base text-slate-900">{queue.label}</h3>
                  <Link className="flex items-center gap-1 text-xs font-bold text-[var(--accent)] hover:underline" href={queue.href}>
                    <span>Manage</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="grid gap-2.5">
                  {queue.rows.map((row, index) => (
                    <div className="surface-card flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-white transition-colors" key={`${row.name}-${index}`}>
                      <div>
                        <strong className="text-xs font-extrabold text-slate-900 block">{row.name}</strong>
                        <p className="text-[11px] font-medium text-[var(--muted)]">{row.detail}</p>
                      </div>
                      <StatusBadge status={row.status} />
                    </div>
                  ))}
                  {queue.rows.length === 0 && (
                    <div className="py-4 text-center">
                      <CheckCircle2 size={20} className="mx-auto text-emerald-500 mb-1" />
                      <p className="text-xs font-semibold text-[var(--muted)]">All clear. Nothing needs attention.</p>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Protected Administration Footer */}
      <section className="panel mt-8 flex items-start gap-4 p-6 rounded-2xl bg-white border border-[var(--line)] shadow-xs">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[var(--accent)] border border-blue-100">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">Protected Administration</h2>
          <p className="mt-1 text-xs font-semibold text-[var(--muted)] leading-relaxed">
            Every view and mutation rechecks the administrator session. Personal contacts stay masked until explicitly revealed for security and privacy compliance.
          </p>
        </div>
      </section>
    </>
  );
}
