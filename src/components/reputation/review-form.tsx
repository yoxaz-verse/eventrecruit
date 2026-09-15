import { WorkflowActionForm } from "@/components/workflow-action-form";
import { SubmitButton } from "@/components/submit-button";
import { createPlacementReview } from "@/app/actions/workflow";
import type { UserRole } from "@/lib/types";

export function ReviewForm({
  placementId,
  revieweeId,
  revieweeRole,
  title,
  exhibitorId,
}: {
  placementId: string;
  revieweeId: string;
  revieweeRole: Extract<UserRole, "talent" | "exhibitor">;
  title: string;
  exhibitorId?: string;
}) {
  return (
    <WorkflowActionForm action={createPlacementReview} className="panel grid gap-4 p-5">
      <h2 className="text-2xl font-black">{title}</h2>
      <input name="placement_id" type="hidden" value={placementId} />
      <input name="reviewee_id" type="hidden" value={revieweeId} />
      <input name="reviewee_role" type="hidden" value={revieweeRole} />
      {exhibitorId ? <input name="exhibitor_id" type="hidden" value={exhibitorId} /> : null}
      {[
        ["rating", "Overall rating"],
        ["communication_rating", "Communication"],
        ["professionalism_rating", "Professionalism"],
        ["reliability_rating", "Reliability"],
      ].map(([name, label]) => (
        <label className="label" key={name}>
          {label}
          <select className="input" name={name} required>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
      ))}
      <label className="label">
        Testimonial
        <textarea
          className="input textarea"
          name="testimonial"
          placeholder="Write clear feedback from the completed placement"
          required
        />
      </label>
      <SubmitButton className="button button-primary" pendingText="Publishing review…">Publish review</SubmitButton>
    </WorkflowActionForm>
  );
}
