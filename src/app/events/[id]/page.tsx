import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TopNav } from '@/components/top-nav';
import { createClient } from '@/lib/supabase/server';
import { EventStaffingNeeds } from '@/components/event-staffing-needs';
import { EventBookingForm } from '@/components/event-booking-form';
import { eventTypeLabels as controlledEventTypeLabels, indiaToday, requirementSectionLabels, venueSettingLabels as controlledVenueSettingLabels, type RequirementSection } from '@/lib/organizer';
import { getCurrentProfile } from '@/lib/auth';
import { SpaceInquiryForm } from '@/components/space-inquiry-form';
import { EventParticipants } from '@/components/event-participants';
import { EventAmenities } from '@/components/event-amenities';
import { ProgressiveImage } from '@/components/progressive-image';
import type { Metadata } from 'next';
import { getPublicEventMetadata } from '@/lib/public-data';

export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata> {
 const {id}=await params; const event=await getPublicEventMetadata('organizer',id);
 if(!event)return {title:'Event not found',robots:{index:false,follow:false}};
 const description=(event.description||`${event.title} in ${event.city}`).slice(0,160);
 return {title:event.title,description,alternates:{canonical:`/events/${id}`},openGraph:{title:event.title,description,type:'website',images:[{url:'/brand/expo-sphere-event-team.webp',width:1672,height:941,alt:'exporb event team'}]}};
}

