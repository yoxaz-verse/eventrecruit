import Link from 'next/link';
import { TopNav } from '@/components/top-nav';
import { SiteFooter } from '@/components/site-footer';
import { eventTypeLabels, venueSettingLabels } from '@/lib/organizer';
import { EventStaffingNeeds } from '@/components/event-staffing-needs';
import { EventAmenities } from '@/components/event-amenities';
import { EmptyState } from '@/components/empty-state';
import { SearchX } from 'lucide-react';
import { getPublicEventDirectory } from '@/lib/public-data';
import type { Metadata } from 'next';

export const metadata:Metadata={title:'Upcoming events',description:'Explore upcoming exhibitions, activations, and staffing opportunities across India.',alternates:{canonical:'/events'}};

export default async function EventsPage({searchParams}:{searchParams:Promise<{q?:string;city?:string}>}) {
 const params=await searchParams; const q=(params.q??'').trim(); const city=(params.city??'').trim();
 const [directory,allEvents]=await Promise.all([getPublicEventDirectory({q,city}),getPublicEventDirectory()]);
 const rankedEvents=directory.data;
 const unavailable=!directory.available;
 const cities=[...new Set(allEvents.data.map(item=>item.event.city))].sort();
 return <div className="shell public-page"><TopNav/><main className="page py-12"><div className="public-page-intro"><span className="badge">Discover events</span><h1>Upcoming events</h1><p>Explore organizer events and Exporb Approved exhibitor events across India.</p></div>
 <form className="panel filter-panel mb-8 flex flex-wrap items-end gap-4 p-5"><label className="label flex-1">Search events or companies<input className="input" name="q" defaultValue={params.q} maxLength={160}/></label><label className="label">City<select className="input" name="city" defaultValue={city}><option value="">All cities</option>{cities.map(c=><option key={c}>{c}</option>)}</select></label><button className="button button-primary">Search</button><Link className="button button-secondary" href="/events">Clear</Link></form>
 {unavailable?<p role="alert" className="panel p-6">Events are temporarily unavailable. Please try again later.</p>:<div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{rankedEvents.map(item=>{if(item.source==='exhibitor'){const e=item.event;return <article className="panel event-card gap-3 p-6" key={`exhibitor-${e.id}`}><div className="flex flex-wrap gap-2"><span className="badge">Exporb Approved</span><span className="badge">{e.city}</span></div><h2 className="text-2xl font-bold"><Link href={`/events/exhibitor/${e.id}`}>{e.title}</Link></h2><p className="text-sm">{e.starts_at} – {e.ends_at}</p><p className="line-clamp-3 text-[var(--muted)]">{e.description}</p><EventAmenities amenities={e.amenities} compact customAmenities={e.custom_amenities}/><Link className="button button-secondary" href={`/events/exhibitor/${e.id}`}>View event</Link></article>}const e=item.event;const participants=item.participants.join(', ');return <article className="panel event-card gap-3 p-6" key={`organizer-${e.id}`}><div className="flex flex-wrap gap-2"><span className="badge">{eventTypeLabels[e.event_type]}</span><span className="badge">{e.city}</span></div><h2 className="text-2xl font-bold"><Link href={`/events/${e.id}`}>{e.title}</Link></h2><p>{item.companyName}</p><p className="text-sm">{venueSettingLabels[e.venue_setting]}</p>{participants?<p className="text-sm">Exhibitors: {participants}</p>:null}<p className="text-sm">{e.starts_at} – {e.ends_at}</p><p className="line-clamp-3 text-[var(--muted)]">{e.description}</p><EventAmenities amenities={e.amenities} compact customAmenities={e.custom_amenities}/>{e.staffing_needs?.length>0&&<EventStaffingNeeds needs={e.staffing_needs}/>}<Link className="button button-secondary" href={`/events/${e.id}`}>{e.booking_url?'View event & booking':'View event'}</Link></article>})}</div>}
 {!unavailable&&!rankedEvents.length&&<EmptyState icon={SearchX} title="No upcoming events match your search" description="Try clearing your search query or selecting a different city from the filter options above." action={<Link className="button button-secondary text-xs" href="/events">Clear search filters</Link>} className="mt-6" />}
 </main><SiteFooter/></div>;
}
