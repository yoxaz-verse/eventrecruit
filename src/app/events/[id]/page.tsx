import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TopNav } from '@/components/top-nav';
import { createClient } from '@/lib/supabase/server';
export default async function EventDetails({params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
 const db=await createClient(); if (!db) throw new Error('Events are temporarily unavailable.');
 const {data:event,error}=await db.from('organizer_events').select('*').eq('id',id).in('status',['published','cancelled']).not('published_at','is',null).maybeSingle();
 if(error) throw new Error('Unable to load event.'); if(!event) notFound();
 const {data:company,error:companyError}=await db.from('organizer_companies').select('id,name,description,city,website').eq('id',event.company_id).single();
 if(companyError) throw new Error('Unable to load company.');
 return <div className="shell"><TopNav/><main className="page py-12"><Link className="button button-secondary mb-6" href="/events">Back to events</Link>
 {event.status==='cancelled'&&<p role="status" className="panel mb-6 p-5 font-bold">This event has been cancelled.</p>}
 <div className="grid gap-6 lg:grid-cols-[2fr_1fr]"><article className="panel p-8"><span className="badge">{event.city}</span><h1 className="my-4 text-4xl font-black">{event.title}</h1><p className="font-bold">{event.starts_at} – {event.ends_at}</p><p className="mt-2">{event.venue}, {event.city}</p><p className="mt-8 whitespace-pre-wrap leading-8">{event.description}</p></article><aside className="panel h-fit p-6"><span className="badge">Organized by</span><h2 className="my-4 text-2xl font-bold">{company.name}</h2><p className="whitespace-pre-wrap">{company.description}</p><p className="my-4">{company.city}</p>{company.website&&/^https?:\/\//.test(company.website)&&<a className="button button-secondary" href={company.website} target="_blank" rel="noopener noreferrer">Company website</a>}</aside></div>
 </main></div>;
}
