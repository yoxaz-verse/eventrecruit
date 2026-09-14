import { notFound } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard-shell';
import { EventForm } from '@/components/organizer/forms';
import { organizerContext } from '@/lib/organizer-server';
export default async function EditEvent({params}:{params:Promise<{id:string}>}) {
 const {id}=await params; const {db,company}=await organizerContext();
 const {data:event,error}=await db.from('organizer_events').select('*').eq('id',id).eq('company_id',company!.id).maybeSingle();
 if (error) throw new Error('Unable to load event.'); if (!event) notFound();
 const {data:slots,error:slotsError}=await db.from('event_booking_slots').select('*').eq('event_id',id).order('slot_date').order('start_time');
 if (slotsError) throw new Error('Unable to load booking slots. Apply the booking migration.');
 const slotIds=(slots??[]).map(slot=>slot.id);
 const {data:bookings,error:bookingsError}=slotIds.length?await db.from('event_bookings').select('id,slot_id,guest_name,guest_email,cancelled_at,created_at').in('slot_id',slotIds).order('created_at',{ascending:false}):{data:[],error:null};
 if (bookingsError) throw new Error('Unable to load reservations.');
 return <DashboardShell active="organizer"><div className="max-w-3xl"><h1 className="mb-6 text-4xl font-black">Edit event</h1><EventForm event={event} slots={(slots??[]).filter(slot=>slot.is_active)}/><section className="panel mt-6 p-6"><h2 className="text-2xl font-bold">Reservations</h2>{slots?.length?slots.map(slot=><div key={slot.id} className="border-t border-[var(--line)] py-4"><h3 className="font-bold">{slot.slot_date} · {slot.start_time.slice(0,5)}–{slot.end_time.slice(0,5)} · {slot.booked_count}/{slot.capacity} booked{!slot.is_active?' · Closed':''}</h3>{bookings?.filter(booking=>booking.slot_id===slot.id && !booking.cancelled_at).map(booking=><p className="mt-2 text-sm" key={booking.id}>{booking.guest_name} · {booking.guest_email} <form action={async()=>{'use server'; const {cancelOrganizerBooking}=await import('@/app/actions/booking'); await cancelOrganizerBooking(id,booking.id);}} className="inline"><button className="underline" type="submit">Cancel</button></form></p>)}</div>):<p className="mt-3 text-[var(--muted)]">No time slots yet.</p>}</section></div></DashboardShell>;
}
