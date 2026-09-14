import { DashboardShell } from "@/components/dashboard-shell";
import { ScoreSummaryCard } from "@/components/reputation/score-summary-card";
import { CategoryScoreBars } from "@/components/reputation/category-score-bars";
import { TestimonialList } from "@/components/reputation/testimonial-list";
import { requireRole } from "@/lib/auth";
import { reputations, testimonials } from "@/lib/mock-data";

export default async function ExhibitorReputation() {
  await requireRole(["exhibitor"]);
  const example = reputations.find(item => item.role === "exhibitor")!;
  return <DashboardShell active="exhibitor" current="/dashboard/exhibitor/reputation"><span className="badge">Exhibitor panel</span><h1 className="mt-3 mb-3 text-4xl font-black">Reputation</h1><p className="mb-6 text-[var(--muted)]">Illustrative reputation preview. Account-specific scores will appear when live review records are connected.</p><div className="grid gap-6 lg:grid-cols-2"><ScoreSummaryCard reputation={example}/><CategoryScoreBars reputation={example}/></div><div className="mt-8"><TestimonialList testimonials={testimonials.filter(item => item.revieweeName === example.displayName)}/></div></DashboardShell>;
}
