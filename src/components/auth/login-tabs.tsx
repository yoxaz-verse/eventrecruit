"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export function LoginTabs({ mode }: { mode: "password" | "otp" }) {
  const searchParams = useSearchParams();
  const [activeMode, setActiveMode] = useState<"password" | "otp">(mode);
  const [loadingMode, setLoadingMode] = useState<string | null>(null);

  useEffect(() => {
    setActiveMode(mode);
    setLoadingMode(null);
  }, [mode, searchParams]);

  const tabs = [
    { mode: "password" as const, href: "/login", label: "Password" },
    { mode: "otp" as const, href: "/login?mode=otp", label: "Email OTP" },
  ];

  return (
    <div className="auth-tabs grid grid-cols-2 p-1 bg-[var(--surface-2)]/60 rounded-xl" role="tablist" aria-label="Login method">
      {tabs.map((tab) => {
        const isActive = activeMode === tab.mode;
        const isLoading = loadingMode === tab.mode;

        return (
          <Link
            key={tab.mode}
            href={tab.href}
            onClick={() => {
              setActiveMode(tab.mode);
              if (tab.mode !== mode) {
                setLoadingMode(tab.mode);
              }
            }}
            role="tab"
            aria-selected={isActive}
            className={`flex items-center justify-center gap-1.5 min-h-[38px] text-xs font-bold rounded-lg transition-all active:scale-[0.98] ${
              isActive
                ? "bg-white text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
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
