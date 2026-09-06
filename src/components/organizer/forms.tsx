'use client';
import { useActionState } from 'react';
import { saveCompany, saveEvent } from '@/app/actions/organizer';
import type { Company, OrganizerEvent } from '@/lib/organizer';
export function CompanyForm({company}:{company?:Company}) {
 const [state,action,pending]=useActionState(saveCompany,{error:''});
 return <form action={action} className="panel grid gap-4 p-6">
 <label className="label">Company name<input className="input" name="name" required minLength={2} maxLength={160} defaultValue={company?.name}/></label>
 <label className="label">City<input className="input" name="city" required maxLength={120} defaultValue={company?.city}/></label>
 <label className="label">About the company<textarea className="input textarea" name="description" required maxLength={5000} defaultValue={company?.description}/></label>
 <label className="label">Website (optional)<input className="input" name="website" type="url" defaultValue={company?.website}/></label>
 <label className="label">Private contact phone<input className="input" name="phone" type="tel" required maxLength={40} autoComplete="tel"/><span className="text-sm">Only platform administrators can read your saved contact phone. Re-enter it when updating your company.</span></label>
 {state.error && <p role="alert">{state.error}</p>}<button className="button button-primary" disabled={pending}>{pending?'Saving…':'Save company'}</button>
 </form>;
}
export function EventForm({event}:{event?:OrganizerEvent}) {
 const [state,action,pending]=useActionState(saveEvent,{error:''});
 return <form action={action} className="panel grid gap-4 p-6">
 <input type="hidden" name="id" value={event?.id ?? ''}/>
 <label className="label">Event title<input className="input" name="title" required maxLength={160} defaultValue={event?.title}/></label>
 <label className="label">Description<textarea className="input textarea" name="description" maxLength={10000} defaultValue={event?.description}/></label>
 <div className="grid gap-4 sm:grid-cols-2"><label className="label">Venue<input className="input" name="venue" maxLength={200} defaultValue={event?.venue}/></label><label className="label">City<input className="input" name="city" maxLength={120} defaultValue={event?.city}/></label></div>
 <div className="grid gap-4 sm:grid-cols-2"><label className="label">Start date<input className="input" name="starts_at" type="date" defaultValue={event?.starts_at??''}/></label><label className="label">End date<input className="input" name="ends_at" type="date" defaultValue={event?.ends_at??''}/></label></div>
 <p className="text-sm text-[var(--muted)]">All details are required to publish. Dates use India time. Save as draft to remove an event from public view.</p>
 <label className="label">Status<select className="input" name="status" defaultValue={event?.status??'draft'}><option value="draft">Draft — private</option><option value="published">Published — public</option><option value="cancelled">Cancelled</option></select></label>
 {state.error && <p role="alert">{state.error}</p>}<button className="button button-primary" disabled={pending}>{pending?'Saving…':'Save event'}</button>
 </form>;
}
