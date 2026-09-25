import { Building2, CheckCircle2, CircleAlert, Mail, MapPin, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { saveExhibitorProfile } from "@/app/actions/exhibitor-profile";
import { AuthActionForm } from "@/components/auth/auth-action-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProfileImageForm } from "@/components/profile-image-form";
import { SubmitButton } from "@/components/submit-button";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ExhibitorProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const profile = await requireRole(["exhibitor"]);
  const db = await createClient();
  if (!db) throw new Error("Profile is temporarily unavailable.");
  const [{ data: account, error: accountError }, { data: contact, error: contactError }, { data: exhibitor, error: exhibitorError }] = await Promise.all([
    db.from("app_accounts").select("email").eq("id", profile.id).single(),
    db.from("contact_details").select("phone").eq("profile_id", profile.id).maybeSingle(),
    db.from("exhibitors").select("id,company_name,company_type,industry,description,website,address,city,primary_contact_name,contact_phone,contact_email,logo_path,verification_status").eq("owner_id", profile.id).single(),
  ]);
  if (accountError || contactError || exhibitorError || !exhibitor) throw new Error("Unable to load your exhibitor profile.");
  const saved = (await searchParams).saved === "1";
  const verified = exhibitor.verification_status === "verified";

  return <DashboardShell active="exhibitor" current="/dashboard/exhibitor/profile">
    <div className="mx-auto max-w-5xl">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          {exhibitor.logo_path ? <Image unoptimized width={96} height={96} className="h-24 w-24 rounded-3xl border border-white/20 bg-white object-contain p-2 shadow-lg" src={`/api/media/exhibitor/${exhibitor.id}`} alt={`${exhibitor.company_name} logo`} /> : <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/20 bg-white/10"><Building2 size={40} aria-hidden /></div>}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold ${verified ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-200" : "border-amber-300/30 bg-amber-400/15 text-amber-100"}`}>
                {verified ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}{verified ? "Verified exhibitor" : "Verification pending"}
              </span>
            </div>
            <h1 className="mt-3 truncate text-3xl font-black sm:text-4xl">{exhibitor.company_name}</h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-blue-100/80">
              {exhibitor.industry ? <span>{exhibitor.industry}</span> : null}
              {exhibitor.city || profile.city ? <span className="inline-flex items-center gap-1"><MapPin size={14} />{exhibitor.city || profile.city}</span> : null}
            </div>
          </div>
        </div>
      </section>

      {saved ? <p className="alert mt-6 border-emerald-200 bg-emerald-50 text-emerald-800" role="status">Profile saved successfully.</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <AuthActionForm action={saveExhibitorProfile} className="panel grid gap-7 p-5 sm:p-7">
          <fieldset className="grid gap-4 border-0 p-0">
            <legend className="text-xl font-black">Company details</legend>
            <p className="text-sm text-[var(--muted)]">Keep the business identity used across your events and staffing requests up to date.</p>
            <label className="label">Company name <span className="text-red-600">*</span><input className="input" name="company_name" required maxLength={160} defaultValue={exhibitor.company_name} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="label">Company type <span className="field-optional">Optional</span><input className="input" name="company_type" maxLength={120} placeholder="Private limited, partnership…" defaultValue={exhibitor.company_type ?? ""} /></label>
              <label className="label">Industry <span className="field-optional">Optional</span><input className="input" name="industry" maxLength={160} placeholder="FMCG, retail, technology…" defaultValue={exhibitor.industry ?? ""} /></label>
            </div>
            <label className="label">Company description <span className="field-optional">Optional</span><textarea className="input textarea" name="description" maxLength={5000} rows={5} defaultValue={exhibitor.description ?? ""} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="label">Website <span className="field-optional">Optional</span><input className="input" name="website" type="url" maxLength={2048} placeholder="https://example.com" defaultValue={exhibitor.website ?? ""} /></label>
              <label className="label">City <span className="text-red-600">*</span><input autoComplete="address-level2" className="input" name="city" required maxLength={120} defaultValue={exhibitor.city || profile.city || ""} /></label>
            </div>
            <label className="label">Business address <span className="field-optional">Optional</span><textarea autoComplete="street-address" className="input textarea" name="address" maxLength={500} rows={3} defaultValue={exhibitor.address ?? ""} /></label>
          </fieldset>

          <fieldset className="grid gap-4 border-0 border-t border-[var(--line)] p-0 pt-6">
            <legend className="text-xl font-black">Primary company contact</legend>
            <p className="text-sm text-[var(--muted)]">These details identify the company contact and are separate from your private account phone.</p>
            <label className="label">Contact name <span className="field-optional">Optional</span><input autoComplete="name" className="input" name="primary_contact_name" maxLength={160} defaultValue={exhibitor.primary_contact_name ?? ""} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="label">Company phone <span className="field-optional">Optional</span><input autoComplete="tel" className="input" name="contact_phone" type="tel" maxLength={40} defaultValue={exhibitor.contact_phone ?? ""} /></label>
              <label className="label">Company email <span className="field-optional">Optional</span><input autoComplete="email" className="input" name="contact_email" type="email" maxLength={254} defaultValue={exhibitor.contact_email ?? ""} /></label>
            </div>
          </fieldset>

          <fieldset className="grid gap-4 border-0 border-t border-[var(--line)] p-0 pt-6">
            <legend className="text-xl font-black">Account details</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="label">Account holder name <span className="text-red-600">*</span><input autoComplete="name" className="input" name="full_name" required maxLength={160} defaultValue={profile.full_name} /></label>
              <label className="label">Private account phone <span className="text-red-600">*</span><input autoComplete="tel" className="input" name="account_phone" type="tel" required maxLength={40} defaultValue={contact?.phone ?? ""} /></label>
            </div>
            <label className="label">Login email<div className="input flex items-center gap-2 bg-[var(--surface)] text-[var(--muted)]" aria-label="Login email"><Mail size={16} aria-hidden />{account.email}</div><span className="field-hint">Your sign-in email cannot be changed here.</span></label>
          </fieldset>

          <SubmitButton className="button button-primary w-full sm:w-fit" pendingText="Saving profile…">Save profile</SubmitButton>
        </AuthActionForm>

        <aside className="grid gap-5 lg:sticky lg:top-20">
          <ProfileImageForm kind="Profile picture" imageUrl={profile.avatar_url ? `/api/media/profile/${profile.id}` : null} target="avatar" />
          <section className="panel p-5">
            <div className="mb-4 flex items-center gap-2"><ShieldCheck className="text-[var(--accent)]" size={20} /><h2 className="font-black">Verification</h2></div>
            <p className="text-sm leading-6 text-[var(--muted)]">{verified ? "Your company identity is verified. Profile edits do not change this status." : "Your company is awaiting verification. Administrators control verification status."}</p>
          </section>
          <ProfileImageForm kind="Exhibitor logo" imageUrl={exhibitor.logo_path ? `/api/media/exhibitor/${exhibitor.id}` : null} />
        </aside>
      </div>
    </div>
  </DashboardShell>;
}
