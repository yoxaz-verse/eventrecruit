import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";
import { Building2, Sparkles, ShieldCheck, Users, CalendarDays, ClipboardList, UserCheck, Star, LogOut } from "lucide-react";
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
    <div className="dashboard-shell grid min-h-screen grid-cols-1 md:grid-cols-[270px_1fr]">
      <aside className="dashboard-sidebar border-b border-[var(--line)] p-6 md:border-b-0 md:border-r flex flex-col justify-between">
        <div>
          <Link className="brand-link mb-8 inline-flex items-center gap-3" href="/">
            <span className="brand-mark" aria-hidden="true">
              <span className="brand-orbit brand-orbit-one" />
              <span className="brand-orbit brand-orbit-two" />
              <span className="brand-core" />
            </span>
            <span className="brand-wordmark">expo<span className="text-[var(--accent)] font-black">sphere</span></span>
          </Link>

          <nav className="grid gap-1.5">
            {nav[active].map((item) => {
              const Icon = item.icon;
              const isActive = item.href === (current ?? `/dashboard/${active}`);
              return (
                <Link
                  key={item.href}
                  className={`dashboard-nav-link text-sm font-semibold transition-all ${
                    isActive
                      ? "dashboard-nav-active shadow-sm font-bold"
                      : "hover:bg-white/80 text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                  href={item.href}
                >
                  <Icon size={19} aria-hidden />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <form action={signOut} className="mt-8 pt-4 border-t border-[var(--line)]">
          <SubmitButton className="button button-secondary w-full text-xs font-bold gap-2" pendingText="Signing out…">
            <LogOut size={16} aria-hidden />
            <span>Sign out</span>
          </SubmitButton>
        </form>
      </aside>
      <main className="p-6 md:p-10">{children}</main>
    </div>
  );
}

