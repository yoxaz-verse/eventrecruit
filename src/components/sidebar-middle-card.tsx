"use client";

import Link from "next/link";
import { Zap, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import type { UserRole } from "@/lib/types";

const roleCards: Record<UserRole, {
  badge: string;
  title: string;
  subtitle: string;
  statLabel: string;
  statValue: string;
  tip: string;
  actionText: string;
  actionHref: string;
}> = {
  talent: {
    badge: "Level 2 Verified",
    title: "Priority Placement",
    subtitle: "High Demand Active",
    statLabel: "Match Score",
    statValue: "98%",
    tip: "Delhi & Mumbai expos actively hiring Product Demonstrators & Hosts.",
    actionText: "Browse Top Openings",
    actionHref: "/browse",
  },
  exhibitor: {
    badge: "Instant Staffing",
    title: "Booth Crew Dispatch",
    subtitle: "Avg response < 15 mins",
    statLabel: "Fill Rate",
    statValue: "99.4%",
    tip: "Request verified promoters 48h before expo for guaranteed placement.",
    actionText: "Request Crew Now",
    actionHref: "/dashboard/exhibitor/requests/new",
  },
  organizer: {
    badge: "Ops Overwatch",
    title: "Event Approvals",
    subtitle: "Real-time Verification",
    statLabel: "Active Hubs",
    statValue: "10 Cities",
    tip: "Review exhibitor requests promptly to optimize floor layout.",
    actionText: "Create New Event",
    actionHref: "/dashboard/organizer/events/new",
  },
  agency: {
    badge: "Verified Agency",
    title: "Roster Management",
    subtitle: "Full Compliance",
    statLabel: "Active Talent",
    statValue: "48 Crew",
    tip: "Keep crew availability updated for instant match notifications.",
    actionText: "Explore Roles",
    actionHref: "/browse",
  },
  admin: {
    badge: "System Overwatch",
    title: "Platform Monitor",
    subtitle: "Zero Disruptions",
    statLabel: "Health Status",
    statValue: "100%",
    tip: "All booking gateways and security policies are active.",
    actionText: "Review Events",
    actionHref: "/dashboard/admin/events",
  },
};

export function SidebarMiddleCard({ active }: { active: UserRole }) {
  const card = roleCards[active] || roleCards.talent;

  return (
    <div className="panel p-4 rounded-2xl bg-gradient-to-br from-white via-white to-[var(--surface)] shadow-xs border border-[var(--line)] space-y-3">
      {/* Header Badge & Title */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
          <CheckCircle2 size={11} className="text-emerald-600" />
          {card.badge}
        </span>
        <span className="text-[10px] font-bold text-[var(--accent)] flex items-center gap-0.5">
          <TrendingUp size={12} />
          Active
        </span>
      </div>

      <div>
        <h4 className="text-xs font-black tracking-tight text-[var(--foreground)] flex items-center gap-1.5">
          <Zap size={14} className="text-[var(--accent)] fill-[var(--accent)]/20" />
          {card.title}
        </h4>
        <p className="text-[11px] font-medium text-[var(--muted)] mt-0.5">
          {card.subtitle}
        </p>
      </div>

      {/* Mini Stat Pill */}
      <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)]/60 flex items-center justify-between">
        <span className="text-[11px] font-bold text-[var(--muted)]">{card.statLabel}</span>
        <span className="text-xs font-black text-[var(--foreground)] font-mono">{card.statValue}</span>
      </div>

      {/* Tip / Highlight */}
      <p className="text-[10px] leading-relaxed text-[var(--muted)] font-medium">
        {card.tip}
      </p>

      {/* Action Button */}
      <Link
        href={card.actionHref}
        className="inline-flex items-center justify-between w-full text-[11px] font-extrabold text-[var(--accent)] hover:text-emerald-900 bg-[var(--accent)]/8 hover:bg-[var(--accent)]/15 border border-[var(--accent)]/20 rounded-xl py-2 px-3 transition-all group"
      >
        <span>{card.actionText}</span>
        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
