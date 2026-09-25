import Link from "next/link";
import type { UserRole } from "@/lib/types";
import { MobileAppDock } from "@/components/mobile-app-dock";
import { AgencyGlobalSearch } from "@/components/agency-global-search";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { BrandMark } from "@/components/brand-mark";

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
    <div className="dashboard-shell min-h-screen bg-[var(--background)]">
      
      {/* Mobile Top App Bar */}
      <header className="dashboard-mobile-header md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[var(--line)] px-4 py-3 flex items-center justify-between shadow-xs">
        <Link className="brand-link flex items-center gap-2.5" href="/">
          <BrandMark size={36} className="shadow-xs" />
          <span className="brand-wordmark font-black tracking-tight text-base">
            expo<span className="text-[var(--accent)]">rb</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--accent)] bg-[var(--surface)] px-2 py-0.5 rounded-md border border-[var(--line)]">
            {active}
          </span>
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        </div>
      </header>

      {/* Desktop navigation sidebar (hidden on mobile). */}
      <DashboardSidebar active={active} current={current} />

      {/* Main Content Viewport (Mobile Safe Padding) */}
      <main className="p-4 pb-24 md:ml-[260px] md:p-8">{active==="agency"?<AgencyGlobalSearch/>:null}{children}</main>

      {/* Mobile Bottom App Navigation Dock */}
      <MobileAppDock activeRole={active} currentPath={current} />
    </div>
  );
}
