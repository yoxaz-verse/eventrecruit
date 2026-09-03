import type { Reputation } from "@/lib/types";

const labels = [
  ["Reliability", "reliabilityScore"],
  ["Communication", "communicationScore"],
  ["Professionalism", "professionalismScore"],
] as const;

export function CategoryScoreBars({ reputation }: { reputation: Reputation }) {
  return (
    <div className="panel p-5">
      <h2 className="text-2xl font-black">Category scores</h2>
      <div className="mt-5 grid gap-4">
        {labels.map(([label, key]) => (
          <div className="score-bar" key={label}>
            <div className="flex items-center justify-between gap-3">
              <strong>{label}</strong>
              <span>{reputation[key]}/100</span>
            </div>
            <div className="score-track" aria-hidden>
              <div className="score-fill" style={{ width: `${reputation[key]}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="stat-card">
          <strong>{reputation.cancellations}</strong>
          <p className="text-[var(--muted)]">Cancellations</p>
        </div>
        <div className="stat-card">
          <strong>{reputation.disputes}</strong>
          <p className="text-[var(--muted)]">Disputes</p>
        </div>
      </div>
    </div>
  );
}
