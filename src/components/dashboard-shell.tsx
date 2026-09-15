import Link from "next/link";
import { Compass } from "lucide-react";
import type { UserRole } from "@/lib/types";
import { SidebarLiveWidget } from "@/components/sidebar-live-widget";
import { SidebarMiddleCard } from "@/components/sidebar-middle-card";
import { MobileAppDock } from "@/components/mobile-app-dock";
import { activeNavigationHref, exploreNavigation, roleNavigation } from "@/lib/navigation";

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
  const activeManagementHref = activeNavigationHref(currentPath, roleNavigation[active]);
  const activeExploreHref = activeNavigationHref(currentPath, exploreNavigation);

  return (
    <div className="dashboard-shell min-h-screen bg-[var(--background)]">
      
      {/* Mobile Top App Bar */}
      <header className="dashboard-mobile-header md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[var(--line)] px-4 py-3 flex items-center justify-between shadow-xs">
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
      <aside className="dashboard-sidebar fixed inset-y-0 left-0 z-20 hidden w-[285px] flex-col justify-between gap-4 p-4 md:flex md:py-6 md:pl-6 md:pr-3">
        
        {/* Top Section Box: Brand Header & Navigation */}
        <div className="panel min-h-0 p-5 rounded-2xl bg-white shadow-sm border border-[var(--line)] flex flex-col justify-between">
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
                  {roleNavigation[active].map((item) => {
                    const Icon = item.icon;
                    const isActive = item.href === activeManagementHref;
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
                  {exploreNavigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.href === activeExploreHref;
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
      <main className="p-4 pb-24 md:ml-[285px] md:p-8">{children}</main>

      {/* Mobile Bottom App Navigation Dock */}
      <MobileAppDock activeRole={active} currentPath={currentPath} />
    </div>
  );
}
