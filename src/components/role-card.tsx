import { MapPin, Star, Users } from "lucide-react";
import { applyForRole } from "@/app/actions/workflow";
import type { EventRole } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

export function RoleCard({ role, apply = false }: { role: EventRole; apply?: boolean }) {
  return (
    <article className="panel grid gap-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[var(--accent)]">{role.eventTitle}</p>
          <h3 className="mt-1 text-xl font-black">{role.role}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{role.company}</p>
        </div>
        <StatusBadge status={role.status} />
      </div>
      <div className="grid gap-2 text-sm text-[var(--muted)]">
        <span className="flex items-center gap-2">
          <MapPin size={16} aria-hidden /> {role.location}
        </span>
        <span className="flex items-center gap-2">
          <Users size={16} aria-hidden /> {role.headcount} people needed
        </span>
        <span className="flex items-center gap-2">
          <Star size={16} aria-hidden /> ${role.rate}/day · {role.shift}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {role.skills.map((skill) => (
          <span className="badge" key={skill}>
            {skill}
          </span>
        ))}
      </div>
      {role.agency ? <p className="text-sm text-[var(--muted)]">Managed by {role.agency}</p> : null}
      {apply ? (
        <form action={applyForRole} className="grid gap-3">
          <input name="staffing_role_id" type="hidden" value={role.id} />
          <textarea
            className="input textarea"
            name="cover_note"
            placeholder="Short note for the exhibitor"
          />
          <button className="button button-primary" type="submit">
            Apply
          </button>
        </form>
      ) : null}
    </article>
  );
}
