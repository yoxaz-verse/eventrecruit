import { Languages } from "lucide-react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { CategoryScoreBars } from "@/components/reputation/category-score-bars";
import { ScoreSummaryCard } from "@/components/reputation/score-summary-card";
import { TestimonialList } from "@/components/reputation/testimonial-list";
import { RoleCard } from "@/components/role-card";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { openRoles, reputations, testimonials } from "@/lib/mock-data";

export default async function TalentDashboard() {
  await requireRole(["talent", "admin"]);
  const talentReputation = reputations.find((reputation) => reputation.role === "talent")!;
  const talentTestimonials = testimonials.filter((testimonial) => testimonial.revieweeName === "Aisha Rahman");

  return (
    <DashboardShell active="talent">
      <div className="page-kicker">
        <span className="badge">Event Talent panel</span>
        <h1 className="mt-3 text-4xl font-black">Grow your event and retail profile</h1>
        <p className="mt-2 text-[var(--muted)]">
          Apply for India-wide recruitment needs, track verification, and build a score from completed placements.
        </p>
      </div>
      <section className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <div className="grid gap-6">
          <ScoreSummaryCard reputation={talentReputation} />
          <CategoryScoreBars reputation={talentReputation} />
          <div className="panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Aisha Rahman</h2>
                <p className="mt-1 text-[var(--muted)]">
                  Product demos · Brand hosting · Retail activation · Registration
                </p>
              </div>
              <StatusBadge status="verified" />
            </div>
            <div className="mt-6">
              <h3 className="font-black">Skills</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {["English", "Hindi", "Lead capture", "Sampling", "Tech demos"].map((skill) => (
                  <span className="badge" key={skill}>{skill}</span>
                ))}
              </div>
            </div>
            <div className="surface-card mt-6 flex items-center gap-2 p-4">
              <Languages className="text-[var(--accent)]" aria-hidden />
              <p className="text-sm text-[var(--muted)]">Languages: English, Hindi, Malayalam</p>
            </div>
            <p className="mt-4 text-sm text-[var(--muted)]">
              Private contact details are stored for admin verification only and are not shown to
              exhibitors, agencies, or other talent.
            </p>
          </div>
          <p className="panel p-5 text-[var(--muted)]">Reviews become available after a completed placement. The profiles below are illustrative.</p>
          <TestimonialList testimonials={talentTestimonials} />
        </div>
        <div>
          <h2 className="mb-4 text-2xl font-black">Recommended recruitment needs</h2>
          <p className="mb-4 text-[var(--muted)]">Examples of roles we support. <Link className="font-bold underline" href="/browse">Browse current openings</Link> to apply.</p>
          <div className="grid gap-4">
            {openRoles.map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
