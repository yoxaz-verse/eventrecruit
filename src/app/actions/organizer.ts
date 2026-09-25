'use server';
import { revalidatePath } from 'next/cache';
import { invalidatePublicData, PUBLIC_CACHE_TAGS } from '@/lib/public-data';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAccount } from '@/lib/auth';
import { normalizeCustomAmenities, requirementSections, validBookingSlot, validDate, validEventAmenities, validEventClassification, validRequirementSections, validSpaceAttachment, validSpaceOffer, validStaffingNeeds, type BookingSlot, type RequirementSection, type SpaceOffer, type StaffingNeed } from '@/lib/organizer';
import { parseLockedLocation } from '@/lib/location';
import { resolveActiveLocations } from '@/lib/locations';
import { validBrandImageSignature } from '@/lib/image-upload';
import { deleteR2Object, putR2Object } from '@/lib/r2';
export type FormState = { error: string };
const value = (data: FormData, key: string) => String(data.get(key) ?? '').trim();
async function session() {
 const db = await createClient();
 if (!db) throw new Error('Service is not configured. Please try again later.');
 const user = await getCurrentAccount();
 if (!user) throw new Error('Please log in again.');
 const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
 if (profile?.role !== 'organizer' || !user.email_verified_at) throw new Error('A verified event organizer account is required.');
 return { db, user };
}
export async function saveCompany(_state: FormState, data: FormData): Promise<FormState> {
 try {
 const { db, user } = await session();
 const id=value(data,'id'),name = value(data,'name'), city = value(data,'city'), description = value(data,'description'), website = value(data,'website'), phone = value(data,'phone');
 if (name.length < 2 || name.length > 160 || !city || city.length > 120 || !description || description.length > 5000 || !phone || phone.length > 40) return {error:'Enter company name, city, description, and contact phone within the displayed limits.'};
 if (website) { try { const url = new URL(website); if (!['https:','http:'].includes(url.protocol)) throw new Error(); } catch { return {error:'Enter a valid http or https website URL.'}; } }
 const { error: contactError } = await db.from('contact_details').upsert({profile_id:user.id, phone});
 if (contactError) return {error:'Unable to save contact details. Please retry.'};
 let companyId=id;
 if(id){const {data:membership}=await db.from('organizer_company_memberships').select('permission').eq('company_id',id).eq('profile_id',user.id).maybeSingle();if(!membership)return {error:'You cannot edit this company.'};const {error}=await db.from('organizer_companies').update({name,city,description,website,public_phone:phone}).eq('id',id);if(error)return {error:'Unable to save company details. Please retry.'};}
 else {const {data:created,error}=await db.from('organizer_companies').insert({owner_id:user.id,name,city,description,website,public_phone:phone}).select('id').single();if(error||!created)return {error:'Unable to create company. Please retry.'};companyId=created.id;const member=await db.from('organizer_company_memberships').insert({company_id:companyId,profile_id:user.id,permission:'owner'});if(member.error)return {error:'Company created, but access could not be assigned.'};}
 const {data:pendingVerification}=await db.from('verification_requests').select('id').eq('entity_type','company').eq('entity_id',companyId).eq('status','pending').maybeSingle();
 if(!pendingVerification)await db.from('verification_requests').insert({entity_type:'company',entity_id:companyId,requester_id:user.id,status:'pending',notes:'Organizer company verification'});
 const {error:completionError}=await db.from('profiles').update({onboarding_completed_at:new Date().toISOString()}).eq('id',user.id);
 if (completionError) return {error:'Company saved, but setup could not be completed. Please retry.'};
 } catch (error) { return {error: error instanceof Error ? error.message : 'Unable to save. Please retry.'}; }
 revalidatePath('/dashboard/organizer'); revalidatePath('/events','layout'); invalidatePublicData(PUBLIC_CACHE_TAGS.events);
 redirect('/dashboard/organizer?message=Company+saved');
}
export async function saveEvent(_state: FormState, data: FormData): Promise<FormState> {
 let eventId = '';
 try {
 const {db,user} = await session();
 const companyId=value(data,'company_id');
 const {data:membership}=await db.from('organizer_company_memberships').select('company_id').eq('company_id',companyId).eq('profile_id',user.id).maybeSingle();
 const company=membership?{id:companyId}:null;
 if (!company) return {error:'Complete your company setup first.'};
 const id = value(data,'id');
 if (id && !/^[0-9a-f-]{36}$/i.test(id)) return {error:'Invalid event.'};
 const status = value(data,'status');
 if (!['draft','submitted','published','cancelled'].includes(status)) return {error:'Choose a valid event status.'};
 const {data:existingEvent}=id?await db.from('organizer_events').select('status').eq('id',id).eq('company_id',company.id).maybeSingle():{data:null};
 if(id&&!existingEvent) return {error:'Event unavailable.'};
 const eventType=value(data,'event_type'), venueSetting=value(data,'venue_setting');
 if(!validEventClassification(eventType,venueSetting)) return {error:'Choose a valid event type and venue setting.'};
 const sections=data.getAll('requirement_sections').map(String);
 if(!validRequirementSections(sections)) return {error:'Choose valid requirement sections.'};
 let rawDetails:unknown;
 try { rawDetails=JSON.parse(value(data,'requirement_details')||'{}'); } catch { return {error:'Check the requirement notes and retry.'}; }
 if(!rawDetails||Array.isArray(rawDetails)||typeof rawDetails!=='object') return {error:'Check the requirement notes and retry.'};
 const requirementDetails:Partial<Record<RequirementSection,string>>={};
 for(const [key,detail] of Object.entries(rawDetails)) {
   if(!requirementSections.includes(key as RequirementSection)||typeof detail!=='string'||detail.length>3000) return {error:'Requirement notes must use the available sections and stay within 3,000 characters.'};
   if(detail.trim()) requirementDetails[key as RequirementSection]=detail.trim();
 }
 const title=value(data,'title'), description=value(data,'description'), venue=value(data,'venue'), city=value(data,'city'), start=value(data,'starts_at'), end=value(data,'ends_at');
 const locationId=value(data,'location_id');
 const catalogLocations=locationId?await resolveActiveLocations([locationId]):[];
 if(locationId&&!catalogLocations) return {error:'Choose an active location.'};
 const location=parseLockedLocation(data);
 const locationRequired=status==='published'||existingEvent?.status==='published';
 if(locationRequired&&!location.valid) return {error:'Choose and lock an Indian venue location before publishing.'};
 if(location.locked&&!location.valid) return {error:'The locked venue location is invalid. Unlock it and choose the location again.'};
 const bookingUrl=value(data,'booking_url'),mapUrl=value(data,'map_url');
 const amenities=data.getAll('amenities').map(String), rawCustomAmenities=data.getAll('custom_amenities').map(String), customAmenities=normalizeCustomAmenities(rawCustomAmenities);
 if(!validEventAmenities(amenities,rawCustomAmenities)) return {error:'Choose valid amenities and add no more than 10 unique custom amenities.'};
 if (bookingUrl) { try { if (new URL(bookingUrl).protocol !== 'https:') return {error:'Booking link must use HTTPS.'}; } catch { return {error:'Enter a valid booking URL.'}; } }
 if (mapUrl) { try { if (new URL(mapUrl).protocol !== 'https:') return {error:'Map link must use HTTPS.'}; } catch { return {error:'Enter a valid map URL.'}; } }
 const slotIds=data.getAll('slot_id').map(String), slotDates=data.getAll('slot_date').map(String), slotStarts=data.getAll('slot_start').map(String), slotEnds=data.getAll('slot_end').map(String), slotCapacities=data.getAll('slot_capacity').map(String);
 if ([slotDates,slotStarts,slotEnds,slotCapacities].some(items=>items.length!==slotIds.length) || slotIds.length>100) return {error:'Add no more than 100 complete slots.'};
 const slots:BookingSlot[]=slotIds.map((slotId,index)=>({id:slotId||undefined,slot_date:slotDates[index],start_time:slotStarts[index],end_time:slotEnds[index],capacity:Number(slotCapacities[index])}));
 if (slots.some(slot=>!validBookingSlot(slot,start,end))) return {error:'Slots need a valid date within the event, start and end times, and a capacity from 1 to 100,000.'};
 if (new Set(slots.map(slot=>`${slot.slot_date}/${slot.start_time}/${slot.end_time}`)).size!==slots.length) return {error:'Duplicate time slots are not allowed.'};
 const offerKeys=['offer_id','offer_name','offer_description','offer_inclusions','offer_area_sqft','offer_unit_count','offer_price_type','offer_price_inr'] as const;
 const offerFields=offerKeys.map(key=>data.getAll(key).map(item=>String(item).trim()));
 if (offerFields.some(field=>field.length!==offerFields[0].length) || offerFields[0].length>30) return {error:'Add no more than 30 complete exhibitor offers.'};
 const offers:SpaceOffer[]=offerFields[0].map((offerId,index)=>({id:offerId||undefined,name:offerFields[1][index],description:offerFields[2][index],inclusions:offerFields[3][index],area_sqft:offerFields[4][index]?Number(offerFields[4][index]):null,unit_count:offerFields[5][index]?Number(offerFields[5][index]):null,price_type:offerFields[6][index] as SpaceOffer['price_type'],price_inr:offerFields[7][index]?Number(offerFields[7][index]):null}));
 if (offers.some(offer=>!validSpaceOffer(offer))) return {error:'Complete each exhibitor offer with a valid price, area, and unit count.'};
 const uploads=(['pricing_chart','floor_layout'] as const).map(kind=>({kind,file:data.get(kind)}));
 for (const upload of uploads) if (upload.file instanceof File && upload.file.size>0 && (!validSpaceAttachment(upload.file) || !await hasValidSignature(upload.file))) return {error:'Upload PDF, PNG, JPEG, or WebP files up to 5 MB.'};
 if (uploads.some(upload=>data.get(`remove_${upload.kind}`)==='1' && upload.file instanceof File && upload.file.size>0)) return {error:'Choose either a replacement file or remove the current file.'};
 const logo=data.get('logo');
 if (logo instanceof File && logo.size>0 && !await validBrandImageSignature(logo)) return {error:'Upload a browser-compressed WebP event logo no larger than 500 KB.'};
 if (data.get('remove_logo')==='1' && logo instanceof File && logo.size>0) return {error:'Choose either a replacement logo or remove the current logo.'};
 const titles=data.getAll('position_title').map(item=>String(item).trim());
 const counts=data.getAll('people_needed').map(item=>String(item).trim());
 if (titles.length!==counts.length || titles.length>30) return {error:'Add no more than 30 talent positions.'};
 const staffingNeeds:StaffingNeed[]=titles.map((position,index)=>({title:position,people_needed:counts[index] && /^[1-9][0-9]*$/.test(counts[index]) && Number(counts[index])<=100000 ? Number(counts[index]) : null}));
 if (titles.some((position,index)=>position.length>160 || (counts[index]!=='' && staffingNeeds[index].people_needed===null))) return {error:'Enter a valid position and a whole number of people from 1 to 100,000.'};
 if (!title || title.length>160 || description.length>10000 || city.length>120) return {error:'Enter a title and keep details within the displayed limits.'};
 if (!venue || venue.length>200) return {error:'Enter a venue name within 200 characters.'};
 if ((start && !validDate(start)) || (end && !validDate(end)) || (start && end && end<start)) return {error:'Enter valid dates with the end on or after the start.'};
 if (status==='published' && (!description || !venue || !city || !start || !end)) return {error:'Complete description, venue, city, and both dates before publishing.'};
 const completeNeeds=staffingNeeds.filter(need=>need.title || need.people_needed);
 if (completeNeeds.length && !validStaffingNeeds(completeNeeds)) return {error:'Complete or remove each talent position.'};
 if (id) {
   const {data:existing,error:slotError}=await db.from('event_booking_slots').select('id,booked_count,capacity,slot_date,start_time,end_time').eq('event_id',id);
   if (slotError) return {error:'Unable to check existing reservations.'};
   const requestedIds=new Set(slots.map(slot=>slot.id).filter(Boolean));
   if (slots.some(slot=>slot.id && !existing?.some(old=>old.id===slot.id))) return {error:'Invalid slot.'};
   if (existing?.some(old=>old.booked_count>0 && (slots.some(slot=>slot.id===old.id && (slot.slot_date!==old.slot_date || slot.start_time!==old.start_time.slice(0,5) || slot.end_time!==old.end_time.slice(0,5) || slot.capacity<old.booked_count)) || (requestedIds.has(old.id) && (old.slot_date<start || old.slot_date>end))))) return {error:'Booked slots cannot be rescheduled or moved outside event dates, and capacity cannot fall below reservations.'};
 }
 const payload={title,description,venue,city,location_id:locationId||null,latitude:location.valid?location.latitude:null,longitude:location.valid?location.longitude:null,location_label:location.valid?location.locationLabel:null,location_country_code:location.valid?location.countryCode:null,map_url:mapUrl||null,starts_at:start||null,ends_at:end||null,status,staffing_needs:completeNeeds,booking_url:bookingUrl,event_type:eventType,venue_setting:venueSetting,requirement_sections:sections,requirement_details:requirementDetails,amenities,custom_amenities:customAmenities};
 const {data:savedId,error}=await db.rpc('save_organizer_event_with_spaces',{p_event_id:id||null,p_company_id:company.id,p_event:payload,p_slots:slots,p_offers:offers.map((offer,position)=>({...offer,position}))});
 if (error || !savedId) return {error:error?.message?.includes('Published exhibitor spaces')?'Add at least one complete exhibitor offer or turn off the exhibitor / stall spaces section before publishing.':'Unable to save event, slots, and offers. Check for conflicting reservations and retry.'};
 eventId=savedId;
 const {error:locationError}=await db.from('organizer_events').update({location_id:locationId||null,map_url:mapUrl||null}).eq('id',eventId).eq('company_id',company.id);
 if(locationError) return {error:'Event saved, but its city could not be linked. Please retry.'};
 if ((logo instanceof File && logo.size>0) || data.get('remove_logo')==='1') {
   const {data:current}=await db.from('organizer_events').select('logo_path').eq('id',eventId).eq('company_id',company.id).single();
   if (!current) return {error:'Event saved, but logo ownership could not be verified.'};
   let logoPath:string|null=null;
   if (logo instanceof File && logo.size>0) {
     logoPath=`events/${eventId}/${crypto.randomUUID()}.webp`;
     await putR2Object(logoPath,logo);
   }
   const {error:logoError}=await db.from('organizer_events').update({logo_path:logoPath}).eq('id',eventId).eq('company_id',company.id);
   if (logoError) { await deleteR2Object(logoPath); return {error:'Event saved, but its logo could not be linked. Reopen the event and retry.'}; }
   await deleteR2Object(current.logo_path);
 }
 for (const {kind,file} of uploads) {
   const column=kind==='pricing_chart'?'pricing_chart_path':'floor_layout_path';
   if (!(file instanceof File && file.size>0) && data.get(`remove_${kind}`)!=='1') continue;
   const {data:current}=await db.from('organizer_events').select('pricing_chart_path,floor_layout_path').eq('id',eventId).eq('company_id',company.id).single();
   if (!current) return {error:'Event saved, but attachment ownership could not be verified.'};
   let path:string|null=null;
   if (file instanceof File && file.size>0) {
     path=`${company.id}/${eventId}/${kind}/${crypto.randomUUID()}`;
     const bytes=await file.arrayBuffer();
     const {error:uploadError}=await db.storage.from('event-space-assets').upload(path,bytes,{contentType:file.type,upsert:false});
     if (uploadError) return {error:'Event saved, but an attachment could not be uploaded. Reopen the event and retry.'};
   }
   const {error:updateError}=await db.from('organizer_events').update({[column]:path}).eq('id',eventId).eq('company_id',company.id);
   if (updateError) { if (path) await db.storage.from('event-space-assets').remove([path]); return {error:'Event saved, but an attachment could not be linked. Reopen the event and retry.'}; }
   const oldPath=current[column];
   if (oldPath) await db.storage.from('event-space-assets').remove([oldPath]);
 }
 } catch (error) { return {error:error instanceof Error ? error.message : 'Unable to save. Please retry.'}; }
 invalidatePublicData(PUBLIC_CACHE_TAGS.events); revalidatePath('/dashboard/organizer'); revalidatePath(`/dashboard/organizer/events/${eventId}`); revalidatePath('/events','layout'); revalidatePath('/');
 redirect('/dashboard/organizer?message=Event+saved');
}
async function hasValidSignature(file:File) {
 const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
 const starts=(signature:number[])=>signature.every((byte,index)=>bytes[index]===byte);
 if(file.type==='application/pdf') return starts([37,80,68,70,45]);
 if(file.type==='image/png') return starts([137,80,78,71,13,10,26,10]);
 if(file.type==='image/jpeg') return starts([255,216,255]);
 if(file.type==='image/webp') return starts([82,73,70,70]) && [87,69,66,80].every((byte,index)=>bytes[index+8]===byte);
 return false;
}
