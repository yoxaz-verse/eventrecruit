import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { submitExhibitorEvent } from "@/app/actions/exhibitor-events";
import { SubmitButton } from "@/components/submit-button";

export default async function NewExhibitorEvent() {
  await requireRole(["exhibitor"]);
  return <DashboardShell active="exhibitor" current="/dashboard/exhibitor/events"><span className="badge">Exhibitor panel</span><h1 className="mt-3 mb-6 text-4xl font-black">Submit an event</h1><form action={submitExhibitorEvent} className="panel grid max-w-2xl gap-4 p-6"><p className="text-[var(--muted)]">Your event will be reviewed before it appears publicly or can be used for a request.</p><label className="label">Event title<input className="input" name="title" maxLength={160} required /></label><label className="label">Description<textarea className="input textarea" name="description" maxLength={10000} /></label><label className="label">Venue<input className="input" name="venue" maxLength={200} required /></label><label className="label">City<input className="input" name="city" maxLength={120} required /></label><div className="grid gap-3 sm:grid-cols-2"><label className="label">Starts<input className="input" name="starts_at" type="date" required /></label><label className="label">Ends<input className="input" name="ends_at" type="date" required /></label></div><SubmitButton pendingText="Submitting…">Submit for review</SubmitButton></form></DashboardShell>;
}
