'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { validDate } from '@/lib/organizer';
export type FormState = { error: string };
const value = (data: FormData, key: string) => String(data.get(key) ?? '').trim();
async function session() {
 const db = await createClient();
 if (!db) throw new Error('Service is not configured. Please try again later.');
 const { data: { user } } = await db.auth.getUser();
 if (!user) throw new Error('Please log in again.');
 const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
 if (profile?.role !== 'organizer' || !user.email_confirmed_at) throw new Error('A verified event organizer account is required.');
 return { db, user };
}
export async function saveCompany(_state: FormState, data: FormData): Promise<FormState> {
 try {
 const { db, user } = await session();
 const name = value(data,'name'), city = value(data,'city'), description = value(data,'description'), website = value(data,'website'), phone = value(data,'phone');
 if (name.length < 2 || name.length > 160 || !city || city.length > 120 || !description || description.length > 5000 || !phone || phone.length > 40) return {error:'Enter company name, city, description, and contact phone within the displayed limits.'};
 if (website) { try { const url = new URL(website); if (!['https:','http:'].includes(url.protocol)) throw new Error(); } catch { return {error:'Enter a valid http or https website URL.'}; } }
 const { error: contactError } = await db.from('contact_details').upsert({profile_id:user.id, phone});
 if (contactError) return {error:'Unable to save contact details. Please retry.'};
 const { error } = await db.from('organizer_companies').upsert({owner_id:user.id,name,city,description,website},{onConflict:'owner_id'});
 if (error) return {error:'Unable to save company details. Please retry.'};
 } catch (error) { return {error: error instanceof Error ? error.message : 'Unable to save. Please retry.'}; }
 revalidatePath('/dashboard/organizer'); revalidatePath('/events','layout');
 redirect('/dashboard/organizer?message=Company+saved');
}
export async function saveEvent(_state: FormState, data: FormData): Promise<FormState> {
 let eventId = '';
 try {
 const {db,user} = await session();
 const {data:company} = await db.from('organizer_companies').select('id').eq('owner_id',user.id).single();
 if (!company) return {error:'Complete your company setup first.'};
 const id = value(data,'id');
 if (id && !/^[0-9a-f-]{36}$/i.test(id)) return {error:'Invalid event.'};
 const status = value(data,'status');
 if (!['draft','published','cancelled'].includes(status)) return {error:'Choose a valid event status.'};
 const title=value(data,'title'), description=value(data,'description'), venue=value(data,'venue'), city=value(data,'city'), start=value(data,'starts_at'), end=value(data,'ends_at');
 if (!title || title.length>160 || description.length>10000 || venue.length>200 || city.length>120) return {error:'Enter a title and keep details within the displayed limits.'};
 if ((start && !validDate(start)) || (end && !validDate(end)) || (start && end && end<start)) return {error:'Enter valid dates with the end on or after the start.'};
 if (status==='published' && (!description || !venue || !city || !start || !end)) return {error:'Complete description, venue, city, and both dates before publishing.'};
 const payload={company_id:company.id,title,description,venue,city,starts_at:start||null,ends_at:end||null,status};
 const query = id ? db.from('organizer_events').update(payload).eq('id',id).eq('company_id',company.id) : db.from('organizer_events').insert(payload);
 const {data:saved,error}=await query.select('id').single();
 if (error || !saved) return {error:'Unable to save this event. Check access and try again.'};
 eventId=saved.id;
 } catch (error) { return {error:error instanceof Error ? error.message : 'Unable to save. Please retry.'}; }
 revalidatePath('/dashboard/organizer'); revalidatePath(`/dashboard/organizer/events/${eventId}`); revalidatePath('/events','layout');
 redirect('/dashboard/organizer?message=Event+saved');
}
