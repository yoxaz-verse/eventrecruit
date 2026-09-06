import Link from 'next/link';
import { TopNav } from '@/components/top-nav';
import { createClient } from '@/lib/supabase/server';
import { indiaToday, type Company, type OrganizerEvent } from '@/lib/organizer';
export default async function EventsPage({searchParams}:{searchParams:Promise<{q?:string;city?:string}>}) {
 const params=await searchParams; const q=(params.q??'').trim().toLowerCase(); const city=(params.city??'').trim(); const db=await createClient();
 const result=db?await db.from('organizer_events').select('id,title,description,city,venue,starts_at,ends_at,company_id,status,published_at').eq('status','published').gte('ends_at',indiaToday()).order('starts_at'):null;
 const companiesResult=db?await db.from('organizer_companies').select('id,name,city,description,website'):null;
 const companies:Company[]=companiesResult?.data??[]; const events:OrganizerEvent[]=result?.data??[];
 const companyName=(id:string)=>companies.find(c=>c.id===id)?.name??'Event company';
 const filtered=events.filter(e=>(!city||e.city===city)&&(!q||`${e.title} ${companyName(e.company_id)}`.toLowerCase().includes(q)));
 const unavailable=!db||result?.error||companiesResult?.error;
 return <div className="shell"><TopNav/><main className="page py-12"><span className="badge">Discover events</span><h1 className="mt-4 text-4xl font-black">Upcoming events</h1><p className="mt-3 mb-8 text-[var(--muted)]">Explore what event companies are organizing across India.</p>
 <form className="panel mb-8 flex flex-wrap items-end gap-4 p-5"><label className="label flex-1">Search events or companies<input className="input" name="q" defaultValue={params.q} maxLength={160}/></label><label className="label">City<select className="input" name="city" defaultValue={city}><option value="">All cities</option>{[...new Set(events.map(e=>e.city))].sort().map(c=><option key={c}>{c}</option>)}</select></label><button className="button button-primary">Search</button><Link className="button button-secondary" href="/events">Clear</Link></form>
 {unavailable?<p role="alert" className="panel p-6">Events are temporarily unavailable. Please try again later.</p>:<div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filtered.map(e=><article className="panel p-6" key={e.id}><span className="badge">{e.city}</span><h2 className="my-3 text-2xl font-bold"><Link href={`/events/${e.id}`}>{e.title}</Link></h2><p>{companyName(e.company_id)}</p><p className="my-3 text-sm">{e.starts_at} – {e.ends_at}</p><p className="mb-4 line-clamp-3 text-[var(--muted)]">{e.description}</p><Link className="button button-secondary" href={`/events/${e.id}`}>View event</Link></article>)}</div>}
 {!unavailable&&!filtered.length&&<p className="panel p-8">No upcoming events match your search.</p>}
 </main></div>;
}
