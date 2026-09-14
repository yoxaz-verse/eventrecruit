import Link from 'next/link';
import { TopNav } from '@/components/top-nav';
import { SiteFooter } from '@/components/site-footer';
import { createClient } from '@/lib/supabase/server';
import { indiaToday, type Company, type OrganizerEvent } from '@/lib/organizer';
import { EventStaffingNeeds } from '@/components/event-staffing-needs';
export default async function EventsPage({searchParams}:{searchParams:Promise<{q?:string;city?:string}>}) {
 const params=await searchParams; const q=(params.q??'').trim().toLowerCase(); const city=(params.city??'').trim(); const db=await createClient();
 const result=db?await db.from('organizer_events').select('id,title,description,city,venue,starts_at,ends_at,company_id,status,published_at,staffing_needs,booking_url').eq('status','published').gte('ends_at',indiaToday()).order('starts_at'):null;
 const companiesResult=db?await db.from('organizer_companies').select('id,name,city,description,website'):null;
 const submittedResult=db?await db.from('exhibitor_event_submissions').select('id,title,description,city,venue,starts_at,ends_at').eq('status','approved').gte('ends_at',indiaToday()).order('starts_at'):null;
 const participantRows=db?await db.from('exhibitor_event_participation').select('event_id,exhibitor_id').eq('status','approved'):null;
 const participantIds=[...new Set((participantRows?.data??[]).map(row=>row.exhibitor_id))];
 const participantCompanies=db&&participantIds.length?await db.from('exhibitors').select('id,company_name').in('id',participantIds):null;
 const participantName=new Map((participantCompanies?.data??[]).map(item=>[item.id,item.company_name]));
 const namesFor=(eventId:string)=>(participantRows?.data??[]).filter(row=>row.event_id===eventId).map(row=>participantName.get(row.exhibitor_id)).filter(Boolean).join(', ');
 const companies:Company[]=companiesResult?.data??[]; const events:OrganizerEvent[]=result?.data??[];
 const companyName=(id:string)=>companies.find(c=>c.id===id)?.name??'Event company';
 const filtered=events.filter(e=>(!city||e.city===city)&&(!q||`${e.title} ${companyName(e.company_id)}`.toLowerCase().includes(q)));
 const submitted=(submittedResult?.data??[]).filter(e=>(!city||e.city===city)&&(!q||`${e.title} exhibitor-submitted`.toLowerCase().includes(q)));
 const unavailable=!db||result?.error||companiesResult?.error||submittedResult?.error||participantRows?.error||participantCompanies?.error;
 return <div className="shell public-page"><TopNav/><main className="page py-12"><div className="public-page-intro"><span className="badge">Discover events</span><h1>Upcoming events</h1><p>Explore organizer and verified exhibitor-submitted events across India.</p></div>
 <form className="panel filter-panel mb-8 flex flex-wrap items-end gap-4 p-5"><label className="label flex-1">Search events or companies<input className="input" name="q" defaultValue={params.q} maxLength={160}/></label><label className="label">City<select className="input" name="city" defaultValue={city}><option value="">All cities</option>{[...new Set([...events.map(e=>e.city), ...(submittedResult?.data??[]).map(e=>e.city)])].sort().map(c=><option key={c}>{c}</option>)}</select></label><button className="button button-primary">Search</button><Link className="button button-secondary" href="/events">Clear</Link></form>
 {unavailable?<p role="alert" className="panel p-6">Events are temporarily unavailable. Please try again later.</p>:<div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filtered.map(e=><article className="panel event-card gap-3 p-6" key={e.id}><span className="badge self-start">{e.city}</span><h2 className="text-2xl font-bold"><Link href={`/events/${e.id}`}>{e.title}</Link></h2><p>{companyName(e.company_id)}</p>{namesFor(e.id)?<p className="text-sm">Exhibitors: {namesFor(e.id)}</p>:null}<p className="text-sm">{e.starts_at} – {e.ends_at}</p><p className="line-clamp-3 text-[var(--muted)]">{e.description}</p>{e.staffing_needs?.length>0&&<EventStaffingNeeds needs={e.staffing_needs}/>}<Link className="button button-secondary" href={`/events/${e.id}`}>{e.booking_url?'View event & booking':'View event'}</Link></article>)}{submitted.map(e=><article className="panel event-card gap-3 p-6" key={e.id}><span className="badge self-start">{e.city}</span><h2 className="text-2xl font-bold"><Link href={`/events/exhibitor/${e.id}`}>{e.title}</Link></h2><p>Exhibitor-submitted · verified</p><p className="text-sm">{e.starts_at} – {e.ends_at}</p><p className="line-clamp-3 text-[var(--muted)]">{e.description}</p><Link className="button button-secondary" href={`/events/exhibitor/${e.id}`}>View event</Link></article>)}</div>}
 {!unavailable&&!filtered.length&&!submitted.length&&<p className="panel p-8">No upcoming events match your search.</p>}
 </main><SiteFooter/></div>;
}
