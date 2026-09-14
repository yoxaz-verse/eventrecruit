'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAccount } from '@/lib/auth';
import { generateToken, tokenHash } from '@/lib/app-auth/crypto';
import { sendBookingEmail } from '@/lib/email/send-booking-email';

export type BookingState={error:string;success:string;token?:string;bookingId?:string};
export async function reserveSlot(_state:BookingState,data:FormData):Promise<BookingState> {
 const slotId=String(data.get('slot_id')??''), name=String(data.get('name')??'').trim(), email=String(data.get('email')??'').trim();
 if (!/^[0-9a-f-]{36}$/i.test(slotId) || !name || name.length>160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254) return {error:'Enter your name and a valid email address.',success:''};
 const db=await createClient(); if (!db) return {error:'Bookings are temporarily unavailable.',success:''};
 const token=generateToken();
 const {data:bookingId,error}=await db.rpc('reserve_event_slot',{p_slot_id:slotId,p_name:name,p_email:email,p_token_hash:tokenHash(token)});
 if (error || !bookingId) return {error:error?.message?.includes('Already booked')?'This email already has a booking for this slot.':error?.message?.includes('Slot full')?'This slot is full.':'This slot is no longer available.',success:''};
 const {data:slot}=await db.from('event_booking_slots').select('slot_date,start_time,end_time,event_id').eq('id',slotId).single();
 const {data:event}=slot?await db.from('organizer_events').select('title').eq('id',slot.event_id).single():{data:null};
 let sent=false;
 if (slot && event) try {await sendBookingEmail(email,{eventTitle:event.title,date:slot.slot_date,start:slot.start_time.slice(0,5),end:slot.end_time.slice(0,5),token});sent=true;} catch { /* booking remains confirmed */ }
 if (sent) await db.from('event_bookings').update({email_sent_at:new Date().toISOString()}).eq('id',bookingId);
 revalidatePath('/events','layout');
 return {error:'',success:sent?'Booking confirmed. Details and a cancellation link have been emailed to you.':'Booking confirmed, but the email could not be sent. Save your cancellation link below or retry the email.',token,bookingId};
}
export async function retryBookingEmail(_state:BookingState,data:FormData):Promise<BookingState> {
 const token=String(data.get('token')??''), bookingId=String(data.get('booking_id')??'');
 if (!token || !bookingId) return {error:'Invalid booking.',success:''};
 const db=await createClient(); if (!db) return {error:'Email unavailable.',success:'',token,bookingId};
 const {data:booking}=await db.from('event_bookings').select('id,slot_id,guest_email,cancelled_at').eq('id',bookingId).eq('cancel_token_hash',tokenHash(token)).maybeSingle();
 if (!booking || booking.cancelled_at) return {error:'Booking unavailable.',success:''};
 const {data:slot}=await db.from('event_booking_slots').select('slot_date,start_time,end_time,event_id').eq('id',booking.slot_id).single();
 const {data:event}=slot?await db.from('organizer_events').select('title').eq('id',slot.event_id).single():{data:null};
 if (!slot || !event) return {error:'Booking unavailable.',success:''};
 try {await sendBookingEmail(booking.guest_email,{eventTitle:event.title,date:slot.slot_date,start:slot.start_time.slice(0,5),end:slot.end_time.slice(0,5),token});} catch {return {error:'Email could not be sent. Try again later.',success:'',token,bookingId};}
 await db.from('event_bookings').update({email_sent_at:new Date().toISOString()}).eq('id',bookingId);
 return {error:'',success:'Confirmation email sent.',token,bookingId};
}
export async function cancelGuestBooking(token:string) {
 if (!/^[A-Za-z0-9_-]{30,100}$/.test(token)) return false;
 const db=await createClient(); if (!db) return false;
 const {data,error}=await db.rpc('cancel_event_booking',{p_token_hash:tokenHash(token)});
 if (!error && data) revalidatePath('/events','layout');
 return !error && data===true;
}
export async function cancelOrganizerBooking(eventId:string,bookingId:string) {
 const db=await createClient(), user=await getCurrentAccount(); if (!db || !user) throw new Error('Please log in.');
 const {data:event}=await db.from('organizer_events').select('id,company_id,organizer_companies!inner(owner_id)').eq('id',eventId).maybeSingle();
 const company=event?.organizer_companies as unknown as {owner_id:string}|null;
 if (!event || company?.owner_id!==user.id) throw new Error('Event unavailable.');
 const {data:booking}=await db.from('event_bookings').select('slot_id,cancel_token_hash,event_booking_slots!inner(event_id)').eq('id',bookingId).maybeSingle();
 const slot=booking?.event_booking_slots as unknown as {event_id:string}|null;
 if (!booking || slot?.event_id!==eventId) throw new Error('Booking unavailable.');
 const {error}=await db.rpc('cancel_event_booking',{p_token_hash:booking.cancel_token_hash});
 if (error) throw new Error('Unable to cancel booking.');
 revalidatePath(`/dashboard/organizer/events/${eventId}`); revalidatePath('/events','layout');
}
