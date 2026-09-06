import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { organizerContext } from '@/lib/organizer-server';
import { eventPhase, type OrganizerEvent } from '@/lib/organizer';
export default async function OrganizerDashboard({searchParams}:{searchParams:Promise<{filter?:string;message?:string}>}) {
 const {filter,message}=await searchParams; const {db,company}=await organizerContext();
 const {data,error}=await db.from('organizer_events').select('*').eq('company_id',company!.id).order('starts_at',{ascending:true,nullsFirst:false});
 if (error) throw new Error('Unable to load events.');
 const events:OrganizerEvent[]=data??[]; const filters=['all','draft','upcoming','ongoing','past','cancelled']; const active=filters.includes(filter??'')?filter!:'all';
 return <DashboardShell active="organizer"><span className="badge">Event company portal</span><h1 className="mt-3 text-4xl font-black">{company!.name}</h1><p className="mt-3 text-[var(--muted)]">Manage your company’s events from one place.</p>
 <div className="my-6 flex flex-wrap gap-3"><Link className="button button-primary" href="/dashboard/organizer/events/new">Create event</Link><Link className="button button-secondary" href="/dashboard/organizer/company">Company details</Link><Link className="button button-secondary" href="/events">Public directory</Link></div>
 {message && <p role="status" className="mb-4">{message==='Company saved'?'Company saved.':message==='Event saved'?'Event saved.':''}</p>}
 <nav className="mb-6 flex flex-wrap gap-2" aria-label="Filter events">{filters.map(item=><Link key={item} aria-current={active===item?'page':undefined} className={`button ${active===item?'button-primary':'button-secondary'} capitalize`} href={`?filter=${item}`}>{item} ({item==='all'?events.length:events.filter(e=>eventPhase(e)===item).length})</Link>)}</nav>
 <div className="grid gap-4 lg:grid-cols-2">{events.filter(e=>active==='all'||eventPhase(e)===active).map(e=><article className="panel p-6" key={e.id}><span className="badge capitalize">{eventPhase(e)}</span><h2 className="my-3 text-2xl font-bold">{e.title}</h2><p>{e.city||'Location to be added'} · {e.starts_at||'Dates to be added'}{e.ends_at?` – ${e.ends_at}`:''}</p><Link className="button button-secondary mt-4" href={`/dashboard/organizer/events/${e.id}`}>Manage event</Link></article>)}</div>
 {!events.some(e=>active==='all'||eventPhase(e)===active)&&<p className="panel p-8">No {active==='all'?'':active} events yet. Create an event to get started.</p>}
 </DashboardShell>;
}
