import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { submitExhibitorEvent } from "@/app/actions/exhibitor-events";
import { SubmitButton } from "@/components/submit-button";
import { CalendarPlus, ShieldCheck, Sparkles } from "lucide-react";

export default async function NewExhibitorEvent() {
  await requireRole(["exhibitor"]);
  return (
    <DashboardShell active="exhibitor" current="/dashboard/exhibitor/events">
      <div className="max-w-2xl">
        <span className="badge badge-accent">Exhibitor panel</span>
        <h1 className="mt-3 mb-2 text-4xl font-black tracking-tight">Submit an event</h1>
        <p className="mb-6 text-[var(--muted)]">Propose an upcoming event for admin review and approval.</p>

        <form action={submitExhibitorEvent} className="panel grid gap-5 p-6 shadow-md">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
            <ShieldCheck size={20} className="mt-0.5 text-emerald-600 shrink-0" />
            <p className="text-xs leading-relaxed">
              Once submitted, organizers or site administrators review details for verification. After approval, you can immediately post staffing requests for this event.
            </p>
          </div>

          <label className="label">
            <span>Event title <span className="text-red-500">*</span></span>
            <input className="input" name="title" maxLength={160} placeholder="e.g. International Tech Expo 2026" required />
          </label>

          <label className="label">
            <span>Description</span>
            <textarea className="input textarea" name="description" maxLength={10000} placeholder="Describe the expo, key attendee demographics, booth expectations..." />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="label">
              <span>Venue <span className="text-red-500">*</span></span>
              <input className="input" name="venue" maxLength={200} placeholder="e.g. Convention Center Hall A" required />
            </label>
            <label className="label">
              <span>City <span className="text-red-500">*</span></span>
              <input className="input" name="city" maxLength={120} placeholder="e.g. San Francisco, CA" required />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="label">
              <span>Starts <span className="text-red-500">*</span></span>
              <input className="input" name="starts_at" type="date" required />
            </label>
            <label className="label">
              <span>Ends <span className="text-red-500">*</span></span>
              <input className="input" name="ends_at" type="date" required />
            </label>
          </div>

          <SubmitButton pendingText="Submitting for approval…">Submit event for approval</SubmitButton>
        </form>
      </div>
    </DashboardShell>
  );
}

