"use client";

import { useActionState } from "react";
import { CalendarPlus, AlertCircle, PlusCircle } from "lucide-react";
import { createStaffingRole } from "@/app/actions/workflow";
import { SubmitButton } from "@/components/submit-button";
import { usePreserveFormValues } from "@/components/use-preserve-form-values";
import Link from "next/link";
import type { SelectableEvent } from "@/lib/exhibitor-events";

export function StaffingRequestForm({ source, events = [] }: { source: "agency" | "exhibitor"; events?: SelectableEvent[] }) {
  const [state, action, pending] = useActionState(createStaffingRole, { error: "", success: "" });
  const { formRef, capture } = usePreserveFormValues(state.error, pending);
  return <form action={action} aria-busy={pending} className="panel grid gap-5 p-6 shadow-md" id="new-post" onSubmit={(event) => { if (pending) event.preventDefault(); else capture(); }} ref={formRef}>
    <input type="hidden" name="source" value={source} />
    <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--accent)]">
        <CalendarPlus size={22} aria-hidden />
      </div>
      <div>
        <h2 className="text-2xl font-black tracking-tight">Create staffing request</h2>
        <p className="text-xs text-[var(--muted)]">Specify shift times, headcount, and required capabilities.</p>
      </div>
    </div>
    {source === "exhibitor" ? <>
      <label className="label">
        <span>Event <span className="text-red-500">*</span></span>
        <select className="input font-medium" name="selected_event" required disabled={!events.length} defaultValue="">
          <option value="">{events.length ? "Select an approved event" : "No approved upcoming events available"}</option>
          {events.map(event => <option key={event.value} value={event.value}>{event.title} · {event.city} · {event.starts_at} · {event.attribution}</option>)}
        </select>
      </label>
      {!events.length && (
        <div className="callout-banner callout-banner-amber my-1">
          <div className="flex items-start gap-3">
            <div className="callout-icon">
              <AlertCircle size={22} aria-hidden />
            </div>
            <div className="callout-content">
              <h4 className="callout-title">No approved events found</h4>
              <p className="callout-desc">
                You need an approved upcoming event before publishing a staffing request.
              </p>
            </div>
          </div>
          <Link href="/dashboard/exhibitor/events/new" className="callout-btn">
            <PlusCircle size={17} aria-hidden />
            <span>Submit event for review</span>
          </Link>
        </div>
      )}
    </> : <>
      <label className="label">Event title<input className="input" name="event_title" required /></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="label">Venue<input className="input" name="venue" required /></label><label className="label">City<input className="input" name="city" required /></label></div>
      <div className="grid gap-3 sm:grid-cols-2"><label className="label">Starts<input className="input" name="starts_at" required type="date" /></label><label className="label">Ends<input className="input" name="ends_at" required type="date" /></label></div>
    </>}
    <label className="label">Role title<input className="input" name="title" placeholder="e.g. Lead Generation Specialist" required /></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="label">First work day<input className="input" name="work_starts_on" required type="date" /></label><label className="label">Last work day<input className="input" name="work_ends_on" required type="date" /></label></div>
    <label className="label">Description<textarea className="input textarea" name="description" placeholder="Describe responsibilities, expectations, and attire standard..." /></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="label">Headcount<input className="input" min="1" name="headcount" required type="number" placeholder="1" /></label><label className="label">Hourly rate ($)<input className="input" min="0" name="hourly_rate" required type="number" placeholder="25" /></label></div>
    <div className="grid gap-3 sm:grid-cols-2"><label className="label">Shift start<input className="input" name="shift_start" required type="time" /></label><label className="label">Shift end<input className="input" name="shift_end" required type="time" /></label></div>
    <label className="label">Required skills<input className="input" name="required_skills" placeholder="English, Lead capture, Product Demos" /></label>
    {!pending && state.error ? <p className="alert" role="alert">{state.error}</p> : null}
    {!pending && state.success ? <p className="alert" role="status">{state.success}</p> : null}
    {source !== "exhibitor" || events.length ? <SubmitButton pendingText="Publishing request…">Publish request</SubmitButton> : null}
  </form>;
}
