import Link from "next/link";
import { BriefcaseBusiness, Building2, Sparkles, ShieldCheck, Users } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import type { UserRole } from "@/lib/types";

const nav = [
  { href: "/dashboard/organizer", label: "Event Organizer", icon: Building2 },
  { href: "/dashboard/admin", label: "Admin", icon: ShieldCheck },
  { href: "/dashboard/agency", label: "Agency", icon: Users },
  { href: "/dashboard/exhibitor", label: "Exhibitor", icon: Building2 },
  { href: "/dashboard/talent", label: "Event Talent", icon: Sparkles },
];

export function DashboardShell({
  active,
  children,
}: {
  active: UserRole;
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-shell grid min-h-screen grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="dashboard-sidebar border-b border-[var(--line)] p-5 md:border-b-0 md:border-r">
        <Link className="brand-link mb-8" href="/">
          <span className="brand-mark">
            <BriefcaseBusiness size={20} aria-hidden />
          </span>
          <span>EventRecruit</span>
        </Link>
        <nav className="grid gap-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = item.href.endsWith(active);
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
          <button className="button button-secondary w-full" type="submit">
            Sign out
          </button>
        </form>
      </aside>
      <main className="p-5 md:p-8">{children}</main>
    </div>
  );
}
