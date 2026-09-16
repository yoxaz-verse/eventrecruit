"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export function AuthTopTabs({ currentHref }: { currentHref: string }) {
  const pathname = usePathname();
  const [activeHref, setActiveHref] = useState(currentHref);
  const [loadingHref, setLoadingHref] = useState<string | null>(null);

  useEffect(() => {
    setActiveHref(pathname);
    setLoadingHref(null);
  }, [pathname]);

  const tabs = [
    { href: "/login", label: "Log in" },
    { href: "/signup", label: "Create account" },
  ];

  return (
    <div className="auth-tabs grid grid-cols-2 p-1 bg-[var(--surface)] rounded-xl mb-4" role="tablist">
      {tabs.map((tab) => {
        const isActive = activeHref === tab.href || activeHref.startsWith(tab.href);
        const isLoading = loadingHref === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            onClick={() => {
              setActiveHref(tab.href);
              if (tab.href !== pathname) {
                setLoadingHref(tab.href);
              }
            }}
            role="tab"
            aria-selected={isActive}
            className={`flex items-center justify-center gap-1.5 min-h-[40px] text-xs font-bold rounded-lg transition-all active:scale-[0.98] ${
              isActive
                ? "bg-white text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/50"
            }`}
          >
            <span>{tab.label}</span>
            {isLoading && <Loader2 size={13} className="animate-spin text-[var(--accent)] shrink-0" />}
          </Link>
        );
      })}
    </div>
  );
}
