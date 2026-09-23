"use client";

import { useActionState } from "react";
import { submitExhibitorEvent } from "@/app/actions/exhibitor-events";
import { SubmitButton } from "@/components/submit-button";
import { VenueLocationPicker } from "@/components/venue-location-picker";
import type { LocationOption } from "@/lib/locations";
import { EventAmenitiesField } from "@/components/event-amenities-field";

export function ExhibitorEventForm({exhibitorId,locations=[],locationError=false}:{exhibitorId?:string;locations?:LocationOption[];locationError?:boolean}){
  const [state,action]=useActionState(submitExhibitorEvent,{error:""});
  const unavailable=locationError||locations.length===0;
  return <form action={action} className="panel grid gap-5 p-6">{exhibitorId?<input type="hidden" name="exhibitor_id" value={exhibitorId}/>:null}<label className="label">Event title<input className="input" name="title" maxLength={160} required/></label><label className="label">Description<textarea className="input textarea" name="description" maxLength={10000}/></label><VenueLocationPicker locations={locations}/><div className="grid gap-4 sm:grid-cols-2"><label className="label">Starts<input className="input" name="starts_at" type="date" required/></label><label className="label">Ends<input className="input" name="ends_at" type="date" required/></label></div><EventAmenitiesField/>{state.error?<p className="alert" role="alert">{state.error}</p>:null}<SubmitButton pendingText="Submitting…" disabled={unavailable}>Submit event for approval</SubmitButton></form>
}
