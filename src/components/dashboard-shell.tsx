import Link from "next/link";
import { Building2, Sparkles, ShieldCheck, Users, CalendarDays, ClipboardList, UserCheck, Star, Compass, Briefcase, Globe, Menu } from "lucide-react";
import type { UserRole } from "@/lib/types";
import { SidebarLiveWidget } from "@/components/sidebar-live-widget";
import { SidebarMiddleCard } from "@/components/sidebar-middle-card";
import { MobileAppDock } from "@/components/mobile-app-dock";

const mainNav = {
  organizer: [
    { href: "/dashboard/organizer", label: "Overview", icon: Building2 },
    { href: "/dashboard/organizer/events/new", label: "Create event", icon: CalendarDays },
    { href: "/dashboard/organizer/company", label: "Company Profile", icon: Building2 },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Overview", icon: ShieldCheck },
    { href: "/dashboard/admin/events", label: "Event reviews", icon: CalendarDays },
  ],
  agency: [
    { href: "/dashboard/agency", label: "Overview", icon: Users },
  ],
  exhibitor: [
    { href: "/dashboard/exhibitor", label: "Overview", icon: Building2 },
    { href: "/dashboard/exhibitor/events", label: "My Events", icon: CalendarDays },
    { href: "/dashboard/exhibitor/space-inquiries", label: "Space Inquiries", icon: ClipboardList },
    { href: "/dashboard/exhibitor/requests", label: "Staff Requests", icon: ClipboardList },
    { href: "/dashboard/exhibitor/applicants", label: "Applicants", icon: UserCheck },
    { href: "/dashboard/exhibitor/reputation", label: "Reputation", icon: Star },
  ],
  talent: [
    { href: "/dashboard/talent", label: "Overview", icon: Sparkles },
  ],
};

const exploreNav = [
  { href: "/browse", label: "Browse Open Roles", icon: Briefcase },
  { href: "/events", label: "Public Events", icon: Globe },
];

export function DashboardShell({
  active,
  current,
  children,
}: {
  active: UserRole;
  current?: string;
  children: React.ReactNode;
}) {
  const currentPath = current ?? `/dashboard/${active}`;

  return (
    <div className="dashboard-shell grid min-h-screen grid-cols-1 md:grid-cols-[285px_1fr] bg-[var(--background)]">
      
      {/* Mobile Top App Bar */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[var(--line)] px-4 py-3 flex items-center justify-between shadow-xs">
        <Link className="brand-link flex items-center gap-2.5" href="/">
          <span className="brand-mark shadow-xs" aria-hidden="true">
            <span className="brand-orbit brand-orbit-one" />
            <span className="brand-orbit brand-orbit-two" />
            <span className="brand-core" />
          </span>
          <span className="brand-wordmark font-black tracking-tight text-base">
            expo<span className="text-[var(--accent)]">rb</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--accent)] bg-[var(--surface)] px-2 py-0.5 rounded-md border border-[var(--line)]">
            {active}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </header>

      {/* Desktop Floating Segmented Sidebar (Hidden on Mobile) */}
      <aside className="dashboard-sidebar hidden md:flex p-4 md:py-6 md:pl-6 md:pr-3 flex-col justify-between gap-4 sticky top-0 h-screen">
        
        {/* Top Section Box: Brand Header & Navigation */}
        <div className="panel p-5 rounded-2xl bg-white shadow-sm border border-[var(--line)] flex flex-col justify-between overflow-y-auto">
          <div>
            <Link className="brand-link mb-5 inline-flex items-center gap-3" href="/">
              <span className="brand-mark shadow-xs" aria-hidden="true">
                <span className="brand-orbit brand-orbit-one" />
                <span className="brand-orbit brand-orbit-two" />
                <span className="brand-core" />
              </span>
              <span className="brand-wordmark font-black tracking-tight">
                expo<span className="text-[var(--accent)]">rb</span>
              </span>
            </Link>

            <div className="mb-4 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--accent)] bg-[var(--surface)] px-2.5 py-1 rounded-md border border-[var(--line)] block w-fit">
                {active} portal
              </span>
              <span className="text-[10px] font-bold text-[var(--muted)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Active
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)] px-1 mb-2">
                  Management
                </p>
                <nav className="grid gap-1">
                  {mainNav[active].map((item) => {
                    const Icon = item.icon;
                    const isActive = item.href === currentPath;
                    return (
                      <Link
                        key={item.href}
                        className={`dashboard-nav-link text-xs font-bold transition-all px-3 py-2.5 rounded-xl flex items-center gap-2.5 ${
                          isActive
                            ? "dashboard-nav-active shadow-sm text-white"
                            : "hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                        href={item.href}
                      >
                        <Icon size={17} aria-hidden />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-3 border-t border-[var(--line)]">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)] px-1 mb-2 flex items-center gap-1.5">
                  <Compass size={12} className="text-[var(--accent)]" />
                  Quick Explore
                </p>
                <nav className="grid gap-1">
                  {exploreNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.href === currentPath;
                    return (
                      <Link
                        key={item.href}
                        className={`dashboard-nav-link text-xs font-bold transition-all px-3 py-2 rounded-xl flex items-center gap-2.5 ${
                          isActive
                            ? "dashboard-nav-active shadow-sm text-white"
                            : "hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                        href={item.href}
                      >
                        <Icon size={16} aria-hidden />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section Box: Priority Status & Quick Tip Card */}
        <SidebarMiddleCard active={active} />

        {/* Bottom Section Box: Live Time & Bookings Status Widget */}
        <div className="panel p-4 rounded-2xl bg-white shadow-sm border border-[var(--line)]">
          <SidebarLiveWidget />
        </div>

      </aside>

      {/* Main Content Viewport (Mobile Safe Padding) */}
      <main className="p-4 md:p-8 pb-24 md:pb-8">{children}</main>

      {/* Mobile Bottom App Navigation Dock */}
      <MobileAppDock activeRole={active} currentPath={currentPath} />
    </div>
  );
}

