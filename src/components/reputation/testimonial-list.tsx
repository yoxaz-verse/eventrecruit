import { Quote, Star } from "lucide-react";
import type { Testimonial } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

export function TestimonialList({
  title = "Verified testimonials",
  testimonials,
  includeHidden = false,
}: {
  title?: string;
  testimonials: Testimonial[];
  includeHidden?: boolean;
}) {
  const visible = includeHidden
    ? testimonials
    : testimonials.filter((testimonial) => testimonial.status === "published");

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center gap-2">
        <Quote className="text-[var(--accent)]" aria-hidden />
        <h2 className="text-2xl font-black">{title}</h2>
      </div>
      <div className="grid gap-3">
        {visible.map((testimonial) => (
          <article className="rounded-lg border border-[var(--line)] bg-white p-4" key={testimonial.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <strong>{testimonial.revieweeName}</strong>
                <p className="text-sm text-[var(--muted)]">
                  From {testimonial.reviewerName} · {testimonial.placement}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge">
                  <Star size={14} aria-hidden />
                  {testimonial.rating}/5
                </span>
                {includeHidden ? <StatusBadge status={testimonial.status} /> : null}
              </div>
            </div>
            <p className="mt-3 leading-7 text-[var(--muted)]">{testimonial.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
