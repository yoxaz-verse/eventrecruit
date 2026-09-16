"use client";

import { useActionState } from "react";
import { createExternalClient, invitePlatformExhibitor } from "@/app/actions/agency-clients";
import { SubmitButton } from "@/components/submit-button";

const initial = { error: "", success: "" };

export function InviteExhibitorForm() {
  const [state, action] = useActionState(invitePlatformExhibitor, initial);
  return <form action={action} className="panel grid gap-4 p-5"><h2 className="text-xl font-black">Invite a platform exhibitor</h2><p className="text-sm text-[var(--muted)]">Use the email on their exhibitor account. Access starts only after they accept.</p><label className="label">Registered email<input className="input" name="email" type="email" required maxLength={254}/></label>{state.error?<p className="alert" role="alert">{state.error}</p>:null}{state.success?<p className="alert" role="status">{state.success}</p>:null}<SubmitButton pendingText="Sending…">Send invitation</SubmitButton></form>;
}

export function ExternalClientForm() {
  const [state, action] = useActionState(createExternalClient, initial);
  return <form action={action} className="panel grid gap-4 p-5"><h2 className="text-xl font-black">Create an external client</h2><p className="text-sm text-[var(--muted)]">Create a reusable client identity now and optionally reserve it for a future account email.</p><label className="label">Company name<input className="input" name="company_name" required maxLength={160}/></label><div className="grid gap-3 sm:grid-cols-2"><label className="label">Industry<input className="input" name="industry" maxLength={160}/></label><label className="label">Company type<input className="input" name="company_type" maxLength={120}/></label></div><label className="label">Primary contact person<input className="input" name="primary_contact_name" maxLength={160}/></label><div className="grid gap-3 sm:grid-cols-2"><label className="label">Contact number<input className="input" name="contact_phone" type="tel" maxLength={40}/></label><label className="label">Contact email<input className="input" name="contact_email" type="email" maxLength={254}/></label></div><label className="label">Claim email (optional)<input className="input" name="claim_email" type="email" maxLength={254}/></label>{state.error?<p className="alert" role="alert">{state.error}</p>:null}{state.success?<p className="alert" role="status">{state.success}</p>:null}<SubmitButton pendingText="Creating…">Create managed client</SubmitButton></form>;
}
