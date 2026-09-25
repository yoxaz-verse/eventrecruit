import Link from "next/link";
import Image from "next/image";
import { Search, Calendar } from "lucide-react";
import type { UserRole } from "@/lib/types";
import { MobileAppDock } from "@/components/mobile-app-dock";
import { AgencyGlobalSearch } from "@/components/agency-global-search";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { BrandMark } from "@/components/brand-mark";
import { getCurrentProfile } from "@/lib/auth";

export async function DashboardShell({
  active,
  current,
  children,
}: {
  active: UserRole;
  current?: string;
  children: React.ReactNode;
}) {
  const sectionName = current ? current.split("/").pop()?.replace(/-/g, " ") || "overview" : "overview";
  const profile = await getCurrentProfile();
  const identityLabel = String(profile?.full_name || active);
  const initials = identityLabel.split(/\s+/).filter(Boolean).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase() || active.substring(0, 2).toUpperCase();
  const profileHref = `/dashboard/${active}/profile`;
  const avatarScope = active === "talent" ? "talent" : "profile";

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
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--accent)] bg-[var(--surface)] px-2.5 py-1 rounded-lg border border-[var(--line)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {active}
          </span>
          <Link aria-label="Open your profile" className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 text-xs font-black text-white shadow-xs" href={profileHref}>
            {profile?.avatar_url ? <Image unoptimized width={36} height={36} className="h-full w-full bg-white object-cover" src={`/api/media/${avatarScope}/${profile.id}`} alt="" /> : initials}
          </Link>
        </div>
      </header>

      {/* Desktop navigation sidebar */}
      <DashboardSidebar active={active} current={current} />

      {/* Desktop Sticky Header Bar */}
      <header className="hidden md:flex items-center justify-between h-14 px-8 ml-[260px] border-b border-[var(--line)]/70 bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--accent)] bg-blue-50/90 px-2.5 py-1 rounded-md border border-blue-100 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {active} portal
          </span>
          <span className="text-xs text-[var(--muted)] font-bold">/</span>
          <span className="text-xs font-extrabold text-[var(--foreground)] capitalize">
            {sectionName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/browse"
            className="text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] px-3 py-1.5 rounded-xl border border-[var(--line)] bg-white hover:bg-[var(--surface)] transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Search size={14} className="text-[var(--accent)]" />
            <span>Roles</span>
          </Link>
          <Link
            href="/events"
            className="text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] px-3 py-1.5 rounded-xl border border-[var(--line)] bg-white hover:bg-[var(--surface)] transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Calendar size={14} className="text-[var(--accent)]" />
            <span>Events</span>
          </Link>

          <div className="h-4 w-px bg-[var(--line)] mx-0.5" />

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live System
            </span>
            <Link aria-label={`Open profile for ${identityLabel}`} className="group flex items-center gap-2 rounded-full p-1 pr-2 text-xs font-extrabold transition-colors hover:bg-[var(--surface)]" href={profileHref}>
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 text-[11px] font-black text-white shadow-xs">
                {profile?.avatar_url ? <Image unoptimized width={32} height={32} className="h-full w-full bg-white object-cover" src={`/api/media/${avatarScope}/${profile.id}`} alt="" /> : initials}
              </span>
              <span className="hidden max-w-32 truncate lg:block">Profile</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="p-4 pb-24 md:ml-[260px] md:p-8">{active === "agency" ? <AgencyGlobalSearch /> : null}{children}</main>

      {/* Mobile Bottom App Navigation Dock */}
      <MobileAppDock activeRole={active} currentPath={current} />
    </div>
  );
}
