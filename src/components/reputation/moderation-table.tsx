import { updateReviewVisibility } from "@/app/actions/workflow";
import { StatusBadge } from "@/components/status-badge";
import type { Testimonial } from "@/lib/types";

export function ModerationTable({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <div className="panel overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Review</th>
            <th>Scores</th>
            <th>Status</th>
            <th>Moderation</th>
          </tr>
        </thead>
        <tbody>
          {testimonials.map((testimonial) => (
            <tr key={testimonial.id}>
              <td>
                <strong>{testimonial.revieweeName}</strong>
                <p className="text-sm text-[var(--muted)]">
                  From {testimonial.reviewerName} · {testimonial.text}
                </p>
              </td>
              <td>
                {testimonial.rating}/5 overall
                <p className="text-sm text-[var(--muted)]">
                  C{testimonial.communication} · P{testimonial.professionalism} · R{testimonial.reliability}
                </p>
              </td>
              <td>
                <StatusBadge status={testimonial.status} />
              </td>
              <td>
                <div className="flex gap-2">
                  <form action={updateReviewVisibility}>
                    <input name="review_id" type="hidden" value={testimonial.id} />
                    <input name="visibility_status" type="hidden" value="published" />
                    <button className="button button-primary" type="submit">Publish</button>
                  </form>
                  <form action={updateReviewVisibility}>
                    <input name="review_id" type="hidden" value={testimonial.id} />
                    <input name="visibility_status" type="hidden" value="hidden" />
                    <button className="button button-secondary" type="submit">Hide</button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
