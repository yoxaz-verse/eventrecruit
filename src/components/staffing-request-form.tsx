"use client";

import { useActionState } from "react";
import { CalendarPlus } from "lucide-react";
import { createStaffingRole } from "@/app/actions/workflow";
import { SubmitButton } from "@/components/submit-button";
import { usePreserveFormValues } from "@/components/use-preserve-form-values";

export function StaffingRequestForm({ source }: { source: "agency" | "exhibitor" }) {
  const [state, action, pending] = useActionState(createStaffingRole, { error: "", success: "" });
  const { formRef, capture } = usePreserveFormValues(state.error, pending);
  return <form action={action} aria-busy={pending} className="panel grid gap-4 p-5" id="new-post" onSubmit={(event) => { if (pending) event.preventDefault(); else capture(); }} ref={formRef}>
    <input type="hidden" name="source" value={source} />
    <div className="flex items-center gap-2"><CalendarPlus className="text-[var(--accent)]" aria-hidden /><h2 className="text-2xl font-black">Create staffing request</h2></div>
    <label className="label">Event title<input className="input" name="event_title" required /></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="label">Venue<input className="input" name="venue" required /></label><label className="label">City<input className="input" name="city" required /></label></div>
    <div className="grid gap-3 sm:grid-cols-2"><label className="label">Starts<input className="input" name="starts_at" required type="date" /></label><label className="label">Ends<input className="input" name="ends_at" required type="date" /></label></div>
    <label className="label">Role title<input className="input" name="title" required /></label>
    <label className="label">Description<textarea className="input textarea" name="description" /></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="label">Headcount<input className="input" min="1" name="headcount" required type="number" /></label><label className="label">Hourly rate<input className="input" min="0" name="hourly_rate" required type="number" /></label></div>
    <div className="grid gap-3 sm:grid-cols-2"><label className="label">Shift start<input className="input" name="shift_start" required type="time" /></label><label className="label">Shift end<input className="input" name="shift_end" required type="time" /></label></div>
    <label className="label">Required skills<input className="input" name="required_skills" placeholder="English, Lead capture" /></label>
    {!pending && state.error ? <p className="alert" role="alert">{state.error}</p> : null}
    {!pending && state.success ? <p className="alert" role="status">{state.success}</p> : null}
    <SubmitButton pendingText="Publishing request…">Publish request</SubmitButton>
  </form>;
}
