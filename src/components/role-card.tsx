import { CalendarDays, MapPin, Users, Clock, Send, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { EventRole } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

export function RoleCard({ role, apply = false, rateUnit = "hour", showDate = false }: { role: EventRole; apply?: boolean; rateUnit?: "day" | "hour"; showDate?: boolean }) {
  return (
    <article className="panel role-card grid gap-4 p-6 shadow-xs hover:shadow-md transition-all duration-200 border border-[var(--line)] hover:border-[var(--accent)]/40 rounded-2xl bg-white group flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--line)]/60">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1">
              <ShieldCheck size={13} className="text-[var(--accent)]" />
              <span>{role.eventTitle}</span>
            </span>
            <h3 className="mt-1 text-xl font-black tracking-tight text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">{role.role}</h3>
            {role.company ? <p className="mt-0.5 text-xs font-semibold text-[var(--muted)]">{role.company}</p> : null}
          </div>
          <StatusBadge status={role.status} />
        </div>

        {role.description ? <p className="text-sm text-[var(--muted)] line-clamp-3 whitespace-pre-wrap">{role.description}</p> : null}

        <div className="grid gap-2 text-xs font-medium text-[var(--muted)] pt-1">
          {showDate ? (
            <span className="flex items-center gap-2">
              <CalendarDays size={15} className="text-[var(--accent)] shrink-0" aria-hidden />
              <span className="font-semibold text-slate-700">{role.date}</span>
            </span>
          ) : null}
          <span className="flex items-center gap-2">
            <MapPin size={15} className="text-[var(--accent)] shrink-0" aria-hidden />
            <span className="font-semibold text-slate-700">{role.location}</span>
          </span>
          {role.mapUrl ? (
            <a className="inline-flex items-center gap-1 font-bold text-xs text-[var(--accent)] hover:underline ml-6" href={role.mapUrl} target="_blank" rel="noopener noreferrer">
              <span>Open location in maps</span>
              <ExternalLink size={12} />
            </a>
          ) : null}
          <span className="flex items-center gap-2">
            <Users size={15} className="text-[var(--accent)] shrink-0" aria-hidden />
            <span><strong className="text-slate-900 font-bold">{role.headcount}</strong> {role.headcount === 1 ? "position" : "positions"} open</span>
          </span>
          <span className="flex items-center gap-2">
            <Clock size={15} className="text-[var(--accent)] shrink-0" aria-hidden />
            <span>Shift: <strong className="text-slate-900 font-bold">{role.shift}</strong></span>
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-[var(--line)] space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-wrap gap-1.5">
            {role.skills.map((skill) => (
              <span className="badge badge-surface text-[11px] font-semibold" key={skill}>
                {skill}
              </span>
            ))}
          </div>
          <div className="shrink-0 font-black text-sm text-[var(--accent)] bg-[var(--surface)] px-3 py-1.5 rounded-xl border border-[var(--line)] shadow-2xs">
            ₹{role.rate.toLocaleString("en-IN")}/{rateUnit}
          </div>
        </div>

        {role.agency ? <p className="text-xs text-[var(--muted)] italic">Managed by {role.agency}</p> : null}

        {role.applicationStatus ? <p className="badge justify-self-start capitalize font-bold">Application: {role.applicationStatus.replaceAll("_", " ")}</p> : null}

        {apply && !role.applicationStatus ? (
          <div className="pt-2">
            <Link className="button button-primary gap-2 w-full shadow-xs hover:shadow-md" href={`/dashboard/talent/apply/${role.id}`}>
              <Send size={15} aria-hidden />
              <span>Review and apply</span>
            </Link>
          </div>
        ) : null}
      </div>
    </article>
  );
}
