'use client';
import { useActionState } from 'react';
import { submitSpaceInquiry } from '@/app/actions/space-inquiries';
import { SubmitButton } from '@/components/submit-button';
export function SpaceInquiryForm({eventId,offerId}:{eventId:string;offerId:string}) {
 const [state,action]=useActionState(submitSpaceInquiry,{error:'',success:''});
 return <form action={action} className="mt-4 grid gap-3 border-t border-[var(--line)] pt-4"><input type="hidden" name="event_id" value={eventId}/><input type="hidden" name="offer_id" value={offerId}/><div className="grid gap-3 sm:grid-cols-2"><label className="label">Requested area (sq ft, optional)<input className="input" name="requested_area_sqft" type="number" min="0.01" max={1000000} step="0.01"/></label><label className="label">Units (optional)<input className="input" name="requested_units" type="number" min={1} max={100000} step={1}/></label></div><label className="label">Your requirements<textarea className="input textarea" name="message" required maxLength={3000}/></label><SubmitButton pendingText="Sending…">Send inquiry</SubmitButton>{state.error&&<p className="alert" role="alert">{state.error}</p>}{state.success&&<p role="status">{state.success}</p>}</form>;
}
