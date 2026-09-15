import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { ExhibitorEventForm } from "@/components/exhibitor-event-form";

export default async function NewExhibitorEvent() {
  await requireRole(["exhibitor"]);
  return (
    <DashboardShell active="exhibitor" current="/dashboard/exhibitor/events">
      <div className="max-w-2xl">
        <span className="badge badge-accent">Exhibitor panel</span>
        <h1 className="mt-3 mb-2 text-4xl font-black tracking-tight">Submit an event</h1>
        <p className="mb-6 text-[var(--muted)]">Propose an upcoming event for admin review and approval.</p>

        <ExhibitorEventForm />
      </div>
    </DashboardShell>
  );
}
