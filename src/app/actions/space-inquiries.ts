'use server';
import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { canManageExhibitor } from '@/lib/agency-workspace';

export type InquiryState={error:string;success:string};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function submitSpaceInquiry(_state:InquiryState,data:FormData):Promise<InquiryState> {
 const profile=await getCurrentProfile();
 if(!profile||!['exhibitor','agency'].includes(profile.role)) return {error:'Sign in with an exhibitor or agency account to inquire.',success:''};
 const db=await createClient(); if(!db) return {error:'Inquiries are temporarily unavailable.',success:''};
 const offerId=String(data.get('offer_id')??''), eventId=String(data.get('event_id')??''), message=String(data.get('message')??'').trim();
 const areaText=String(data.get('requested_area_sqft')??'').trim(), unitsText=String(data.get('requested_units')??'').trim();
 const area=areaText?Number(areaText):null, units=unitsText?Number(unitsText):null;
 if(!uuid.test(offerId)||!uuid.test(eventId)||!message||message.length>3000||area!==null&&(!Number.isFinite(area)||area<=0||area>1000000)||units!==null&&(!Number.isInteger(units)||units<=0||units>100000)) return {error:'Enter a message and valid requested area or unit count.',success:''};
 const {data:offer}=await db.from('event_space_offers').select('id,event_id,is_active').eq('id',offerId).eq('event_id',eventId).eq('is_active',true).maybeSingle();
 const {data:event}=await db.from('organizer_events').select('id,status,ends_at').eq('id',eventId).maybeSingle();
 if(!offer||event?.status!=='published'||!event.ends_at||event.ends_at<new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())) return {error:'This offer is no longer available for inquiry.',success:''};
 const {data:owned}=await db.from('exhibitors').select('id').eq('owner_id',profile.id).maybeSingle();
 const exhibitorId=profile.role==='agency'?String(data.get('exhibitor_id')??''):owned?.id??'';
 if(!uuid.test(exhibitorId)||!await canManageExhibitor(db,profile.id,exhibitorId)) return {error:'Choose an exhibitor you are authorized to represent.',success:''};
 const {error}=await db.from('event_space_inquiries').insert({event_id:eventId,offer_id:offerId,exhibitor_id:exhibitorId,actor_id:profile.id,requested_area_sqft:area,requested_units:units,message});
 if(error) return {error:'Unable to send inquiry. Please retry.',success:''};
 revalidatePath(`/dashboard/organizer/events/${eventId}`); revalidatePath('/dashboard/exhibitor/space-inquiries'); revalidatePath('/dashboard/agency/space-inquiries');
 return {error:'',success:'Inquiry sent. The organizer can review it in their dashboard. This is not a reservation or payment.'};
}
export async function updateSpaceInquiryStatus(data:FormData) {
 const profile=await getCurrentProfile(); if(profile?.role!=='organizer') throw new Error('Organizer access required.');
 const db=await createClient(); if(!db) throw new Error('Service unavailable.');
 const id=String(data.get('inquiry_id')??''), eventId=String(data.get('event_id')??''), status=String(data.get('status')??'');
 if(!uuid.test(id)||!uuid.test(eventId)||!['new','contacted','accepted','declined'].includes(status)) throw new Error('Invalid inquiry update.');
 const {data:event}=await db.from('organizer_events').select('company_id').eq('id',eventId).maybeSingle();
 const {data:company}=event?await db.from('organizer_companies').select('owner_id').eq('id',event.company_id).maybeSingle():{data:null};
 if(company?.owner_id!==profile.id) throw new Error('Event unavailable.');
 const {data:updated,error}=await db.from('event_space_inquiries').update({status,updated_at:new Date().toISOString()}).eq('id',id).eq('event_id',eventId).select('id').maybeSingle();
 if(error||!updated) throw new Error('Unable to update inquiry.');
 revalidatePath(`/dashboard/organizer/events/${eventId}`); revalidatePath('/dashboard/exhibitor/space-inquiries');
}
