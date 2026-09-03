import { Award, ShieldCheck, Star } from "lucide-react";
import type { Reputation } from "@/lib/types";

export function ScoreSummaryCard({ reputation }: { reputation: Reputation }) {
  return (
    <article className="panel reputation-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[var(--muted)]">
            {reputation.role === "talent" ? "Event Talent reputation" : "Exhibitor reputation"}
          </p>
          <h2 className="mt-1 text-2xl font-black">{reputation.displayName}</h2>
        </div>
        <Award className="text-[var(--accent-2)]" size={30} aria-hidden />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-white p-4">
          <ShieldCheck className="text-[var(--accent)]" aria-hidden />
          <strong className="mt-2 block text-3xl">{reputation.trustScore}</strong>
          <p className="text-xs text-[var(--muted)]">Trust score</p>
        </div>
        <div className="rounded-lg bg-white p-4">
          <Star className="text-[var(--accent-2)]" aria-hidden />
          <strong className="mt-2 block text-3xl">{reputation.averageRating.toFixed(1)}</strong>
          <p className="text-xs text-[var(--muted)]">Avg rating</p>
        </div>
        <div className="rounded-lg bg-white p-4">
          <Award className="text-[var(--accent)]" aria-hidden />
          <strong className="mt-2 block text-3xl">{reputation.completedCount}</strong>
          <p className="text-xs text-[var(--muted)]">Completed</p>
        </div>
      </div>
    </article>
  );
}
