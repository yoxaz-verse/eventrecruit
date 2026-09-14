import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TopNav } from '@/components/top-nav';
import { createClient } from '@/lib/supabase/server';
import { EventStaffingNeeds } from '@/components/event-staffing-needs';
import { EventBookingForm } from '@/components/event-booking-form';
import { indiaToday } from '@/lib/organizer';
export default async function EventDetails({params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
 const db=await createClient(); if (!db) throw new Error('Events are temporarily unavailable.');
 const {data:event,error}=await db.from('organizer_events').select('*').eq('id',id).in('status',['published','cancelled']).not('published_at','is',null).maybeSingle();
 if(error) throw new Error('Unable to load event.'); if(!event) notFound();
 const {data:company,error:companyError}=await db.from('organizer_companies').select('id,name,description,city,website').eq('id',event.company_id).single();
 if(companyError) throw new Error('Unable to load company.');
 const {data:slots,error:slotsError}=await db.from('event_booking_slots').select('id,slot_date,start_time,end_time,capacity,booked_count').eq('event_id',id).eq('is_active',true).order('slot_date').order('start_time');
 if (slotsError) throw new Error('Unable to load event booking slots.');
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
 const part=(type:string)=>parts.find(item=>item.type===type)?.value??'';
 const indiaNow=`${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
 const available=(slots??[]).filter(slot=>`${slot.slot_date}T${slot.start_time.slice(0,5)}`>indiaNow);
 return <div className="shell public-page"><TopNav/><main className="page py-12"><Link className="button button-secondary mb-6" href="/events">Back to events</Link>
 {event.status==='cancelled'&&<p role="status" className="panel mb-6 p-5 font-bold">This event has been cancelled.</p>}
 <div className="grid gap-6 lg:grid-cols-[2fr_1fr]"><article className="panel p-8"><span className="badge">{event.city}</span><h1 className="my-4 text-4xl font-black">{event.title}</h1><p className="font-bold">{event.starts_at} – {event.ends_at}</p><p className="mt-2">{event.venue}, {event.city}</p><p className="mt-8 whitespace-pre-wrap leading-8">{event.description}</p>{event.status==='published'&&event.ends_at>=indiaToday()&&(event.booking_url||available.length>0)&&<section className="mt-8 border-t border-[var(--line)] pt-6"><h2 className="mb-4 text-2xl font-bold">Book your place</h2>{event.booking_url&&<a className="button button-primary mb-4" href={event.booking_url} target="_blank" rel="noopener noreferrer">Book now</a>}{available.map(slot=><div className="mb-4 rounded-xl border border-[var(--line)] p-4" key={slot.id}><p className="font-bold">{slot.slot_date} · {slot.start_time.slice(0,5)}–{slot.end_time.slice(0,5)} India time</p><p className="text-sm">{Math.max(0,slot.capacity-slot.booked_count)} places left</p>{slot.booked_count<slot.capacity&&<EventBookingForm slotId={slot.id}/>}</div>)}</section>}{event.staffing_needs?.length>0&&<section className="mt-8 border-t border-[var(--line)] pt-6"><h2 className="mb-4 text-2xl font-bold">Talent positions needed</h2><EventStaffingNeeds needs={event.staffing_needs}/></section>}</article><aside className="panel h-fit p-6"><span className="badge">Organized by</span><h2 className="my-4 text-2xl font-bold">{company.name}</h2><p className="whitespace-pre-wrap">{company.description}</p><p className="my-4">{company.city}</p>{company.website&&/^https?:\/\//.test(company.website)&&<a className="button button-secondary" href={company.website} target="_blank" rel="noopener noreferrer">Company website</a>}</aside></div>
 </main></div>;
}
