import Link from "next/link";
import { AlertCircle, CheckCircle2, CircleDashed, ShieldAlert } from "lucide-react";
import type { ResponsibilityItem, UserRole } from "@/lib/types";
import { roleDefinitions } from "@/lib/role-capabilities";

const stateView = {
  complete: { icon: CheckCircle2, label: "Complete", className: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  action_required: { icon: AlertCircle, label: "Action required", className: "text-amber-800 bg-amber-50 border-amber-200" },
  blocked: { icon: ShieldAlert, label: "Restricted", className: "text-rose-700 bg-rose-50 border-rose-200" },
  informational: { icon: CircleDashed, label: "Ongoing", className: "text-blue-700 bg-blue-50 border-blue-200" },
} as const;

export function ResponsibilityPanel({ role, items }: { role: UserRole; items: ResponsibilityItem[] }) {
  const definition = roleDefinitions[role];
  const complete = items.filter((item) => item.state === "complete").length;
  return (
    <details className="panel mb-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xs">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 marker:content-none">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--accent)]">Your role and responsibilities</p>
          <h2 className="mt-1 text-lg font-black text-slate-900">{definition.label}</h2>
          <p className="mt-1 text-xs font-medium text-[var(--muted)]">{definition.summary}</p>
        </div>
        <span className="badge shrink-0">{complete}/{items.length} complete</span>
      </summary>
      <div className="grid gap-3 border-t border-[var(--line)] bg-[var(--surface)]/60 p-5 lg:grid-cols-3">
        {items.map((item) => {
          const view = stateView[item.state];
          const Icon = view.icon;
          return <Link className="rounded-xl border border-[var(--line)] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-sm" href={item.href} key={item.id}>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${view.className}`}><Icon size={12} />{view.label}</span>
            <strong className="mt-3 block text-sm text-slate-900">{item.title}</strong>
            <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">{item.description}</span>
            {item.blocker ? <span className="mt-2 block text-[11px] font-bold text-rose-700">{item.blocker}</span> : null}
          </Link>;
        })}
      </div>
    </details>
  );
}
