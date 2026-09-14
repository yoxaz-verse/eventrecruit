'use client';
import { useActionState } from 'react';
import { reserveSlot, retryBookingEmail, type BookingState } from '@/app/actions/booking';
import { SubmitButton } from '@/components/submit-button';
const initial:BookingState={error:'',success:''};
export function EventBookingForm({slotId}:{slotId:string}) {
 const [state,action]=useActionState(reserveSlot,initial);
 return <div className="mt-3"><form action={action} className="grid gap-3"><input type="hidden" name="slot_id" value={slotId}/><label className="label">Your name<input className="input" name="name" maxLength={160} required/></label><label className="label">Email for confirmation<input className="input" name="email" type="email" maxLength={254} required/></label><SubmitButton pendingText="Booking…">Reserve slot</SubmitButton></form>{state.error&&<p className="alert mt-3" role="alert">{state.error}</p>}{state.success&&<div className="mt-3" role="status"><p>{state.success}</p>{state.token&&<a className="underline" href={`/events/booking/cancel?token=${encodeURIComponent(state.token)}`}>Your cancellation link</a>}{state.token&&state.bookingId&&!state.success.includes('emailed')&&<RetryEmail token={state.token} bookingId={state.bookingId}/>}</div>}</div>;
}
function RetryEmail({token,bookingId}:{token:string;bookingId:string}) {
 const [state,action]=useActionState(retryBookingEmail,initial);
 return <form action={action} className="mt-3"><input type="hidden" name="token" value={token}/><input type="hidden" name="booking_id" value={bookingId}/><SubmitButton pendingText="Sending…">Retry confirmation email</SubmitButton>{state.error&&<p role="alert">{state.error}</p>}{state.success&&<p role="status">{state.success}</p>}</form>;
}
