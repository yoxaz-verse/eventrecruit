"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, CalendarCheck, Clock, Radio } from "lucide-react";
import Link from "next/link";
import { SidebarSignOut } from "@/components/sidebar-sign-out";

export function SidebarLiveWidget() {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      setTimeStr(now.toLocaleTimeString("en-IN", options) + " IST");
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid gap-3">
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]/80 p-3.5">
        <div className="mb-2.5 flex items-center justify-between border-b border-[var(--line)]/60 pb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[var(--accent)]">
            <Clock size={14} className="animate-spin-slow" aria-hidden />
            <span>Live IST Time</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span>10 Cities</span>
          </div>
        </div>

        <time className="font-mono text-sm font-black tracking-tight text-[var(--foreground)]" suppressHydrationWarning>
          {timeStr || "Loading IST..."}
        </time>

        <div className="mt-2.5 flex items-center justify-between border-t border-[var(--line)]/50 pt-2 text-[11px] font-semibold text-[var(--muted)]">
          <span className="flex items-center gap-1">
            <CalendarCheck size={13} className="text-[var(--accent)]" aria-hidden />
            <span>Bookings Active</span>
          </span>
          <span className="flex items-center gap-0.5 font-extrabold text-[var(--accent)]">
            <Radio size={12} className="animate-pulse text-emerald-600" aria-hidden />
            <span>Live Ops</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/browse"
          className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-[11px] font-extrabold text-[var(--foreground)] transition-all hover:bg-white hover:shadow-xs"
        >
          <span>Roles</span>
          <ArrowUpRight size={13} className="text-[var(--muted)]" aria-hidden />
        </Link>
        <Link
          href="/events"
          className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-[11px] font-extrabold text-[var(--foreground)] transition-all hover:bg-white hover:shadow-xs"
        >
          <span>Events</span>
          <ArrowUpRight size={13} className="text-[var(--muted)]" aria-hidden />
        </Link>
      </div>

      <SidebarSignOut />
    </div>
  );
}
