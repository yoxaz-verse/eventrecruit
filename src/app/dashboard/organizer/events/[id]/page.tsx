import { notFound } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard-shell';
import { EventForm } from '@/components/organizer/forms';
import { organizerContext } from '@/lib/organizer-server';
export default async function EditEvent({params}:{params:Promise<{id:string}>}) {
 const {id}=await params; const {db,company}=await organizerContext();
 const {data:event,error}=await db.from('organizer_events').select('*').eq('id',id).eq('company_id',company!.id).maybeSingle();
 if (error) throw new Error('Unable to load event.'); if (!event) notFound();
 return <DashboardShell active="organizer"><div className="max-w-3xl"><h1 className="mb-6 text-4xl font-black">Edit event</h1><EventForm event={event}/></div></DashboardShell>;
}
