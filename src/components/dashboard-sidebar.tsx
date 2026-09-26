"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/types";
import { SidebarSignOut } from "@/components/sidebar-sign-out";
import { BrandMark } from "@/components/brand-mark";
import { SidebarMiddleCard } from "@/components/sidebar-middle-card";
import { activeNavigationHref, roleNavigation } from "@/lib/navigation";

type PendingNavigation = {
  from: string;
  to: string;
};

export function DashboardSidebar({
  active,
}: {
  active: UserRole;
}) {
  const pathname = usePathname();
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const currentPath =
    pendingNavigation?.from === pathname
      ? pendingNavigation.to
      : pathname;
  const activeManagementHref = activeNavigationHref(currentPath, roleNavigation[active]);

  return (
    <aside className="dashboard-sidebar fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col gap-3 overflow-hidden p-3 md:flex">
      <div className="panel min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[var(--line)] bg-white p-4 shadow-xs flex flex-col justify-between">
        <div>
          <div className="mb-4 pb-3.5 border-b border-[var(--line)]/70">
            <Link className="brand-link inline-flex items-center gap-3 group" href="/">
              <BrandMark className="shadow-xs transition-transform group-hover:scale-105" />
              <span className="brand-wordmark font-black tracking-tight text-lg">
                expo<span className="text-[var(--accent)]">rb</span>
              </span>
            </Link>

            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--accent)] bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100 block w-fit">
                {active} portal
              </span>
              <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
              </span>
            </div>
          </div>

          <p className="mb-2 px-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)]">
            Management
          </p>
          <nav className="grid gap-1">
            {roleNavigation[active].map((item, index, items) => {
              const Icon = item.icon;
              const isActive = item.href === activeManagementHref;
              return (
                <div key={item.href}>
                  {item.group && item.group !== items[index - 1]?.group ? (
                    <p className="mb-1 mt-3 px-1 text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                      {item.group}
                    </p>
                  ) : null}
                  <Link
                    className={`dashboard-nav-link flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? "dashboard-nav-active shadow-sm text-white"
                        : "hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() =>
                      setPendingNavigation({ from: pathname, to: item.href })
                    }
                  >
                    <Icon size={17} aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                </div>
              );
            })}
          </nav>

          <div className="mt-5 pt-4 border-t border-[var(--line)]/60">
            <SidebarMiddleCard active={active} />
          </div>
        </div>
      </div>

      <div className="panel rounded-2xl border border-[var(--line)] bg-white p-3 shadow-xs">
        <SidebarSignOut />
      </div>
    </aside>
  );
}
