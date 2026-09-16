'use client';
import { useActionState, useState } from 'react';
import { saveCompany, saveEvent } from '@/app/actions/organizer';
import { eventRequirementTemplates, eventTypeLabels, eventTypes, requirementSectionLabels, requirementSections, venueSettingLabels, venueSettings, type BookingSlot, type Company, type EventType, type OrganizerEvent, type RequirementSection, type SpaceOffer } from '@/lib/organizer';
import { SubmitButton } from '@/components/submit-button';
import { VenueLocationPicker } from '@/components/venue-location-picker';
import type { LocationOption } from '@/lib/locations';
import { EventAmenitiesField } from '@/components/event-amenities-field';
import { CompressedImageInput } from '@/components/compressed-image-input';
export function CompanyForm({company}:{company?:Company}) {
 const [state,action]=useActionState(saveCompany,{error:''});
 return <form action={action} className="panel grid gap-4 p-6">
 <input type="hidden" name="id" value={company?.id??""}/>
 <label className="label">Company name<input className="input" name="name" required minLength={2} maxLength={160} defaultValue={company?.name}/></label>
 <label className="label">City<input className="input" name="city" required maxLength={120} defaultValue={company?.city}/></label>
 <label className="label">About the company<textarea className="input textarea" name="description" required maxLength={5000} defaultValue={company?.description}/></label>
 <label className="label">Website (optional)<input className="input" name="website" type="url" defaultValue={company?.website}/></label>
 <label className="label">Private contact phone<input className="input" name="phone" type="tel" required maxLength={40} autoComplete="tel"/><span className="text-sm">Only platform administrators can read your saved contact phone. Re-enter it when updating your company.</span></label>
 {state.error && <p className="alert" role="alert">{state.error}</p>}<SubmitButton pendingText="Saving company…">Save company</SubmitButton>
 </form>;
}
export function EventForm({event,slots=[],offers=[],locations=[],companies=[]}:{event?:OrganizerEvent;slots?:BookingSlot[];offers?:SpaceOffer[];locations?:LocationOption[];companies?:Company[]}) {
 const [state,action]=useActionState(saveEvent,{error:''});
 const [eventType,setEventType]=useState<EventType>(event?.event_type??'other');
 const [logoStatus,setLogoStatus]=useState<'idle'|'compressing'|'ready'|'error'>('idle');
 const inferredSections:RequirementSection[]=[...(event?.requirement_sections??[])];
 if(offers.length&&!inferredSections.includes('exhibitor_spaces')) inferredSections.push('exhibitor_spaces');
 if((slots.length||event?.booking_url)&&!inferredSections.includes('attendee_booking')) inferredSections.push('attendee_booking');
 if(event?.staffing_needs?.length&&!inferredSections.includes('staffing')) inferredSections.push('staffing');
 const [enabledSections,setEnabledSections]=useState<RequirementSection[]>(inferredSections);
 const [requirementDetails,setRequirementDetails]=useState<Partial<Record<RequirementSection,string>>>(event?.requirement_details??{});
 const [needs,setNeeds]=useState((event?.staffing_needs?.length ? event.staffing_needs : [{title:'',people_needed:null}]).map((need,index)=>({key:index,title:need.title,people_needed:need.people_needed?.toString()??''})));
 const [nextKey,setNextKey]=useState(needs.length);
 const [bookingSlots,setBookingSlots]=useState(slots.map((slot,index)=>({...slot,key:index})));
 const [nextSlotKey,setNextSlotKey]=useState(slots.length);
 const [spaceOffers,setSpaceOffers]=useState(offers.map((offer,index)=>({...offer,key:index,area_sqft:offer.area_sqft?.toString()??'',unit_count:offer.unit_count?.toString()??'',price_inr:offer.price_inr?.toString()??''})));
 const [nextOfferKey,setNextOfferKey]=useState(offers.length);
 const chooseEventType=(next:EventType)=>{ setEventType(next); setEnabledSections(current=>[...new Set([...current,...eventRequirementTemplates[next]])]); };
 const toggleSection=(section:RequirementSection,checked:boolean)=>{
  if(checked) { setEnabledSections(current=>[...current,section]); return; }
  const hasData=(section==='exhibitor_spaces'&&spaceOffers.length>0)||(section==='staffing'&&needs.some(need=>need.title||need.people_needed))||(section==='attendee_booking'&&bookingSlots.length>0)||Boolean(requirementDetails[section]?.trim());
  if(hasData&&!window.confirm(`Hide ${requirementSectionLabels[section]}? Saved details in this section will be retained, but its active entries will be removed when you save.`)) return;
  setEnabledSections(current=>current.filter(item=>item!==section));
 };
 return <form action={action} className="panel grid gap-4 p-6">
 <input type="hidden" name="id" value={event?.id ?? ''}/>
 <label className="label">Publishing company<select className="input" name="company_id" required defaultValue={event?.company_id??companies[0]?.id??""}><option value="" disabled>Select a company</option>{event&&!companies.some(company=>company.id===event.company_id)?<option value={event.company_id}>Current company</option>:null}{companies.map(company=><option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
 <input type="hidden" name="requirement_details" value={JSON.stringify(requirementDetails)}/>
 <label className="label">Event title<input className="input" name="title" required maxLength={160} defaultValue={event?.title}/></label>
 <div className="grid gap-3 rounded-xl border border-[var(--line)] p-4"><CompressedImageInput name="logo" label="Event logo (optional)" currentImageUrl={event?.logo_path?`/api/media/event/${event.id}`:null} onStatusChange={setLogoStatus}/>{event?.logo_path?<label className="text-sm"><input type="checkbox" name="remove_logo" value="1"/> Remove current logo</label>:null}</div>
 <div className="grid gap-4 sm:grid-cols-2"><label className="label">Event type<select className="input" name="event_type" required value={eventType} onChange={e=>chooseEventType(e.target.value as EventType)}>{eventTypes.map(type=><option value={type} key={type}>{eventTypeLabels[type]}</option>)}</select><span className="text-sm">Changing type adds its recommended sections without removing your work.</span></label><label className="label">Venue setting<select className="input" name="venue_setting" required defaultValue={event?.venue_setting??'other'}>{venueSettings.map(setting=><option value={setting} key={setting}>{venueSettingLabels[setting]}</option>)}</select></label></div>
 <fieldset className="grid gap-3 border-t border-[var(--line)] pt-5"><legend className="text-lg font-bold">Requirement sections</legend><p className="text-sm text-[var(--muted)]">The event type preselects recommendations. Adjust them for this event.</p><div className="grid gap-3 sm:grid-cols-2">{requirementSections.map(section=><label className="flex items-center gap-2" key={section}><input type="checkbox" name="requirement_sections" value={section} checked={enabledSections.includes(section)} onChange={e=>toggleSection(section,e.target.checked)}/>{requirementSectionLabels[section]}</label>)}</div>{enabledSections.map(section=><label className="label" key={section}>{requirementSectionLabels[section]} notes (optional)<textarea className="input textarea" maxLength={3000} value={requirementDetails[section]??''} onChange={e=>setRequirementDetails(current=>({...current,[section]:e.target.value}))} placeholder="Add instructions, facilities, timings, or other requirements"/></label>)}</fieldset>
 <label className="label">Description<textarea className="input textarea" name="description" maxLength={10000} defaultValue={event?.description}/></label>
 <VenueLocationPicker locations={locations} initialLocationId={event?.location_id} initial={event ? {venue:event.venue,city:event.city,label:event.location_label??undefined,latitude:event.latitude??undefined,longitude:event.longitude??undefined,countryCode:event.location_country_code==='IN'?'IN':undefined} : undefined}/>
 <label className="label">Shareable map link <span className="field-optional">Optional</span><input className="input" name="map_url" type="url" defaultValue={event?.map_url??""} placeholder="https://maps.google.com/..."/></label>
 <div className="grid gap-4 sm:grid-cols-2"><label className="label">Start date<input className="input" name="starts_at" type="date" defaultValue={event?.starts_at??''}/></label><label className="label">End date<input className="input" name="ends_at" type="date" defaultValue={event?.ends_at??''}/></label></div>
 <EventAmenitiesField initialAmenities={event?.amenities} initialCustomAmenities={event?.custom_amenities}/>
 {enabledSections.includes('attendee_booking')&&<fieldset className="grid gap-3 border-t border-[var(--line)] pt-5"><legend className="text-lg font-bold">Attendee booking</legend><p className="text-sm text-[var(--muted)]">Add an external booking page, in-app time slots, or both. Times use India time.</p>
 <label className="label">External booking link (optional)<input className="input" name="booking_url" type="url" placeholder="https://example.com/book" defaultValue={event?.booking_url??''}/></label>
 {bookingSlots.map((slot,index)=><div className="grid gap-3 rounded-xl border border-[var(--line)] p-4 sm:grid-cols-2" key={slot.key}>
 <input type="hidden" name="slot_id" value={slot.id??''}/>
 <label className="label">Date<input className="input" name="slot_date" type="date" required value={slot.slot_date} onChange={e=>setBookingSlots(rows=>rows.map(row=>row.key===slot.key?{...row,slot_date:e.target.value}:row))}/></label>
 <label className="label">Capacity<input className="input" name="slot_capacity" type="number" min={1} max={100000} required value={slot.capacity} onChange={e=>setBookingSlots(rows=>rows.map(row=>row.key===slot.key?{...row,capacity:Number(e.target.value)}:row))}/></label>
 <label className="label">Start time<input className="input" name="slot_start" type="time" required value={slot.start_time.slice(0,5)} onChange={e=>setBookingSlots(rows=>rows.map(row=>row.key===slot.key?{...row,start_time:e.target.value}:row))}/></label>
 <label className="label">End time<input className="input" name="slot_end" type="time" required value={slot.end_time.slice(0,5)} onChange={e=>setBookingSlots(rows=>rows.map(row=>row.key===slot.key?{...row,end_time:e.target.value}:row))}/></label>
 <button className="button button-secondary justify-self-start" type="button" onClick={()=>setBookingSlots(rows=>rows.filter(row=>row.key!==slot.key))}>Remove slot {index+1}</button>
 </div>)}
 <button className="button button-secondary justify-self-start" type="button" onClick={()=>{setBookingSlots(rows=>[...rows,{key:nextSlotKey,slot_date:'',start_time:'',end_time:'',capacity:1}]);setNextSlotKey(key=>key+1);}}>Add slot</button></fieldset>}
 {enabledSections.includes('exhibitor_spaces')&&<fieldset className="grid gap-3 border-t border-[var(--line)] pt-5"><legend className="text-lg font-bold">Exhibitor spaces</legend><p className="text-sm text-[var(--muted)]">Offer bare space or plans with products and services. Inquiries do not reserve space or collect payment. Published events using this section need at least one complete offer.</p>
 {spaceOffers.map((offer,index)=><div className="grid gap-3 rounded-xl border border-[var(--line)] p-4 sm:grid-cols-2" key={offer.key}>
 <input type="hidden" name="offer_id" value={offer.id??''}/>
 <label className="label">Plan or space name<input className="input" name="offer_name" required maxLength={160} value={offer.name} onChange={e=>setSpaceOffers(rows=>rows.map(row=>row.key===offer.key?{...row,name:e.target.value}:row))}/></label>
 <label className="label">Pricing method<select className="input" name="offer_price_type" value={offer.price_type} onChange={e=>setSpaceOffers(rows=>rows.map(row=>row.key===offer.key?{...row,price_type:e.target.value as SpaceOffer['price_type'],price_inr:e.target.value==='quote'?'':row.price_inr}:row))}><option value="fixed">Fixed price</option><option value="per_sqft">Per square foot</option><option value="quote">Quote on request</option></select></label>
 {offer.price_type!=='quote'&&<label className="label">{offer.price_type==='fixed'?'Price (₹)':'Rate (₹ per sq ft)'}<input className="input" name="offer_price_inr" type="number" min={1} max={1000000000} step={1} required value={offer.price_inr} onChange={e=>setSpaceOffers(rows=>rows.map(row=>row.key===offer.key?{...row,price_inr:e.target.value}:row))}/></label>}
 {offer.price_type==='quote'&&<input type="hidden" name="offer_price_inr" value=""/>}
 <label className="label">Area (sq ft, optional)<input className="input" name="offer_area_sqft" type="number" min="0.01" max={1000000} step="0.01" value={offer.area_sqft} onChange={e=>setSpaceOffers(rows=>rows.map(row=>row.key===offer.key?{...row,area_sqft:e.target.value}:row))}/></label>
 <label className="label">Available units (optional)<input className="input" name="offer_unit_count" type="number" min={1} max={100000} step={1} value={offer.unit_count} onChange={e=>setSpaceOffers(rows=>rows.map(row=>row.key===offer.key?{...row,unit_count:e.target.value}:row))}/></label>
 <label className="label sm:col-span-2">Description<textarea className="input textarea" name="offer_description" maxLength={3000} value={offer.description} onChange={e=>setSpaceOffers(rows=>rows.map(row=>row.key===offer.key?{...row,description:e.target.value}:row))}/></label>
 <label className="label sm:col-span-2">Included products or services (optional)<textarea className="input textarea" name="offer_inclusions" maxLength={3000} value={offer.inclusions} onChange={e=>setSpaceOffers(rows=>rows.map(row=>row.key===offer.key?{...row,inclusions:e.target.value}:row))} placeholder="Leave blank for bare space"/></label>
 <button className="button button-secondary justify-self-start" type="button" onClick={()=>setSpaceOffers(rows=>rows.filter(row=>row.key!==offer.key))}>Remove offer {index+1}</button>
 </div>)}
 <button className="button button-secondary justify-self-start" type="button" onClick={()=>{setSpaceOffers(rows=>[...rows,{key:nextOfferKey,name:'',description:'',inclusions:'',area_sqft:'',unit_count:'',price_type:'quote',price_inr:''}]);setNextOfferKey(key=>key+1);}}>Add exhibitor offer</button>
 <div className="grid gap-4 sm:grid-cols-2">{(['pricing_chart','floor_layout'] as const).map(kind=><div key={kind}><label className="label">{kind==='pricing_chart'?'Pricing chart':'Floor layout'} (optional)<input className="input" name={kind} type="file" accept="application/pdf,image/png,image/jpeg,image/webp"/><span className="text-sm">PDF, PNG, JPEG, or WebP; up to 5 MB.</span></label>{event?.[kind==='pricing_chart'?'pricing_chart_path':'floor_layout_path']&&<div className="mt-2 text-sm"><a className="underline" href={`/api/events/${event.id}/attachments/${kind}`} target="_blank" rel="noopener noreferrer">View current file</a><label className="ml-3"><input type="checkbox" name={`remove_${kind}`} value="1"/> Remove</label></div>}</div>)}</div>
 </fieldset>}
 {enabledSections.includes('staffing')&&<fieldset className="grid gap-3 border-t border-[var(--line)] pt-5"><legend className="text-lg font-bold">Talent positions and openings (optional)</legend><p className="text-sm text-[var(--muted)]">Add positions only if you need event staff.</p>
 {needs.map((need,index)=><div className="grid gap-3 rounded-xl border border-[var(--line)] p-4 sm:grid-cols-[1fr_150px_auto] sm:items-end" key={need.key}>
 <label className="label">Position<input className="input" name="position_title" maxLength={160} value={need.title} onChange={e=>setNeeds(rows=>rows.map(row=>row.key===need.key?{...row,title:e.target.value}:row))} placeholder="e.g. Registration crew"/></label>
 <label className="label">People needed<input className="input" name="people_needed" type="number" min={1} max={100000} step={1} value={need.people_needed} onChange={e=>setNeeds(rows=>rows.map(row=>row.key===need.key?{...row,people_needed:e.target.value}:row))}/></label>
 <button className="button button-secondary" type="button" aria-label={`Remove position ${index+1}`} onClick={()=>setNeeds(rows=>rows.filter(row=>row.key!==need.key))}>Remove</button>
 </div>)}
 <button className="button button-secondary justify-self-start" type="button" onClick={()=>{setNeeds(rows=>[...rows,{key:nextKey,title:'',people_needed:''}]);setNextKey(key=>key+1);}}>Add position</button></fieldset>}
 <p className="text-sm text-[var(--muted)]">Description, venue, city, and dates are required to publish. Dates use India time. Save as draft to remove an event from public view.</p>
 <label className="label">Status<select className="input" name="status" defaultValue={event?.status??'draft'}><option value="draft">Draft — private</option><option value="submitted">Submitted for review</option><option value="published">Published — public</option><option value="cancelled">Cancelled</option></select></label>
 {state.error && <p className="alert" role="alert">{state.error}</p>}<SubmitButton pendingText="Saving event…" disabled={logoStatus==='compressing'||logoStatus==='error'}>Save event</SubmitButton>
 </form>;
}
