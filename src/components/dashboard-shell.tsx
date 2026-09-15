import Link from "next/link";
import type { UserRole } from "@/lib/types";
import { SidebarSignOut } from "@/components/sidebar-sign-out";
import { MobileAppDock } from "@/components/mobile-app-dock";
import { activeNavigationHref, roleNavigation } from "@/lib/navigation";

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

      {/* Desktop navigation sidebar (hidden on mobile). */}
      <aside className="dashboard-sidebar fixed inset-y-0 left-0 z-20 hidden w-[260px] flex-col gap-3 overflow-hidden p-4 md:flex">
        
        {/* Top Section Box: Brand Header & Navigation */}
        <div className="panel min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <div>
            <Link className="brand-link mb-4 inline-flex items-center gap-3" href="/">
              <span className="brand-mark shadow-xs" aria-hidden="true">
                <span className="brand-orbit brand-orbit-one" />
                <span className="brand-orbit brand-orbit-two" />
                <span className="brand-core" />
              </span>
              <span className="brand-wordmark font-black tracking-tight">
                expo<span className="text-[var(--accent)]">rb</span>
              </span>
            </Link>

            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--accent)] bg-[var(--surface)] px-2.5 py-1 rounded-md border border-[var(--line)] block w-fit">
                {active} portal
              </span>
              <span className="text-[10px] font-bold text-[var(--muted)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Active
              </span>
            </div>

            <p className="mb-2 px-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)]">
              Management
            </p>
            <nav className="grid gap-0.5">
              {roleNavigation[active].map((item) => {
                const Icon = item.icon;
                const isActive = item.href === activeManagementHref;
                return (
                  <Link
                    key={item.href}
                    className={`dashboard-nav-link flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
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
        </div>

        <div className="panel rounded-2xl border border-[var(--line)] bg-white p-3 shadow-sm">
          <SidebarSignOut />
        </div>

      </aside>

      {/* Main Content Viewport (Mobile Safe Padding) */}
      <main className="p-4 pb-24 md:ml-[260px] md:p-8">{children}</main>

      {/* Mobile Bottom App Navigation Dock */}
      <MobileAppDock activeRole={active} currentPath={currentPath} />
    </div>
  );
}
