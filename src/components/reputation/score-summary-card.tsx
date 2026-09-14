import { Award, ShieldCheck, Star, CheckCircle2 } from "lucide-react";
import type { Reputation } from "@/lib/types";

export function ScoreSummaryCard({ reputation }: { reputation: Reputation }) {
  return (
    <article className="panel reputation-card p-6 shadow-sm border border-[var(--line)] rounded-2xl bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
            {reputation.role === "talent" ? "Event Talent reputation" : "Exhibitor reputation"}
          </span>
          <h2 className="mt-1 text-2xl font-black tracking-tight">{reputation.displayName}</h2>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-[var(--accent-2)] border border-amber-200/60 shadow-xs">
          <Award size={24} aria-hidden />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="stat-card p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)]/50 transition-all hover:bg-white hover:shadow-sm">
          <div className="flex items-center gap-1.5 text-[var(--accent)] text-xs font-bold">
            <ShieldCheck size={16} aria-hidden />
            <span>Trust Score</span>
          </div>
          <strong className="mt-2 block text-3xl font-black text-[var(--foreground)]">{reputation.trustScore}</strong>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">High reliability</p>
        </div>

        <div className="stat-card p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)]/50 transition-all hover:bg-white hover:shadow-sm">
          <div className="flex items-center gap-1.5 text-[var(--accent-2)] text-xs font-bold">
            <Star size={16} aria-hidden />
            <span>Avg Rating</span>
          </div>
          <strong className="mt-2 block text-3xl font-black text-[var(--foreground)]">{reputation.averageRating.toFixed(1)}</strong>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">out of 5.0</p>
        </div>

        <div className="stat-card p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)]/50 transition-all hover:bg-white hover:shadow-sm">
          <div className="flex items-center gap-1.5 text-[var(--accent)] text-xs font-bold">
            <CheckCircle2 size={16} aria-hidden />
            <span>Completed</span>
          </div>
          <strong className="mt-2 block text-3xl font-black text-[var(--foreground)]">{reputation.completedCount}</strong>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">Placements</p>
        </div>
      </div>
    </article>
  );
}

