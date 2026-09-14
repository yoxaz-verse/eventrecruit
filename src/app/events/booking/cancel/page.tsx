import Link from 'next/link';
import { cancelGuestBooking } from '@/app/actions/booking';
import { TopNav } from '@/components/top-nav';
import { redirect } from 'next/navigation';
export default async function CancelBooking({searchParams}:{searchParams:Promise<{token?:string;result?:string}>}) {
 const {token,result}=await searchParams;
 return <div className="shell public-page"><TopNav/><main className="page py-12"><section className="panel max-w-xl p-8"><h1 className="text-3xl font-bold">Cancel booking</h1>{result?<p className="mt-4" role="status">{result==='success'?'Your booking has been cancelled.':'This booking was already cancelled or the link is invalid.'}</p>:token?<form action={async()=>{'use server'; const cancelled=await cancelGuestBooking(token); redirect(`/events/booking/cancel?result=${cancelled?'success':'unavailable'}`);}} className="mt-6"><button className="button button-primary">Confirm cancellation</button></form>:<p className="mt-4">This cancellation link is invalid.</p>}<Link className="button button-secondary mt-6" href="/events">Browse events</Link></section></main></div>;
}
