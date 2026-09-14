import { Languages, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
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
        <span className="badge badge-accent inline-flex items-center gap-1.5">
          <Sparkles size={14} aria-hidden />
          <span>Event Talent panel</span>
        </span>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Grow your event & retail profile</h1>
        <p className="mt-2 text-[var(--muted)]">
          Apply for recruitment needs across India, track verification status, and build your reputation score.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
        <div className="grid gap-6">
          <ScoreSummaryCard reputation={talentReputation} />
          <CategoryScoreBars reputation={talentReputation} />
          
          <div className="panel p-6 shadow-sm rounded-2xl bg-white border border-[var(--line)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Aisha Rahman</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Product Demos · Brand Hosting · Retail Activations · Event Registration
                </p>
              </div>
              <StatusBadge status="verified" />
            </div>

            <div className="mt-5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)] mb-2.5">Core Skills</h3>
              <div className="flex flex-wrap gap-2">
                {["English", "Hindi", "Lead capture", "Sampling", "Tech demos"].map((skill) => (
                  <span className="badge badge-surface text-xs font-semibold" key={skill}>{skill}</span>
                ))}
              </div>
            </div>

            <div className="surface-card mt-5 flex items-center gap-3 p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)]/70">
              <Languages className="text-[var(--accent)] shrink-0" size={18} aria-hidden />
              <p className="text-xs font-semibold text-[var(--foreground)]">Languages: English, Hindi, Malayalam</p>
            </div>

            <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
              Contact details are securely stored for admin verification only and are not shared publicly.
            </p>
          </div>

          <TestimonialList testimonials={talentTestimonials} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Recommended recruitment needs</h2>
              <p className="text-xs text-[var(--muted)] mt-1">Open positions matched to your profile skills.</p>
            </div>
            <Link className="button button-secondary text-xs font-bold gap-1.5" href="/browse">
              <span>Browse all</span>
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>

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

