"use client";

import { useActionState, useState } from "react";
import { CalendarPlus, AlertCircle, PlusCircle, ShieldAlert } from "lucide-react";
import { createStaffingRole } from "@/app/actions/workflow";
import { SubmitButton } from "@/components/submit-button";
import { usePreserveFormValues } from "@/components/use-preserve-form-values";
import Link from "next/link";
import type { SelectableEvent } from "@/lib/exhibitor-events";
import { containsContactDetails } from "@/lib/contact-detector";

export function StaffingRequestForm({ source, events = [], exhibitorId }: { source: "agency" | "exhibitor"; events?: SelectableEvent[]; exhibitorId?: string }) {
  const [state, action, pending] = useActionState(createStaffingRole, { error: "", success: "" });
  const { formRef, capture } = usePreserveFormValues(state.error, pending);

  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");

  const descCheck = containsContactDetails(description);
  const skillsCheck = containsContactDetails(skills);
  const contactDetected = descCheck.hasContact || skillsCheck.hasContact;

  return (
    <form
      action={action}
      aria-busy={pending}
      className="panel grid gap-5 p-6 shadow-md"
      id="new-post"
      onSubmit={(event) => {
        if (pending || contactDetected) event.preventDefault();
        else capture();
      }}
      ref={formRef}
    >
      <input type="hidden" name="source" value={source} />
      {exhibitorId ? <input type="hidden" name="exhibitor_id" value={exhibitorId} /> : null}
      <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--accent)]">
          <CalendarPlus size={22} aria-hidden />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight">Create staffing request</h2>
          <p className="text-xs text-[var(--muted)]">Specify shift times, headcount, and required capabilities.</p>
        </div>
      </div>
      <>
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
      </>
      <label className="label">
        <span>Role title <span className="text-red-500">*</span></span>
        <input className="input" name="title" placeholder="e.g. Lead Generation Specialist" required />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="label">
          <span>First work day <span className="text-red-500">*</span></span>
          <input className="input" name="work_starts_on" required type="date" />
        </label>
        <label className="label">
          <span>Last work day <span className="text-red-500">*</span></span>
          <input className="input" name="work_ends_on" required type="date" />
        </label>
      </div>
      
      <label className="label">
        <span>Description</span>
        <textarea
          className={`input textarea ${descCheck.hasContact ? "border-amber-500 ring-2 ring-amber-400/30 bg-amber-50/30" : ""}`}
          name="description"
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe responsibilities, expectations, and attire standard..."
          value={description}
        />
        {descCheck.hasContact && (
          <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 p-2.5 rounded-lg mt-1" role="alert">
            <ShieldAlert size={16} className="shrink-0 text-amber-600" aria-hidden />
            <span>{descCheck.reason}</span>
          </p>
        )}
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="label">
          <span>Headcount <span className="text-red-500">*</span></span>
          <input className="input" min="1" name="headcount" required type="number" placeholder="1" />
        </label>
        <label className="label">
          <span>Hourly rate (₹ / INR) <span className="text-red-500">*</span></span>
          <input className="input" min="0" name="hourly_rate" required type="number" placeholder="500" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="label">
          <span>Shift start <span className="text-red-500">*</span></span>
          <input className="input" name="shift_start" required type="time" />
        </label>
        <label className="label">
          <span>Shift end <span className="text-red-500">*</span></span>
          <input className="input" name="shift_end" required type="time" />
        </label>
      </div>

      <label className="label">
        <span>Required skills</span>
        <input
          className={`input ${skillsCheck.hasContact ? "border-amber-500 ring-2 ring-amber-400/30 bg-amber-50/30" : ""}`}
          name="required_skills"
          onChange={(e) => setSkills(e.target.value)}
          placeholder="English, Lead capture, Product Demos"
          value={skills}
        />
        {skillsCheck.hasContact && (
          <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 p-2.5 rounded-lg mt-1" role="alert">
            <ShieldAlert size={16} className="shrink-0 text-amber-600" aria-hidden />
            <span>{skillsCheck.reason}</span>
          </p>
        )}
      </label>

      {contactDetected && (
        <div className="callout-banner callout-banner-amber my-1">
          <div className="flex items-start gap-3">
            <div className="callout-icon text-amber-700">
              <ShieldAlert size={22} aria-hidden />
            </div>
            <div className="callout-content">
              <h4 className="callout-title font-bold text-amber-900">Direct Contact Information Blocked</h4>
              <p className="callout-desc text-xs text-amber-800 mt-0.5">
                Phone numbers, email addresses, and external contact requests are automatically detected and blocked to protect user privacy and platform security. Please remove all contact details to proceed.
              </p>
            </div>
          </div>
        </div>
      )}

      {!pending && state.error ? <p className="alert" role="alert">{state.error}</p> : null}
      {!pending && state.success ? <p className="alert" role="status">{state.success}</p> : null}
      {events.length ? (
        <SubmitButton disabled={contactDetected} pendingText="Publishing request…">
          Publish request
        </SubmitButton>
      ) : null}
    </form>
  );
}
