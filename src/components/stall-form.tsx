"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveStall } from "@/app/actions/stalls";
import { SubmitButton } from "@/components/submit-button";
import { VenueLocationPicker, type ConfirmedVenueLocation } from "@/components/venue-location-picker";
import type { SelectableEvent } from "@/lib/exhibitor-events";
import type { LocationOption } from "@/lib/locations";
import type { StallSummary } from "@/lib/exhibitor-stalls";

export function StallForm({events,stalls,locations,exhibitorId,addEventHref}:{events:SelectableEvent[];stalls:StallSummary[];locations:LocationOption[];exhibitorId?:string;addEventHref:string}){
 const [state,action,pending]=useActionState(saveStall,{error:""});
 const [mode,setMode]=useState<"existing"|"new"|"other">(events.length?"existing":"other");
 const [selected,setSelected]=useState("");
 const [search,setSearch]=useState("");
 const [locationValid,setLocationValid]=useState(false);
 const [venue,setVenue]=useState("");
 const [clientError,setClientError]=useState("");
 const submittingRef=useRef(false);
 const filtered=useMemo(()=>{const q=search.trim().toLowerCase();return q?events.filter(e=>`${e.title} ${e.venue} ${e.city} ${e.attribution}`.toLowerCase().includes(q)):events;},[events,search]);
 const chosen=events.find(e=>e.value===selected);
 const duplicates=chosen?stalls.filter(stall=>stall.event_id && stall.eventTitle===chosen.title && stall.eventCity===chosen.city):[];
 const confirmed=useCallback((value:ConfirmedVenueLocation|null)=>{setLocationValid(Boolean(value));if(value)setVenue(value.location.venue);},[]);
 useEffect(()=>{if(!pending)submittingRef.current=false;},[pending,state]);
 const validateAndSubmit=(event:React.FormEvent<HTMLFormElement>)=>{
  if(pending||submittingRef.current){event.preventDefault();return;}
  const form=event.currentTarget;
  if(!form.checkValidity()){
   event.preventDefault();
   const invalid=form.querySelector<HTMLElement>(":invalid");
   setClientError("Complete the highlighted required field before saving the stall.");
   invalid?.focus({preventScroll:true});
   invalid?.scrollIntoView({behavior:"smooth",block:"center"});
   form.reportValidity();
   return;
  }
  if(mode==="other"&&!locationValid){
   event.preventDefault();
   setClientError("Confirm the venue location before saving the stall.");
   return;
  }
  setClientError("");
  submittingRef.current=true;
 };
 return <form action={action} aria-busy={pending} className="panel grid gap-5 p-6" noValidate onSubmit={validateAndSubmit}>
  {exhibitorId?<input type="hidden" name="exhibitor_id" value={exhibitorId}/>:null}<input type="hidden" name="event_mode" value={mode}/>
  <fieldset className="grid gap-3"><legend className="text-lg font-black">1. Choose how this stall connects to an event</legend><div className="flex flex-wrap gap-2">
   <button type="button" className={`button ${mode==="existing"?"button-primary":"button-secondary"}`} disabled={!events.length} onClick={()=>setMode("existing")}>Existing event</button>
   <button type="button" className={`button ${mode==="new"?"button-primary":"button-secondary"}`} onClick={()=>setMode("new")}>Add new event</button>
   <button type="button" className={`button ${mode==="other"?"button-primary":"button-secondary"}`} onClick={()=>setMode("other")}>Other / missing event</button>
  </div></fieldset>
  {mode==="existing"?<div className="grid gap-3"><label className="label">Search events<input className="input" type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label><label className="label">Event<select className="input" name="selected_event" required value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select an event</option>{filtered.map(event=><option key={event.value} value={event.value}>{event.title} · {event.venue} · {event.attribution}</option>)}</select></label>{chosen?<div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4"><strong>{chosen.title}</strong><p className="text-sm">{chosen.venue}, {chosen.city} · {chosen.starts_at}–{chosen.ends_at}</p><p className="mt-1 text-xs text-[var(--muted)]">{chosen.attribution}</p></div>:null}{duplicates.length?<div className="alert" role="status"><strong>A stall may already be registered for this event.</strong><p className="mt-1">{duplicates.map(stall=>stall.name).join(", ")}. You may continue if this is a different stall.</p></div>:null}</div>:null}
  {mode==="new"?<div className="rounded-xl border border-blue-200 bg-blue-50 p-5"><h3 className="font-black">Create a reusable event first</h3><p className="mt-1 text-sm">Submit the full event once, then return here and select it for this stall.</p><Link className="button button-primary mt-4" href={addEventHref}>Add new event</Link></div>:null}
  {mode==="other"?<div className="grid gap-4 rounded-xl border border-[var(--line)] p-4"><p className="text-sm text-[var(--muted)]">Use this for a one-off event that should not become a reusable catalog submission.</p><label className="label">Event title<input className="input" name="event_title" required maxLength={160}/></label><label className="label">Venue<input className="input" name="venue" required maxLength={200} value={venue} onChange={e=>setVenue(e.target.value)}/></label><VenueLocationPicker locations={locations} onConfirmedLocationChange={confirmed}/><div className="grid gap-3 sm:grid-cols-2"><label className="label">Starts<input className="input" name="starts_at" type="date" required/></label><label className="label">Ends<input className="input" name="ends_at" type="date" required/></label></div><label className="label">Map link <span className="field-optional">Optional</span><input className="input" name="map_url" type="url"/></label></div>:null}
  {mode!=="new"?<><fieldset className="grid gap-4 border-t border-[var(--line)] pt-5"><legend className="text-lg font-black">2. Stall information</legend><label className="label">Stall name<input className="input" name="name" required maxLength={160} placeholder="Brand experience booth"/></label><div className="grid gap-3 sm:grid-cols-2"><label className="label">Booth number <span className="field-optional">Optional</span><input className="input" name="booth_number" maxLength={80}/></label><label className="label">Location inside venue <span className="field-optional">Optional</span><input className="input" name="booth_location" maxLength={240}/></label><label className="label">Area (sq ft) <span className="field-optional">Optional</span><input className="input" name="area_sqft" type="number" min="0.01" step="0.01"/></label><label className="label">Dimensions <span className="field-optional">Optional</span><input className="input" name="dimensions" maxLength={160} placeholder="3 m × 3 m"/></label></div><label className="label">Description <span className="field-optional">Optional</span><textarea className="input textarea" name="description" maxLength={5000}/></label><label className="label">Products or services <span className="field-optional">Optional</span><textarea className="input textarea" name="products_services" maxLength={5000}/></label><label className="label">Branding notes <span className="field-optional">Optional</span><textarea className="input textarea" name="branding_notes" maxLength={3000}/></label><div className="grid gap-3 sm:grid-cols-2"><label className="label">Utilities <span className="field-optional">Optional</span><textarea className="input textarea" name="utilities" maxLength={3000}/></label><label className="label">Equipment <span className="field-optional">Optional</span><textarea className="input textarea" name="equipment" maxLength={3000}/></label><label className="label">Setup time <span className="field-optional">Optional</span><input className="input" name="setup_at" type="datetime-local"/></label><label className="label">Teardown time <span className="field-optional">Optional</span><input className="input" name="teardown_at" type="datetime-local"/></label></div><label className="label">Vendor details <span className="field-optional">Optional</span><textarea className="input textarea" name="vendor_details" maxLength={3000}/></label><label className="label">Permits and documents <span className="field-optional">Optional</span><textarea className="input textarea" name="permits_documents" maxLength={3000}/></label><label className="label">Special instructions <span className="field-optional">Optional</span><textarea className="input textarea" name="instructions" maxLength={5000}/></label></fieldset>{clientError?<p className="alert" role="alert">{clientError}</p>:null}{state.error?<p className="alert" role="alert">{state.error}</p>:null}{mode==="other"&&!locationValid?<p className="text-sm text-[var(--muted)]" role="status">Confirm the venue location to enable saving.</p>:null}<SubmitButton disabled={mode==="other"&&!locationValid} pendingText="Saving stall…">Save stall and continue</SubmitButton></>:null}
 </form>;
}
