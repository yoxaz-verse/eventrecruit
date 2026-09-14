"use client";

import { useState, useEffect } from "react";
import { Clock, Radio, CalendarCheck, LogOut, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { signOut } from "@/app/actions/auth";

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
      {/* Live Clock & Market Ops Widget */}
      <div className="p-3.5 rounded-xl bg-[var(--surface)]/80 border border-[var(--line)]">
        <div className="flex items-center justify-between border-b border-[var(--line)]/60 pb-2 mb-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[var(--accent)]">
            <Clock size={14} className="animate-spin-slow" aria-hidden />
            <span>Live IST Time</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span>10 Cities</span>
          </div>
        </div>

        <div className="font-mono text-sm font-black tracking-tight text-[var(--foreground)]">
          {timeStr || "Loading IST..."}
        </div>

        <div className="mt-2.5 pt-2 border-t border-[var(--line)]/50 flex items-center justify-between text-[11px] font-semibold text-[var(--muted)]">
          <span className="flex items-center gap-1">
            <CalendarCheck size={13} className="text-[var(--accent)]" aria-hidden />
            <span>Bookings Active</span>
          </span>
          <span className="font-extrabold text-[var(--accent)] flex items-center gap-0.5">
            <Radio size={12} className="animate-pulse text-emerald-600" />
            <span>Live Ops</span>
          </span>
        </div>
      </div>

      {/* Quick Public Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/browse"
          className="text-[11px] font-extrabold text-[var(--foreground)] bg-[var(--surface)] hover:bg-white hover:shadow-xs border border-[var(--line)] rounded-lg py-1.5 px-2.5 flex items-center justify-between transition-all"
        >
          <span>Roles</span>
          <ArrowUpRight size={13} className="text-[var(--muted)]" />
        </Link>
        <Link
          href="/events"
          className="text-[11px] font-extrabold text-[var(--foreground)] bg-[var(--surface)] hover:bg-white hover:shadow-xs border border-[var(--line)] rounded-lg py-1.5 px-2.5 flex items-center justify-between transition-all"
        >
          <span>Events</span>
          <ArrowUpRight size={13} className="text-[var(--muted)]" />
        </Link>
      </div>

      {/* Sign out form */}
      <form action={signOut}>
        <SubmitButton
          className="button button-secondary w-full text-xs font-bold gap-2 py-2"
          pendingText="Signing out…"
        >
          <LogOut size={15} aria-hidden />
          <span>Sign out</span>
        </SubmitButton>
      </form>
    </div>
  );
}
