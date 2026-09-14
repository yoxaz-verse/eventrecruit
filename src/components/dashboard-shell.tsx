import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";
import { BriefcaseBusiness, Building2, Sparkles, ShieldCheck, Users, CalendarDays, ClipboardList, UserCheck, Star } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import type { UserRole } from "@/lib/types";

const nav = {
  organizer: [{ href: "/dashboard/organizer", label: "Overview", icon: Building2 }, { href: "/dashboard/organizer/events/new", label: "Create event", icon: CalendarDays }, { href: "/dashboard/organizer/company", label: "Company", icon: Building2 }],
  admin: [{ href: "/dashboard/admin", label: "Overview", icon: ShieldCheck }, { href: "/dashboard/admin/events", label: "Event reviews", icon: CalendarDays }],
  agency: [{ href: "/dashboard/agency", label: "Overview", icon: Users }],
  exhibitor: [{ href: "/dashboard/exhibitor", label: "Overview", icon: Building2 }, { href: "/dashboard/exhibitor/events", label: "Events", icon: CalendarDays }, { href: "/dashboard/exhibitor/requests", label: "Requests", icon: ClipboardList }, { href: "/dashboard/exhibitor/applicants", label: "Applicants", icon: UserCheck }, { href: "/dashboard/exhibitor/reputation", label: "Reputation", icon: Star }],
  talent: [{ href: "/dashboard/talent", label: "Overview", icon: Sparkles }],
};

export function DashboardShell({
  active,
  current,
  children,
}: {
  active: UserRole;
  current?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-shell grid min-h-screen grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="dashboard-sidebar border-b border-[var(--line)] p-5 md:border-b-0 md:border-r">
        <Link className="brand-link mb-8" href="/">
          <span className="brand-mark">
            <BriefcaseBusiness size={20} aria-hidden />
          </span>
          <span>expo sphere</span>
        </Link>
        <nav className="grid gap-2">
          {nav[active].map((item) => {
            const Icon = item.icon;
            const isActive = item.href === (current ?? `/dashboard/${active}`);
            return (
              <Link
                key={item.href}
                className={`dashboard-nav-link ${isActive ? "dashboard-nav-active" : ""}`}
                href={item.href}
              >
                <Icon size={18} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <form action={signOut} className="mt-8">
          <SubmitButton className="button button-secondary w-full" pendingText="Signing out…">Sign out</SubmitButton>
        </form>
      </aside>
      <main className="p-5 md:p-8">{children}</main>
    </div>
  );
}
