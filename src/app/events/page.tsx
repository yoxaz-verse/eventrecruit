import { Suspense } from 'react';
import { TopNav } from '@/components/top-nav';
import { SiteFooter } from '@/components/site-footer';
import { PublicEventDirectory } from '@/components/public-event-directory';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { getPublicEventCities, getPublicEventDirectory } from '@/lib/public-data';
import type { Metadata } from 'next';

export const metadata:Metadata={title:'Upcoming events',description:'Explore upcoming exhibitions, activations, and staffing opportunities across India.',alternates:{canonical:'/events'}};

export default async function EventsPage() {
 const [directory,cities]=await Promise.all([getPublicEventDirectory(),getPublicEventCities()]);
 return <div className="shell public-page"><TopNav/><main className="page py-12"><div className="public-page-intro public-page-intro-split"><div><span className="badge">Discover events</span><h1>Where opportunity meets the show floor.</h1><p>Explore organizer events and Expoline Approved exhibitor events across India.</p></div><div className="public-intro-stat" aria-label={`${directory.data.length} upcoming events`}><strong>{directory.data.length}</strong><span>upcoming events</span></div></div>
 <Suspense fallback={<LoadingSkeleton label="Loading event filters"/>}><PublicEventDirectory events={directory.data} cities={cities} available={directory.available}/></Suspense>
 </main><SiteFooter/></div>;
}
