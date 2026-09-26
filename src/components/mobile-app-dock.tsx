"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, CalendarDays, Menu } from "lucide-react";
import type { UserRole } from "@/lib/types";
import { isNavigationItemActive } from "@/lib/navigation";

const MobileDrawerContent = dynamic(() => import("@/components/mobile-drawer-content").then(module => module.MobileDrawerContent));

interface MobileAppDockProps {
  activeRole?: UserRole;
}

export function MobileAppDock({ activeRole = "talent" }: MobileAppDockProps) {
  const pathname = usePathname();
  
  // Modal state management for smooth enter & exit transitions
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !sheetRef.current) return;
      const focusable = Array.from(sheetRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    requestAnimationFrame(() => sheetRef.current?.querySelector<HTMLElement>("button")?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted, closeDrawer]);

  // Close drawer on route change
  useEffect(() => {
    const frame = requestAnimationFrame(() => closeDrawer());
    return () => cancelAnimationFrame(frame);
  }, [pathname, closeDrawer]);

  const [pendingNavigation, setPendingNavigation] = useState<{ from: string; to: string } | null>(null);

  const active = pendingNavigation?.from === pathname
    ? pendingNavigation.to
    : pathname;

  const mainTabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/browse", label: "Roles", icon: Briefcase },
    { href: "/events", label: "Events", icon: CalendarDays },
  ];

  return (
    <>
      {/* Fixed Bottom App Bar for Mobile */}
      <nav className="mobile-tab-bar md:hidden" aria-label="Dashboard mobile navigation">
        <div className="mobile-tab-list">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = isNavigationItemActive(active, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => setPendingNavigation({ from: pathname, to: tab.href })}
              className={`mobile-tab ${isActive ? "mobile-tab-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={21} aria-hidden />
              <span>{tab.label}</span>
            </Link>
          );
        })}

        {/* Menu Toggle for Mobile Sheet */}
        <button
          ref={menuButtonRef}
          onClick={mounted ? closeDrawer : openDrawer}
          type="button"
          aria-label="Toggle portal navigation menu"
          className={`mobile-tab ${mounted && visible ? "mobile-tab-active" : ""}`}
          aria-expanded={mounted && visible}
          aria-controls="dashboard-mobile-sheet"
        >
          <Menu size={21} aria-hidden />
          <span>More</span>
        </button>
        </div>
      </nav>

      {/* Slide-over Mobile Drawer / Sheet with smooth enter & exit animation */}
      {mounted && (
        <div className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end">
          {/* Backdrop with fade transition */}
          <div
            ref={sheetRef}
            id="dashboard-mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-mobile-sheet-title"
            className={`fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
              visible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeDrawer}
            aria-hidden="true"
          />

          {/* Sheet container with slide up & slide down transition */}
          <div
            className={`mobile-sheet relative bg-[var(--background)] w-full max-h-[85vh] rounded-t-3xl border-t border-[var(--line)] shadow-2xl overflow-y-auto p-5 space-y-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              visible ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <MobileDrawerContent role={activeRole} activePath={active} onClose={closeDrawer} onNavigate={(href)=>{setPendingNavigation({from:pathname,to:href});closeDrawer();}} />
          </div>
        </div>
      )}
    </>
  );
}
