"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/types";
import { SidebarSignOut } from "@/components/sidebar-sign-out";
import { BrandMark } from "@/components/brand-mark";
import { activeNavigationHref, roleNavigation } from "@/lib/navigation";

type PendingNavigation = {
  from: string;
  to: string;
};

export function DashboardSidebar({
  active,
  current,
}: {
  active: UserRole;
  current?: string;
}) {
  const pathname = usePathname();
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const currentPath =
    pendingNavigation?.from === pathname
      ? pendingNavigation.to
      : current ?? pathname;
  const activeManagementHref = activeNavigationHref(currentPath, roleNavigation[active]);

  return (
    <aside className="dashboard-sidebar fixed inset-y-0 left-0 z-20 hidden w-[260px] flex-col gap-3 overflow-hidden p-4 md:flex">
      <div className="panel min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
        <div>
          <Link className="brand-link mb-4 inline-flex items-center gap-3" href="/">
            <BrandMark className="shadow-xs" />
            <span className="brand-wordmark font-black tracking-tight">
              expo<span className="text-[var(--accent)]">rb</span>
            </span>
          </Link>

          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--accent)] bg-[var(--surface)] px-2.5 py-1 rounded-md border border-[var(--line)] block w-fit">
              {active} portal
            </span>
            <span className="text-[10px] font-bold text-[var(--muted)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /> Active
            </span>
          </div>

          <p className="mb-2 px-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)]">
            Management
          </p>
          <nav className="grid gap-0.5">
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
        </div>
      </div>

      <div className="panel rounded-2xl border border-[var(--line)] bg-white p-3 shadow-sm">
        <SidebarSignOut />
      </div>
    </aside>
  );
}
