'use client';
import { useActionState, useState } from 'react';
import { saveCompany, saveEvent } from '@/app/actions/organizer';
import type { BookingSlot, Company, OrganizerEvent } from '@/lib/organizer';
import { SubmitButton } from '@/components/submit-button';
export function CompanyForm({company}:{company?:Company}) {
 const [state,action]=useActionState(saveCompany,{error:''});
 return <form action={action} className="panel grid gap-4 p-6">
 <label className="label">Company name<input className="input" name="name" required minLength={2} maxLength={160} defaultValue={company?.name}/></label>
 <label className="label">City<input className="input" name="city" required maxLength={120} defaultValue={company?.city}/></label>
 <label className="label">About the company<textarea className="input textarea" name="description" required maxLength={5000} defaultValue={company?.description}/></label>
 <label className="label">Website (optional)<input className="input" name="website" type="url" defaultValue={company?.website}/></label>
 <label className="label">Private contact phone<input className="input" name="phone" type="tel" required maxLength={40} autoComplete="tel"/><span className="text-sm">Only platform administrators can read your saved contact phone. Re-enter it when updating your company.</span></label>
 {state.error && <p className="alert" role="alert">{state.error}</p>}<SubmitButton pendingText="Saving company…">Save company</SubmitButton>
 </form>;
}
export function EventForm({event,slots=[]}:{event?:OrganizerEvent;slots?:BookingSlot[]}) {
 const [state,action]=useActionState(saveEvent,{error:''});
 const [needs,setNeeds]=useState((event?.staffing_needs?.length ? event.staffing_needs : [{title:'',people_needed:null}]).map((need,index)=>({key:index,title:need.title,people_needed:need.people_needed?.toString()??''})));
 const [nextKey,setNextKey]=useState(needs.length);
 const [bookingSlots,setBookingSlots]=useState(slots.map((slot,index)=>({...slot,key:index})));
 const [nextSlotKey,setNextSlotKey]=useState(slots.length);
 return <form action={action} className="panel grid gap-4 p-6">
 <input type="hidden" name="id" value={event?.id ?? ''}/>
 <label className="label">Event title<input className="input" name="title" required maxLength={160} defaultValue={event?.title}/></label>
 <label className="label">Description<textarea className="input textarea" name="description" maxLength={10000} defaultValue={event?.description}/></label>
 <div className="grid gap-4 sm:grid-cols-2"><label className="label">Venue<input className="input" name="venue" maxLength={200} defaultValue={event?.venue}/></label><label className="label">City<input className="input" name="city" maxLength={120} defaultValue={event?.city}/></label></div>
 <div className="grid gap-4 sm:grid-cols-2"><label className="label">Start date<input className="input" name="starts_at" type="date" defaultValue={event?.starts_at??''}/></label><label className="label">End date<input className="input" name="ends_at" type="date" defaultValue={event?.ends_at??''}/></label></div>
 <fieldset className="grid gap-3 border-t border-[var(--line)] pt-5"><legend className="text-lg font-bold">Attendee booking</legend><p className="text-sm text-[var(--muted)]">Add an external booking page, in-app time slots, or both. Times use India time.</p>
 <label className="label">External booking link (optional)<input className="input" name="booking_url" type="url" placeholder="https://example.com/book" defaultValue={event?.booking_url??''}/></label>
 {bookingSlots.map((slot,index)=><div className="grid gap-3 rounded-xl border border-[var(--line)] p-4 sm:grid-cols-2" key={slot.key}>
 <input type="hidden" name="slot_id" value={slot.id??''}/>
 <label className="label">Date<input className="input" name="slot_date" type="date" required value={slot.slot_date} onChange={e=>setBookingSlots(rows=>rows.map(row=>row.key===slot.key?{...row,slot_date:e.target.value}:row))}/></label>
 <label className="label">Capacity<input className="input" name="slot_capacity" type="number" min={1} max={100000} required value={slot.capacity} onChange={e=>setBookingSlots(rows=>rows.map(row=>row.key===slot.key?{...row,capacity:Number(e.target.value)}:row))}/></label>
 <label className="label">Start time<input className="input" name="slot_start" type="time" required value={slot.start_time.slice(0,5)} onChange={e=>setBookingSlots(rows=>rows.map(row=>row.key===slot.key?{...row,start_time:e.target.value}:row))}/></label>
 <label className="label">End time<input className="input" name="slot_end" type="time" required value={slot.end_time.slice(0,5)} onChange={e=>setBookingSlots(rows=>rows.map(row=>row.key===slot.key?{...row,end_time:e.target.value}:row))}/></label>
 <button className="button button-secondary justify-self-start" type="button" onClick={()=>setBookingSlots(rows=>rows.filter(row=>row.key!==slot.key))}>Remove slot {index+1}</button>
 </div>)}
 <button className="button button-secondary justify-self-start" type="button" onClick={()=>{setBookingSlots(rows=>[...rows,{key:nextSlotKey,slot_date:'',start_time:'',end_time:'',capacity:1}]);setNextSlotKey(key=>key+1);}}>Add slot</button></fieldset>
 <fieldset className="grid gap-3 border-t border-[var(--line)] pt-5"><legend className="text-lg font-bold">Talent positions and openings (optional)</legend><p className="text-sm text-[var(--muted)]">Add positions only if you need event staff.</p>
 {needs.map((need,index)=><div className="grid gap-3 rounded-xl border border-[var(--line)] p-4 sm:grid-cols-[1fr_150px_auto] sm:items-end" key={need.key}>
 <label className="label">Position<input className="input" name="position_title" maxLength={160} value={need.title} onChange={e=>setNeeds(rows=>rows.map(row=>row.key===need.key?{...row,title:e.target.value}:row))} placeholder="e.g. Registration crew"/></label>
 <label className="label">People needed<input className="input" name="people_needed" type="number" min={1} max={100000} step={1} value={need.people_needed} onChange={e=>setNeeds(rows=>rows.map(row=>row.key===need.key?{...row,people_needed:e.target.value}:row))}/></label>
 <button className="button button-secondary" type="button" aria-label={`Remove position ${index+1}`} onClick={()=>setNeeds(rows=>rows.filter(row=>row.key!==need.key))}>Remove</button>
 </div>)}
 <button className="button button-secondary justify-self-start" type="button" onClick={()=>{setNeeds(rows=>[...rows,{key:nextKey,title:'',people_needed:''}]);setNextKey(key=>key+1);}}>Add position</button></fieldset>
 <p className="text-sm text-[var(--muted)]">Description, venue, city, and dates are required to publish. Dates use India time. Save as draft to remove an event from public view.</p>
 <label className="label">Status<select className="input" name="status" defaultValue={event?.status??'draft'}><option value="draft">Draft — private</option><option value="published">Published — public</option><option value="cancelled">Cancelled</option></select></label>
 {state.error && <p className="alert" role="alert">{state.error}</p>}<SubmitButton pendingText="Saving event…">Save event</SubmitButton>
 </form>;
}