export default async function EventDetails({params}:{params:Promise<{id:string}>}) {
 const eventTypeLabels:Record<string,string>=controlledEventTypeLabels;
 const venueSettingLabels:Record<string,string>=controlledVenueSettingLabels;
 const {id}=await params;
 if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
 const db=await createClient(); if (!db) throw new Error('Events are temporarily unavailable.');
 const {data:event,error}=await db.from('organizer_events').select('*').eq('id',id).in('status',['published','cancelled']).not('published_at','is',null).maybeSingle();
 if(error) throw new Error('Unable to load event.'); if(!event) notFound();
 const [companyResult,slotsResult,offersResult,profile]=await Promise.all([
  db.from('organizer_companies').select('id,name,description,city,website').eq('id',event.company_id).single(),
  db.from('event_booking_slots').select('id,slot_date,start_time,end_time,capacity,booked_count').eq('event_id',id).eq('is_active',true).order('slot_date').order('start_time'),
  db.from('event_space_offers').select('id,name,description,inclusions,area_sqft,unit_count,price_type,price_inr').eq('event_id',id).eq('is_active',true).order('position'),
  getCurrentProfile(),
 ]);
 const {data:company,error:companyError}=companyResult;
 if(companyError) throw new Error('Unable to load company.');
 const {data:slots,error:slotsError}=slotsResult;
 if (slotsError) throw new Error('Unable to load event booking slots.');
 const {data:offers,error:offersError}=offersResult;
 if(offersError) throw new Error('Unable to load exhibitor offers.');
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
 const part=(type:string)=>parts.find(item=>item.type===type)?.value??'';
 const indiaNow=`${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
 const available=(slots??[]).filter(slot=>`${slot.slot_date}T${slot.start_time.slice(0,5)}`>indiaNow);
	 const jsonLd={"@context":"https://schema.org","@type":"Event",name:event.title,description:event.description,startDate:event.starts_at,endDate:event.ends_at,eventStatus:event.status==='cancelled'?'https://schema.org/EventCancelled':'https://schema.org/EventScheduled',location:{"@type":"Place",name:event.venue,address:{"@type":"PostalAddress",addressLocality:event.city,addressCountry:'IN'}},organizer:{"@type":"Organization",name:company.name,url:company.website||undefined}};
	 return <div className="shell public-page"><TopNav/><main className="page py-12"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,'\\u003c')}}/><Link className="button button-secondary mb-6" href="/events">Back to events</Link>
	 {event.logo_path?<ProgressiveImage src={`/api/media/event/${id}`} alt={`${event.title} logo`} width={112} height={112} loading="lazy" decoding="async" className="h-28 w-28 rounded-2xl border border-[var(--line)] object-cover" containerClassName="mb-6 h-28 w-28"/>:null}
 {event.status==='cancelled'&&<p role="status" className="panel mb-6 p-5 font-bold">This event has been cancelled.</p>}
 <div className="grid gap-6 lg:grid-cols-[2fr_1fr]"><article className="panel p-8"><div className="flex flex-wrap gap-2"><span className="badge">{eventTypeLabels[event.event_type]}</span><span className="badge">{event.city}</span></div><h1 className="my-4 text-4xl font-black">{event.title}</h1><p className="font-bold">{event.starts_at} – {event.ends_at}</p><p className="mt-2">{event.venue}, {event.city} · {venueSettingLabels[event.venue_setting]}</p><p className="mt-8 whitespace-pre-wrap leading-8">{event.description}</p><EventAmenities amenities={event.amenities} customAmenities={event.custom_amenities}/>{event.requirement_sections?.some((section:RequirementSection)=>event.requirement_details?.[section])&&<section className="mt-8 border-t border-[var(--line)] pt-6"><h2 className="mb-4 text-2xl font-bold">Event requirements</h2>{event.requirement_sections.map((section:RequirementSection)=>event.requirement_details?.[section]?<div className="mb-4" key={section}><h3 className="font-bold">{requirementSectionLabels[section]}</h3><p className="whitespace-pre-wrap">{event.requirement_details[section]}</p></div>:null)}</section>}{event.status==='published'&&(offers?.length||event.floor_layout_path||event.pricing_chart_path)&&<section className="mt-8 border-t border-[var(--line)] pt-6"><h2 className="mb-2 text-2xl font-bold">Exhibitor spaces and pricing</h2><p className="mb-5 text-sm text-[var(--muted)]">Ask about a plan or bare space. An inquiry is not a reservation or payment.</p>{event.floor_layout_path&&<div className="mb-6 rounded-xl border border-[var(--line)] p-4"><h3 className="mb-2 text-lg font-bold">Event floor layout</h3><object className="mb-3 h-80 w-full rounded-lg border border-[var(--line)]" data={`/api/events/${id}/attachments/floor_layout`} aria-label="Event floor layout"><a className="underline" href={`/api/events/${id}/attachments/floor_layout`} target="_blank" rel="noopener noreferrer">Open floor layout</a></object><a className="button button-secondary" href={`/api/events/${id}/attachments/floor_layout`} target="_blank" rel="noopener noreferrer">Open full layout</a></div>}{event.pricing_chart_path&&<a className="button button-secondary mb-5" href={`/api/events/${id}/attachments/pricing_chart`} target="_blank" rel="noopener noreferrer">View pricing chart</a>}{offers?.map(offer=><div className="mb-4 rounded-xl border border-[var(--line)] p-5" key={offer.id}><h3 className="text-xl font-bold">{offer.name}</h3><p className="mt-2 whitespace-pre-wrap">{offer.description}</p>{offer.inclusions&&<p className="mt-2 whitespace-pre-wrap"><strong>Included:</strong> {offer.inclusions}</p>}<p className="mt-3 font-bold">{offer.price_type==='quote'?'Price on request':`${new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(offer.price_inr)}${offer.price_type==='per_sqft'?' / sq ft':''}`}</p>{offer.area_sqft&&<p className="text-sm">Area: {offer.area_sqft} sq ft{offer.price_type==='per_sqft'&&offer.price_inr?` · Estimated ${new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(offer.area_sqft*offer.price_inr)}`:''}</p>}{offer.unit_count&&<p className="text-sm">Listed units: {offer.unit_count} (confirm availability with organizer)</p>}{event.ends_at>=indiaToday()&&(profile?.role==='exhibitor'?<SpaceInquiryForm eventId={id} offerId={offer.id}/>:<p className="mt-4 text-sm"><Link className="underline" href="/login">Sign in as an exhibitor</Link> to send an inquiry.</p>)}</div>)}</section>}{event.status==='published'&&event.ends_at>=indiaToday()&&(event.booking_url||available.length>0)&&<section className="mt-8 border-t border-[var(--line)] pt-6"><h2 className="mb-4 text-2xl font-bold">Book your place</h2>{event.booking_url&&<a className="button button-primary mb-4" href={event.booking_url} target="_blank" rel="noopener noreferrer">Book now</a>}{available.map(slot=><div className="mb-4 rounded-xl border border-[var(--line)] p-4" key={slot.id}><p className="font-bold">{slot.slot_date} · {slot.start_time.slice(0,5)}–{slot.end_time.slice(0,5)} India time</p><p className="text-sm">{Math.max(0,slot.capacity-slot.booked_count)} places left</p>{slot.booked_count<slot.capacity&&<EventBookingForm slotId={slot.id}/>}</div>)}</section>}{event.staffing_needs?.length>0&&<section className="mt-8 border-t border-[var(--line)] pt-6"><h2 className="mb-4 text-2xl font-bold">Talent positions needed</h2><EventStaffingNeeds needs={event.staffing_needs}/></section>}</article><aside className="panel h-fit p-6"><span className="badge">Organized by</span><h2 className="my-4 text-2xl font-bold">{company.name}</h2><p className="whitespace-pre-wrap">{company.description}</p><p className="my-4">{company.city}</p>{company.website&&/^https?:\/\//.test(company.website)&&<a className="button button-secondary" href={company.website} target="_blank" rel="noopener noreferrer">Company website</a>}</aside></div>
 <EventParticipants eventId={id}/></main></div>;
}
