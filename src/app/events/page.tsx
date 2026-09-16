import Link from 'next/link';
import { TopNav } from '@/components/top-nav';
import { SiteFooter } from '@/components/site-footer';
import { createClient } from '@/lib/supabase/server';
import { eventTypeLabels, indiaToday, venueSettingLabels, type Company, type OrganizerEvent } from '@/lib/organizer';
import { EventStaffingNeeds } from '@/components/event-staffing-needs';
import { EventAmenities } from '@/components/event-amenities';
import { EmptyState } from '@/components/empty-state';
import { SearchX } from 'lucide-react';

export default async function EventsPage({searchParams}:{searchParams:Promise<{q?:string;city?:string}>}) {
 const params=await searchParams; const q=(params.q??'').trim().toLowerCase(); const city=(params.city??'').trim(); const db=await createClient();
 const [result,companiesResult,submittedResult]=db?await Promise.all([
  db.from('organizer_events').select('id,title,description,city,venue,starts_at,ends_at,company_id,status,published_at,staffing_needs,booking_url,event_type,venue_setting,requirement_sections,requirement_details,logo_path,amenities,custom_amenities').eq('status','published').gte('ends_at',indiaToday()).order('starts_at'),
  db.from('organizer_companies').select('id,name,city,description,website'),
  db.from('exhibitor_event_submissions').select('id,title,description,city,venue,starts_at,ends_at,amenities,custom_amenities').eq('status','approved').gte('ends_at',indiaToday()).order('starts_at'),
 ]):[null,null,null];
 const eventIds=(result?.data??[]).map(event=>event.id);
 const participantRows=db&&eventIds.length?await db.from('exhibitor_event_participation').select('event_id,exhibitor_id').eq('status','approved').in('event_id',eventIds):null;
 const participantIds=[...new Set((participantRows?.data??[]).map(row=>row.exhibitor_id))];
 const participantCompanies=db&&participantIds.length?await db.from('exhibitors').select('id,company_name').in('id',participantIds):null;
 const participantName=new Map((participantCompanies?.data??[]).map(item=>[item.id,item.company_name]));
 const participantsByEvent=new Map<string,string[]>();
 for(const row of participantRows?.data??[]){const name=participantName.get(row.exhibitor_id);if(name) participantsByEvent.set(row.event_id,[...(participantsByEvent.get(row.event_id)??[]),name]);}
 const namesFor=(eventId:string)=>(participantsByEvent.get(eventId)??[]).join(', ');
 const companies:Company[]=companiesResult?.data??[]; const events:OrganizerEvent[]=result?.data??[];
 const companyNames=new Map(companies.map(company=>[company.id,company.name]));
 const companyName=(id:string)=>companyNames.get(id)??'Event company';
 const filtered=events.filter(e=>(!city||e.city===city)&&(!q||`${e.title} ${companyName(e.company_id)}`.toLowerCase().includes(q)));
 const submitted=(submittedResult?.data??[]).filter(e=>(!city||e.city===city)&&(!q||`${e.title} exhibitor-submitted`.toLowerCase().includes(q)));
 const unavailable=!db||result?.error||companiesResult?.error||submittedResult?.error||participantRows?.error||participantCompanies?.error;
 return <div className="shell public-page"><TopNav/><main className="page py-12"><div className="public-page-intro"><span className="badge">Discover events</span><h1>Upcoming events</h1><p>Explore organizer and verified exhibitor-submitted events across India.</p></div>
 <form className="panel filter-panel mb-8 flex flex-wrap items-end gap-4 p-5"><label className="label flex-1">Search events or companies<input className="input" name="q" defaultValue={params.q} maxLength={160}/></label><label className="label">City<select className="input" name="city" defaultValue={city}><option value="">All cities</option>{[...new Set([...events.map(e=>e.city), ...(submittedResult?.data??[]).map(e=>e.city)])].sort().map(c=><option key={c}>{c}</option>)}</select></label><button className="button button-primary">Search</button><Link className="button button-secondary" href="/events">Clear</Link></form>
 {unavailable?<p role="alert" className="panel p-6">Events are temporarily unavailable. Please try again later.</p>:<div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filtered.map(e=><article className="panel event-card gap-3 p-6" key={e.id}><div className="flex flex-wrap gap-2"><span className="badge">{eventTypeLabels[e.event_type]}</span><span className="badge">{e.city}</span></div><h2 className="text-2xl font-bold"><Link href={`/events/${e.id}`}>{e.title}</Link></h2><p>{companyName(e.company_id)}</p><p className="text-sm">{venueSettingLabels[e.venue_setting]}</p>{namesFor(e.id)?<p className="text-sm">Exhibitors: {namesFor(e.id)}</p>:null}<p className="text-sm">{e.starts_at} – {e.ends_at}</p><p className="line-clamp-3 text-[var(--muted)]">{e.description}</p><EventAmenities amenities={e.amenities} compact customAmenities={e.custom_amenities}/>{e.staffing_needs?.length>0&&<EventStaffingNeeds needs={e.staffing_needs}/>}<Link className="button button-secondary" href={`/events/${e.id}`}>{e.booking_url?'View event & booking':'View event'}</Link></article>)}{submitted.map(e=><article className="panel event-card gap-3 p-6" key={e.id}><span className="badge self-start">{e.city}</span><h2 className="text-2xl font-bold"><Link href={`/events/exhibitor/${e.id}`}>{e.title}</Link></h2><p>Exhibitor-submitted · verified</p><p className="text-sm">{e.starts_at} – {e.ends_at}</p><p className="line-clamp-3 text-[var(--muted)]">{e.description}</p><EventAmenities amenities={e.amenities} compact customAmenities={e.custom_amenities}/><Link className="button button-secondary" href={`/events/exhibitor/${e.id}`}>View event</Link></article>)}</div>}
 {!unavailable&&!filtered.length&&!submitted.length&&<EmptyState icon={SearchX} title="No upcoming events match your search" description="Try clearing your search query or selecting a different city from the filter options above." action={<Link className="button button-secondary text-xs" href="/events">Clear search filters</Link>} className="mt-6" />}
 </main><SiteFooter/></div>;
}
