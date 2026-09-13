import { WorkflowActionForm } from "@/components/workflow-action-form";
import { StaffingRequestForm } from "@/components/staffing-request-form";
import { SubmitButton } from "@/components/submit-button";
import { ClipboardList } from "lucide-react";
import { updateRecommendationStatus } from "@/app/actions/workflow";
import { ApplicantTable } from "@/components/applicant-table";
import { DashboardShell } from "@/components/dashboard-shell";
import { CategoryScoreBars } from "@/components/reputation/category-score-bars";
import { ReviewForm } from "@/components/reputation/review-form";
import { ScoreSummaryCard } from "@/components/reputation/score-summary-card";
import { TestimonialList } from "@/components/reputation/testimonial-list";
import { RoleCard } from "@/components/role-card";
import { requireRole } from "@/lib/auth";
import { applicants, openRoles, reputations, testimonials } from "@/lib/mock-data";

const recommendations = [
  {
    id: "60000000-0000-0000-0000-000000000001",
    agency: "FieldCrew Partners",
    role: "Product Demonstrator",
    talent: applicants[0],
    note: "Strong product demo background with excellent reliability score.",
  },
];

export default async function ExhibitorDashboard() {
  await requireRole(["exhibitor", "admin"]);
  const exhibitorReputation = reputations.find((reputation) => reputation.role === "exhibitor")!;
  const talentReputation = reputations.find((reputation) => reputation.role === "talent")!;
  const exhibitorTestimonials = testimonials.filter((testimonial) => testimonial.revieweeName === "Nexa Exhibitions");

  return (
    <DashboardShell active="exhibitor">
      <div className="page-kicker">
        <span className="badge">Exhibitor panel</span>
        <h1 className="mt-3 text-4xl font-black">Hire event and retail staff</h1>
        <p className="mt-2 text-[var(--muted)]">
          Post staffing needs, evaluate verified applicants, and complete reviews after the event or activation.
        </p>
      </div>
      <section className="mb-8 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <ScoreSummaryCard reputation={exhibitorReputation} />
        <CategoryScoreBars reputation={exhibitorReputation} />
      </section>
      <section className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <StaffingRequestForm source="exhibitor" />
        <div className="grid gap-4">
          {openRoles.slice(0, 2).map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>
      </section>
      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="text-[var(--accent-2)]" aria-hidden />
          <h2 className="text-2xl font-black">Applicants</h2>
        </div>
        <ApplicantTable />
      </section>
      <section className="mt-8 panel p-5">
        <h2 className="text-2xl font-black">Agency recommendations</h2>
        <p className="mt-2 text-[var(--muted)]">
          Review agency-matched event talent using public profile signals. Phone and contact details are hidden.
        </p>
        <div className="mt-5 grid gap-4">
          {recommendations.map((recommendation) => (
            <article className="surface-card p-4" key={recommendation.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <strong>{recommendation.talent.name}</strong>
                  <p className="text-sm text-[var(--muted)]">
                    Recommended by {recommendation.agency} for {recommendation.role}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">{recommendation.note}</p>
                  <p className="mt-2 text-sm font-bold">
                    {recommendation.talent.rating.toFixed(1)} rating · {recommendation.talent.reliability}% reliable · {recommendation.talent.completed} completed
                  </p>
                </div>
                <div className="flex gap-2">
                  <WorkflowActionForm action={updateRecommendationStatus}>
                    <input name="recommendation_id" type="hidden" value={recommendation.id} />
                    <input name="status" type="hidden" value="accepted" />
                    <SubmitButton className="button button-primary" pendingText="Accepting…">Accept</SubmitButton>
                  </WorkflowActionForm>
                  <WorkflowActionForm action={updateRecommendationStatus}>
                    <input name="recommendation_id" type="hidden" value={recommendation.id} />
                    <input name="status" type="hidden" value="rejected" />
                    <SubmitButton className="button button-secondary" pendingText="Rejecting…">Reject</SubmitButton>
                  </WorkflowActionForm>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <ReviewForm
          placementId="80000000-0000-0000-0000-000000000001"
          revieweeId={talentReputation.profileId}
          revieweeRole="talent"
          title="Review event talent"
        />
        <TestimonialList testimonials={exhibitorTestimonials} />
      </section>
    </DashboardShell>
  );
}
