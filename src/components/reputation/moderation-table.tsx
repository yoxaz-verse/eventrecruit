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
            <th>Data</th>
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
                <span className="text-sm text-[var(--muted)]">Illustrative review</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
