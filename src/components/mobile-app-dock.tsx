"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Calendar, Menu, X, Sparkles, Building2, ShieldCheck, Users, Star, ClipboardList, UserCheck } from "lucide-react";
import type { UserRole } from "@/lib/types";
import { SidebarLiveWidget } from "@/components/sidebar-live-widget";
import { SidebarMiddleCard } from "@/components/sidebar-middle-card";

interface MobileAppDockProps {
  activeRole?: UserRole;
  currentPath?: string;
}

const roleNavItems = {
  organizer: [
    { href: "/dashboard/organizer", label: "Overview", icon: Building2 },
    { href: "/dashboard/organizer/events/new", label: "Create Event", icon: Calendar },
    { href: "/dashboard/organizer/company", label: "Company", icon: Building2 },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Overview", icon: ShieldCheck },
    { href: "/dashboard/admin/events", label: "Event Reviews", icon: Calendar },
  ],
  agency: [
    { href: "/dashboard/agency", label: "Overview", icon: Users },
  ],
  exhibitor: [
    { href: "/dashboard/exhibitor", label: "Overview", icon: Building2 },
    { href: "/dashboard/exhibitor/events", label: "My Events", icon: Calendar },
    { href: "/dashboard/exhibitor/requests", label: "Requests", icon: ClipboardList },
    { href: "/dashboard/exhibitor/applicants", label: "Applicants", icon: UserCheck },
    { href: "/dashboard/exhibitor/reputation", label: "Reputation", icon: Star },
  ],
  talent: [
    { href: "/dashboard/talent", label: "Overview", icon: Sparkles },
  ],
};

export function MobileAppDock({ activeRole = "talent", currentPath }: MobileAppDockProps) {
  const pathname = usePathname();
  const active = currentPath ?? pathname;
  
  // Modal state management for smooth enter & exit transitions
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const openDrawer = useCallback(() => {
    setMounted(true);
    // Trigger transition after mount
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setVisible(true);
      });
    });
  }, []);

  const closeDrawer = useCallback(() => {
    setVisible(false);
    // Unmount after transition duration
    const timer = setTimeout(() => {
      setMounted(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    const frame = requestAnimationFrame(() => closeDrawer());
    return () => cancelAnimationFrame(frame);
  }, [pathname, closeDrawer]);

  const mainTabs = [
    { href: `/dashboard/${activeRole}`, label: "Portal", icon: LayoutDashboard },
    { href: "/browse", label: "Roles", icon: Briefcase },
    { href: "/events", label: "Events", icon: Calendar },
  ];

  return (
    <>
      {/* Fixed Bottom App Bar for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[var(--line)] shadow-2xl px-3 py-2 flex items-center justify-around">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.href || (tab.href.startsWith("/dashboard") && active.startsWith("/dashboard"));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all active:scale-95 ${
                isActive
                  ? "text-[var(--accent)] font-black"
                  : "text-[var(--muted)] font-bold hover:text-[var(--foreground)]"
              }`}
            >
              <Icon size={20} className={isActive ? "stroke-[2.5]" : "stroke-[1.8]"} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </Link>
          );
        })}

        {/* Menu Toggle for Mobile Sheet */}
        <button
          onClick={mounted ? closeDrawer : openDrawer}
          type="button"
          aria-label="Toggle portal navigation menu"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all active:scale-95 ${
            mounted && visible ? "text-[var(--accent)] font-black" : "text-[var(--muted)] font-bold"
          }`}
        >
          <div className="relative">
            <Menu size={20} className="stroke-[1.8]" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--accent)]" />
          </div>
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>
      </div>

      {/* Slide-over Mobile Drawer / Sheet with smooth enter & exit animation */}
      {mounted && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop with fade transition */}
          <div
            className={`fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
              visible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeDrawer}
            aria-hidden="true"
          />

          {/* Sheet container with slide up & slide down transition */}
          <div
            className={`relative bg-[var(--background)] w-full max-h-[85vh] rounded-t-3xl border-t border-[var(--line)] shadow-2xl overflow-y-auto p-5 space-y-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              visible ? "translate-y-0" : "translate-y-full"
            }`}
          >
            {/* Handle bar & Close */}
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <span className="w-8 h-1 rounded-full bg-neutral-300 inline-block" />
                <span className="text-xs font-black uppercase tracking-wider text-[var(--accent)]">
                  {activeRole} menu
                </span>
              </div>
              <button
                onClick={closeDrawer}
                className="p-1.5 rounded-full bg-[var(--surface)] text-[var(--muted)] hover:text-black border border-[var(--line)] active:scale-90 transition-transform"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Portal Navigation Links */}
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)] px-1 mb-1">
                Portal Shortcuts
              </p>
              {(roleNavItems[activeRole] || roleNavItems.talent).map((item) => {
                const Icon = item.icon;
                const isActive = active === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeDrawer}
                    className={`flex items-center gap-3 p-3 rounded-xl text-xs font-extrabold transition-all active:scale-[0.98] ${
                      isActive
                        ? "bg-[var(--ink)] text-white shadow-sm"
                        : "bg-white text-[var(--foreground)] border border-[var(--line)]"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Middle Card Status */}
            <SidebarMiddleCard active={activeRole} />

            {/* Live Widget & Signout */}
            <div className="bg-white p-4 rounded-2xl border border-[var(--line)] shadow-xs">
              <SidebarLiveWidget />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
