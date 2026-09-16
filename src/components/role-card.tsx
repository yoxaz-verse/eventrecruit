import { CalendarDays, MapPin, Users, Clock, Send } from "lucide-react";
import Link from "next/link";
import type { EventRole } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

export function RoleCard({ role, apply = false, rateUnit = "hour", showDate = false }: { role: EventRole; apply?: boolean; rateUnit?: "day" | "hour"; showDate?: boolean }) {
  return (
    <article className="panel role-card grid gap-4 p-6 shadow-sm hover:shadow-md transition-all border border-[var(--line)] rounded-2xl bg-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">{role.eventTitle}</span>
          <h3 className="mt-1 text-xl font-black tracking-tight text-[var(--foreground)]">{role.role}</h3>
          {role.company ? <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">{role.company}</p> : null}
        </div>
        <StatusBadge status={role.status} />
      </div>
      {role.description ? <p className="text-sm text-[var(--muted)] whitespace-pre-wrap">{role.description}</p> : null}

      <div className="grid gap-2 text-xs font-medium text-[var(--muted)]">
        {showDate ? (
          <span className="flex items-center gap-2">
            <CalendarDays size={15} className="text-[var(--accent)] shrink-0" aria-hidden />
            <span>{role.date}</span>
          </span>
        ) : null}
        <span className="flex items-center gap-2">
          <MapPin size={15} className="text-[var(--accent)] shrink-0" aria-hidden />
          <span>{role.location}</span>
        </span>
        {role.mapUrl?<a className="font-bold text-[var(--accent)] hover:underline" href={role.mapUrl} target="_blank" rel="noopener noreferrer">Open location in maps</a>:null}
        <span className="flex items-center gap-2">
          <Users size={15} className="text-[var(--accent)] shrink-0" aria-hidden />
          <span>{role.headcount} {role.headcount === 1 ? "position" : "positions"} open</span>
        </span>
        <span className="flex items-center gap-2">
          <Clock size={15} className="text-[var(--accent)] shrink-0" aria-hidden />
          <span>Shift: {role.shift}</span>
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--line)]">
        <div className="flex flex-wrap gap-1.5">
          {role.skills.map((skill) => (
            <span className="badge badge-surface text-[11px]" key={skill}>
              {skill}
            </span>
          ))}
        </div>
        <div className="shrink-0 font-black text-sm text-[var(--accent)] bg-[var(--surface)] px-3 py-1.5 rounded-lg border border-[var(--line)]">
          ₹{role.rate.toLocaleString("en-IN")}/{rateUnit}
        </div>
      </div>

      {role.agency ? <p className="text-xs text-[var(--muted)] italic">Managed by {role.agency}</p> : null}

      {role.applicationStatus?<p className="badge justify-self-start capitalize">Application: {role.applicationStatus.replaceAll("_"," ")}</p>:null}

      {apply && !role.applicationStatus ? (
        <div className="grid gap-3 mt-2 pt-3 border-t border-[var(--line)]">
          <Link className="button button-primary gap-2" href={`/dashboard/talent/apply/${role.id}`}>
            <Send size={15} aria-hidden />
            <span>Review and apply</span>
          </Link>
        </div>
      ) : null}
    </article>
  );
}
