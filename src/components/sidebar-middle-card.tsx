import Link from "next/link";
import { ArrowRight, Check, Circle } from "lucide-react";
import type { UserRole } from "@/lib/types";

type Guide = {
  title: string;
  description: string;
  steps: [string, string, string];
  actionText: string;
  actionHref: string;
};

const roleGuides: Record<UserRole, Guide> = {
  talent: {
    title: "Find your next role",
    description: "Open roles are the quickest place to start.",
    steps: ["Complete your profile", "Choose a suitable role", "Send your application"],
    actionText: "Browse open roles",
    actionHref: "/browse",
  },
  exhibitor: {
    title: "Get ready for an event",
    description: "Start with the event, then add people or space.",
    steps: ["Add your event", "Request staff or space", "Review responses"],
    actionText: "Add an event",
    actionHref: "/dashboard/exhibitor/events/new",
  },
  organizer: {
    title: "Publish your event",
    description: "Create it once, then manage everything from its page.",
    steps: ["Create the event", "Add space and staffing", "Publish and manage"],
    actionText: "Create an event",
    actionHref: "/dashboard/organizer/events/new",
  },
  agency: {
    title: "Manage a client job",
    description: "Keep each client's activity together from the start.",
    steps: ["Add a client", "Create their request", "Track applicants"],
    actionText: "Add a client",
    actionHref: "/dashboard/agency/clients",
  },
  admin: {
    title: "Review what needs attention",
    description: "Start with submitted events awaiting a decision.",
    steps: ["Open the review queue", "Check event details", "Approve or return"],
    actionText: "Review events",
    actionHref: "/dashboard/admin/events",
  },
};

export function SidebarMiddleCard({ active }: { active: UserRole }) {
  const guide = roleGuides[active];

  return (
    <section className="panel rounded-2xl border border-[var(--line)] bg-white p-4 shadow-xs" aria-label="Quick start">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--accent)]">Quick start</p>
      <h2 className="mt-1 text-sm font-black tracking-tight">{guide.title}</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">{guide.description}</p>
      <ol className="mt-3 grid gap-2" aria-label="Recommended steps">
        {guide.steps.map((step, index) => (
          <li className="flex items-center gap-2 text-[11px] font-bold" key={step}>
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${index === 0 ? "bg-[var(--accent)] text-white" : "border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"}`} aria-hidden="true">
              {index === 0 ? <Check size={12} /> : <Circle size={8} />}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <Link href={guide.actionHref} className="mt-4 inline-flex w-full items-center justify-between rounded-xl bg-[var(--ink)] px-3 py-2.5 text-[11px] font-extrabold text-white transition-transform active:scale-[.98]">
        <span>{guide.actionText}</span>
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </section>
  );
}
