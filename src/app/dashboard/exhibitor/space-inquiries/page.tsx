import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function SpaceInquiriesPage() {
 const profile=await requireRole(['exhibitor']);
 const db=await createClient(); if(!db) throw new Error('Inquiries are temporarily unavailable.');
 const {data:exhibitor}=await db.from('exhibitors').select('id').eq('owner_id',profile.id).maybeSingle();
 const {data:inquiries,error}=exhibitor?await db.from('event_space_inquiries').select('id,event_id,offer_id,requested_area_sqft,requested_units,message,status,created_at').eq('exhibitor_id',exhibitor.id).order('created_at',{ascending:false}):{data:[],error:null};
 if(error) throw new Error('Unable to load space inquiries.');
 const eventIds=[...new Set((inquiries??[]).map(inquiry=>inquiry.event_id))], offerIds=[...new Set((inquiries??[]).map(inquiry=>inquiry.offer_id))];
 const {data:events}=eventIds.length?await db.from('organizer_events').select('id,title').in('id',eventIds):{data:[]};
 const {data:offers}=offerIds.length?await db.from('event_space_offers').select('id,name').in('id',offerIds):{data:[]};
 return <DashboardShell active="exhibitor" current="/dashboard/exhibitor/space-inquiries"><div className="max-w-3xl"><h1 className="text-4xl font-black">Space inquiries</h1><p className="mt-3 text-[var(--muted)]">Track your inquiries. Accepted means the organizer has responded positively; it is not a reservation or payment.</p><Link className="button button-primary my-6" href="/events">Browse events</Link><div className="grid gap-4">{inquiries?.map(inquiry=><article className="panel p-5" key={inquiry.id}><span className="badge capitalize">{inquiry.status}</span><h2 className="mt-3 text-xl font-bold">{events?.find(event=>event.id===inquiry.event_id)?.title??'Event'} · {offers?.find(offer=>offer.id===inquiry.offer_id)?.name??'Space offer'}</h2><p className="mt-2 text-sm">{inquiry.requested_area_sqft?`${inquiry.requested_area_sqft} sq ft · `:''}{inquiry.requested_units?`${inquiry.requested_units} units`:''}</p><p className="mt-3 whitespace-pre-wrap">{inquiry.message}</p><p className="mt-3 text-xs text-[var(--muted)]">Sent {new Date(inquiry.created_at).toLocaleString('en-IN')}</p></article>)}{!inquiries?.length&&<p className="panel p-5">No space inquiries yet.</p>}</div></div></DashboardShell>;
}
