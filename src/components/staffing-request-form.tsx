"use client";

import { useActionState, useState } from "react";
import { CalendarPlus, ShieldAlert } from "lucide-react";
import { createStaffingRole } from "@/app/actions/workflow";
import { SubmitButton } from "@/components/submit-button";
import { usePreserveFormValues } from "@/components/use-preserve-form-values";
import type { SelectableEvent } from "@/lib/exhibitor-events";
import { containsContactDetails } from "@/lib/contact-detector";

export function StaffingRequestForm({ source, events = [], exhibitorId }: { source: "agency" | "exhibitor"; events?: SelectableEvent[]; exhibitorId?: string }) {
  const [state, action, pending] = useActionState(createStaffingRole, { error: "", success: "" });
  const { formRef, capture } = usePreserveFormValues(state.error, pending);

  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [eventMode,setEventMode]=useState<"existing"|"inline">(events.length?"existing":"inline");
  const [rateMode,setRateMode]=useState<"fixed"|"range"|"negotiable">("fixed");

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
      <input type="hidden" name="event_mode" value={eventMode}/>
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
      <fieldset className="grid gap-4">
        <legend className="label">Event</legend>
        <div className="flex flex-wrap gap-2">
          <button className={`button ${eventMode==='existing'?'button-primary':'button-secondary'}`} type="button" disabled={!events.length} onClick={()=>setEventMode('existing')}>Link existing event</button>
          <button className={`button ${eventMode==='inline'?'button-primary':'button-secondary'}`} type="button" onClick={()=>setEventMode('inline')}>Add event details</button>
        </div>
      {eventMode==='existing' ? <>
        <label className="label">
          <span>Event <span className="text-red-500">*</span></span>
          <select className="input font-medium" name="selected_event" required defaultValue="">
            <option value="">Select an event</option>
            {events.map(event => <option key={event.value} value={event.value}>{event.title} · {event.city} · {event.starts_at} · {event.attribution}</option>)}
          </select>
        </label>
      </> : <div className="grid gap-4 rounded-xl border border-[var(--line)] p-4">
        <p className="text-sm text-[var(--muted)]">The request can be submitted now. Its event will be marked Verification required for admin review.</p>
        <label className="label">Event title <input className="input" name="event_title" required maxLength={160}/></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="label">City <input className="input" name="city" required maxLength={120}/></label><label className="label">Venue or address <input className="input" name="venue" required maxLength={200}/></label></div>
        <div className="grid gap-3 sm:grid-cols-2"><label className="label">Event starts <input className="input" name="starts_at" required type="date"/></label><label className="label">Event ends <input className="input" name="ends_at" required type="date"/></label></div>
        <label className="label">Shareable map link <span className="field-optional">Optional</span><input className="input" name="map_url" type="url" placeholder="https://maps.google.com/..."/></label>
      </div>}
      </fieldset>
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
        <label className="label"><span>Rate type</span><select className="input" name="rate_mode" value={rateMode} onChange={e=>setRateMode(e.target.value as typeof rateMode)}><option value="fixed">Fixed</option><option value="range">Range</option><option value="negotiable">Negotiable</option></select></label>
      </div>
      {rateMode!=='negotiable'?<div className="grid gap-3 sm:grid-cols-2"><label className="label">Proposed rate minimum (₹)<input className="input" min="0" name="proposed_rate_min" required type="number" step="0.01"/></label><label className="label">Proposed rate maximum (₹)<input className="input" min="0" name="proposed_rate_max" required={rateMode==='range'} type="number" step="0.01"/></label></div>:null}

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
          <span>Mandatory skills</span>
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
      <label className="label">Preferred skills<input className="input" name="preferred_skills" placeholder="Hospitality, POS experience"/></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="label">Required languages<input className="input" name="required_languages" placeholder="English, Hindi"/></label><label className="label">Worker standard<input className="input" name="worker_standard" placeholder="Experienced promoter"/></label></div>
      <div className="grid gap-3 sm:grid-cols-2"><label className="label">Reporting time<input className="input" name="reporting_time" type="time"/></label><label className="label">Working hours<input className="input" name="working_hours" placeholder="8 hours plus breaks"/></label></div>
      <div className="grid gap-3 sm:grid-cols-2"><label className="label">Gender requirement <span className="field-optional">Optional</span><input className="input" name="gender_requirement"/></label><label className="label">Age requirement <span className="field-optional">Optional</span><input className="input" name="age_requirement" placeholder="18–30"/></label></div>
      <label className="label">Dress code<input className="input" name="dress_code"/></label>
      <label className="label">Food, travel, and accommodation<textarea className="input textarea" name="benefits"/></label>
      <label className="label">Special instructions<textarea className="input textarea" name="special_instructions"/></label>
      <label className="label">Application deadline<input className="input" name="application_deadline" type="datetime-local"/></label>

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
      <SubmitButton disabled={contactDetected} pendingText="Submitting request…">Submit staffing request</SubmitButton>
    </form>
  );
}
