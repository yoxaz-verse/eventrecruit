import Link from "next/link";
import { Building2, CalendarDays, ClipboardList, UserCheck, Users, Briefcase, Bell, UserPlus, PlusCircle, ArrowRight, Sparkles } from "lucide-react";

import { getAgencyDashboard } from "@/lib/agency-data";

export default async function AgencyDashboard() {
  const data = await getAgencyDashboard();
  if (!data) throw new Error("Agency workspace unavailable.");

  const cards = [
    { label: "Total Staff", value: data.metrics.totalStaff, href: "/dashboard/agency/staff", icon: Users, bg: "bg-blue-50 text-blue-600" },
    { label: "Available Staff", value: data.metrics.availableStaff, href: "/dashboard/agency/staff?availability=available", icon: UserCheck, bg: "bg-emerald-50 text-emerald-600" },
    { label: "Assigned Staff", value: data.metrics.assignedStaff, href: "/dashboard/agency/staff?assignment=assigned", icon: Users, bg: "bg-violet-50 text-violet-600" },
    { label: "Upcoming Events", value: data.metrics.upcomingEvents, href: "/dashboard/agency/events", icon: CalendarDays, bg: "bg-indigo-50 text-indigo-600" },
    { label: "Active Applications", value: data.metrics.activeApplications, href: "/dashboard/agency/applicants", icon: ClipboardList, bg: "bg-amber-50 text-amber-600" },
    { label: "Pending Approvals", value: data.metrics.pendingApprovals, href: "/dashboard/agency/applicants?status=shortlisted", icon: UserCheck, bg: "bg-orange-50 text-orange-600" },
    { label: "Active Clients", value: data.metrics.activeClients, href: "/dashboard/agency/clients", icon: Building2, bg: "bg-sky-50 text-sky-600" },
    { label: "Current Operations", value: data.metrics.activeOperations, href: "/dashboard/agency/operations", icon: Briefcase, bg: "bg-rose-50 text-rose-600" },
  ];

  return (
    <>
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-8 text-white shadow-xl mb-8">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-indigo-200 border border-indigo-400/30">
              <Sparkles size={13} className="text-amber-400" /> Agency Command Center
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-white">
              {data.agency.name}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-indigo-100/80 leading-relaxed">
              Real-time overview of active staffing operations, client requirements, talent allocation, and application approvals.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link className="button button-primary gap-2 bg-white text-slate-900 hover:bg-blue-50 shadow-lg border-0" href="/dashboard/agency/staff?add=1">
              <UserPlus size={17} className="text-blue-600" />
              <span>Add Staff</span>
            </Link>
            <Link className="button button-secondary gap-2 text-white border-white/20 bg-white/10 hover:bg-white/20" href="/dashboard/agency/clients">
              <Building2 size={17} />
              <span>Add Client</span>
            </Link>
            <Link className="button button-secondary gap-2 text-white border-white/20 bg-white/10 hover:bg-white/20" href="/dashboard/agency/requests/new">
              <PlusCircle size={17} />
              <span>New Requirement</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, href, icon: Icon, bg }) => (
          <Link
            className="panel p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group flex flex-col justify-between min-h-[140px] bg-white border border-[var(--line)] rounded-2xl"
            href={href}
            key={label}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">{label}</p>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} group-hover:scale-110 transition-transform shadow-2xs`}>
                <Icon size={20} />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <strong className="text-3xl font-black text-[var(--foreground)]">{value}</strong>
              <ArrowRight size={15} className="text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      {/* Operations & Notifications Grid */}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Briefcase size={22} className="text-[var(--accent)]" />
              <span>Active Operations</span>
            </h2>
            <Link className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1" href="/dashboard/agency/operations">
              <span>View all operations</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid gap-3">
            {data.operations.map((operation) => (
              <Link
                href={`/dashboard/agency/operations/${operation.id}`}
                className="panel flex items-center justify-between gap-4 p-5 hover:shadow-md transition-all bg-white border border-[var(--line)] rounded-2xl group"
                key={operation.id}
              >
                <div>
                  <h3 className="font-extrabold text-base text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">Staffing Operation</h3>
                  <p className="text-xs capitalize text-[var(--muted)] mt-0.5 font-medium">Status: {operation.operation_status.replaceAll("_", " ")}</p>
                </div>
                <span className="badge badge-accent capitalize text-xs px-3 py-1 font-bold">{operation.publication_status}</span>
              </Link>
            ))}
            {!data.operations.length ? (
              <div className="panel p-6 text-center text-sm text-[var(--muted)] bg-white rounded-2xl">
                No active operations yet. Create an event requirement to begin tracking talent.
              </div>
            ) : null}
          </div>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-black tracking-tight">
            <Bell size={22} className="text-[var(--accent)]" />
            <span>Notifications</span>
          </h2>
          <div className="panel divide-y divide-[var(--line)] bg-white border border-[var(--line)] rounded-2xl overflow-hidden shadow-xs">
            {data.notifications.map((note) => (
              <Link className="block p-4 hover:bg-[var(--surface)] transition-colors" href={note.href || "/dashboard/agency/notifications"} key={note.id}>
                <strong className="text-sm font-bold block text-[var(--foreground)]">{note.title}</strong>
                <p className="text-xs text-[var(--muted)] mt-1">{note.body}</p>
              </Link>
            ))}
            {!data.notifications.length ? (
              <p className="p-6 text-center text-xs text-[var(--muted)]">No new notifications right now.</p>
            ) : null}
          </div>
        </section>
      </div>
    </>
  );
}
