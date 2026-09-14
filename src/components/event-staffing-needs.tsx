import type { StaffingNeed } from '@/lib/organizer';

export function EventStaffingNeeds({needs}:{needs:StaffingNeed[] | null | undefined}) {
 if (!needs?.length) return <p className="text-sm text-[var(--muted)]">Talent positions to be added.</p>;
 return <div className="grid gap-2" aria-label="Talent positions needed">{needs.map((need,index)=><div className="flex items-start justify-between gap-4 text-sm" key={`${need.title}-${index}`}><span className="font-semibold">{need.title || 'Position to be confirmed'}</span><span className="shrink-0 font-bold text-[var(--accent)]">{need.people_needed ?? '—'} {need.people_needed===1?'person':'people'} needed</span></div>)}</div>;
}
