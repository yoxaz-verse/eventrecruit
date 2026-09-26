import {
  Building2,
  CheckCircle2,
  CircleAlert,
  Mail,
  MapPin,
  ShieldCheck,
  Globe,
  User,
  Phone,
  Smartphone,
  Briefcase,
  Sparkles,
  Lock,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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

  return (
    <DashboardShell active="exhibitor" current="/dashboard/exhibitor/profile">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Hero Header Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-6 text-white shadow-xl sm:p-8">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center">
            {exhibitor.logo_path ? (
              <Image unoptimized width={96} height={96} className="h-24 w-24 rounded-3xl border border-white/20 bg-white object-contain p-2 shadow-xl shrink-0" src={`/api/media/exhibitor/${exhibitor.id}`} alt={`${exhibitor.company_name} logo`} />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-white shadow-xl shrink-0">
                <Building2 size={40} aria-hidden />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold ${verified ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-200" : "border-amber-300/30 bg-amber-400/15 text-amber-100"}`}>
                  {verified ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}
                  {verified ? "Verified Exhibitor" : "Verification Pending"}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-blue-100 border border-white/10">
                  Exhibitor Account
                </span>
              </div>
              <h1 className="mt-3 truncate text-3xl font-black sm:text-4xl tracking-tight text-white">{exhibitor.company_name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-blue-100/80">
                {exhibitor.industry ? <span className="flex items-center gap-1"><Sparkles size={13} className="text-amber-400" />{exhibitor.industry}</span> : null}
                {exhibitor.city || profile.city ? <span className="inline-flex items-center gap-1"><MapPin size={13} className="text-blue-300" />{exhibitor.city || profile.city}</span> : null}
                {exhibitor.website ? <a href={exhibitor.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-200 hover:text-white underline"><Globe size={13} />{exhibitor.website.replace(/^https?:\/\//, "")}</a> : null}
              </div>
            </div>
          </div>
        </section>

        {/* Saved Notification Callout */}
        {saved ? (
          <div className="panel p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-2xs" role="status">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-emerald-950">Profile Saved Successfully!</h4>
                <p className="text-xs text-emerald-800">Your company information and contact details have been updated across the platform.</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Form & Sidebar Grid */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <AuthActionForm action={saveExhibitorProfile} className="panel grid gap-8 p-6 sm:p-8 bg-white border border-[var(--line)] rounded-3xl shadow-xs">
            {/* Section 1: Company Identity */}
            <fieldset className="grid gap-5 border-0 p-0">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--line)]">
                <Building2 className="text-[var(--accent)]" size={20} />
                <legend className="text-xl font-black text-[var(--foreground)]">Company Details</legend>
              </div>
              <p className="text-xs text-[var(--muted)] -mt-2">Keep the official business identity used across your event registrations and staffing requests accurate.</p>

              <label className="label">
                <span>Company Name <span className="text-red-600 ml-1">*</span></span>
                <div className="input-icon-wrap">
                  <Building2 size={17} />
                  <input className="input" name="company_name" required maxLength={160} defaultValue={exhibitor.company_name} />
                </div>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="label">
                  <span>Company Type <span className="field-optional">Optional</span></span>
                  <div className="input-icon-wrap">
                    <Briefcase size={17} />
                    <input className="input" name="company_type" maxLength={120} placeholder="Private Limited, Partnership…" defaultValue={exhibitor.company_type ?? ""} />
                  </div>
                </label>

                <label className="label">
                  <span>Industry <span className="field-optional">Optional</span></span>
                  <div className="input-icon-wrap">
                    <Sparkles size={17} />
                    <input className="input" name="industry" maxLength={160} placeholder="FMCG, Retail, Tech…" defaultValue={exhibitor.industry ?? ""} />
                  </div>
                </label>
              </div>

              <label className="label">
                <span>Company Description <span className="field-optional">Optional</span></span>
                <textarea className="input textarea" name="description" maxLength={5000} rows={4} placeholder="Provide a brief overview of your business..." defaultValue={exhibitor.description ?? ""} />
              </label>
            </fieldset>

            {/* Section 2: Location & Web Presence */}
            <fieldset className="grid gap-5 border-0 border-t border-[var(--line)] p-0 pt-6">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--line)]/60">
                <MapPin className="text-[var(--accent)]" size={20} />
                <legend className="text-lg font-extrabold text-[var(--foreground)]">Location & Web Presence</legend>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="label">
                  <span>Website URL <span className="field-optional">Optional</span></span>
                  <div className="input-icon-wrap">
                    <Globe size={17} />
                    <input className="input" name="website" type="url" maxLength={2048} placeholder="https://example.com" defaultValue={exhibitor.website ?? ""} />
                  </div>
                </label>

                <label className="label">
                  <span>City <span className="text-red-600 ml-1">*</span></span>
                  <div className="input-icon-wrap">
                    <MapPin size={17} />
                    <input autoComplete="address-level2" className="input" name="city" required maxLength={120} defaultValue={exhibitor.city || profile.city || ""} />
                  </div>
                </label>
              </div>

              <label className="label">
                <span>Business Address <span className="field-optional">Optional</span></span>
                <textarea autoComplete="street-address" className="input textarea" name="address" maxLength={500} rows={3} placeholder="Enter full office or registered business address..." defaultValue={exhibitor.address ?? ""} />
              </label>
            </fieldset>

            {/* Section 3: Primary Company Contact */}
            <fieldset className="grid gap-5 border-0 border-t border-[var(--line)] p-0 pt-6">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--line)]/60">
                <User className="text-[var(--accent)]" size={20} />
                <legend className="text-lg font-extrabold text-[var(--foreground)]">Primary Company Contact</legend>
              </div>
              <p className="text-xs text-[var(--muted)] -mt-2">These details identify the primary business contact for staffing coordination and event logistics.</p>

              <label className="label">
                <span>Contact Person Name <span className="field-optional">Optional</span></span>
                <div className="input-icon-wrap">
                  <User size={17} />
                  <input autoComplete="name" className="input" name="primary_contact_name" maxLength={160} defaultValue={exhibitor.primary_contact_name ?? ""} />
                </div>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="label">
                  <span>Company Phone <span className="field-optional">Optional</span></span>
                  <div className="input-icon-wrap">
                    <Phone size={17} />
                    <input autoComplete="tel" className="input" name="contact_phone" type="tel" maxLength={40} defaultValue={exhibitor.contact_phone ?? ""} />
                  </div>
                </label>

                <label className="label">
                  <span>Company Email <span className="field-optional">Optional</span></span>
                  <div className="input-icon-wrap">
                    <Mail size={17} />
                    <input autoComplete="email" className="input" name="contact_email" type="email" maxLength={254} defaultValue={exhibitor.contact_email ?? ""} />
                  </div>
                </label>
              </div>
            </fieldset>

            {/* Section 4: Account Security */}
            <fieldset className="grid gap-5 border-0 border-t border-[var(--line)] p-0 pt-6">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--line)]/60">
                <ShieldCheck className="text-[var(--accent)]" size={20} />
                <legend className="text-lg font-extrabold text-[var(--foreground)]">Account Owner Security</legend>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="label">
                  <span>Account Holder Name <span className="text-red-600 ml-1">*</span></span>
                  <div className="input-icon-wrap">
                    <User size={17} />
                    <input autoComplete="name" className="input" name="full_name" required maxLength={160} defaultValue={profile.full_name} />
                  </div>
                </label>

                <label className="label">
                  <span>Private Account Phone <span className="text-red-600 ml-1">*</span></span>
                  <div className="input-icon-wrap">
                    <Smartphone size={17} />
                    <input autoComplete="tel" className="input" name="account_phone" type="tel" required maxLength={40} defaultValue={contact?.phone ?? ""} />
                  </div>
                </label>
              </div>

              <label className="label">
                <span>Login Email</span>
                <div className="input flex items-center gap-2.5 bg-[var(--surface)] text-[var(--muted)] font-medium cursor-not-allowed" aria-label="Login email">
                  <Lock size={16} className="shrink-0 text-[var(--muted)]" aria-hidden />
                  <span>{account.email}</span>
                </div>
                <span className="field-hint">Your sign-in email address cannot be changed here.</span>
              </label>
            </fieldset>

            {/* Save Button */}
            <div className="pt-4 border-t border-[var(--line)] flex items-center justify-end">
              <SubmitButton className="button button-primary gap-2 px-6 py-3 text-sm shadow-md" pendingText="Saving Profile…">
                <CheckCircle2 size={18} />
                <span>Save Exhibitor Profile</span>
              </SubmitButton>
            </div>
          </AuthActionForm>

          {/* Right Sidebar Controls */}
          <aside className="space-y-6 lg:sticky lg:top-20">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--muted)] mb-2.5">Company Logo & Branding</h3>
              <ProfileImageForm kind="Exhibitor logo" imageUrl={exhibitor.logo_path ? `/api/media/exhibitor/${exhibitor.id}` : null} />
            </div>

            <section className="panel p-5 bg-white border border-[var(--line)] rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                {verified ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={20} />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <CircleAlert size={20} />
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-sm text-[var(--foreground)]">Verification Status</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${verified ? "text-emerald-700" : "text-amber-700"}`}>
                    {verified ? "Verified" : "Pending Review"}
                  </span>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-[var(--muted)]">
                {verified
                  ? "Your company identity is verified. Profile edits do not change your verified status."
                  : "Your company is awaiting verification. Administrators review submissions for staffing approval."}
              </p>
            </section>

            <section className="panel p-5 bg-white border border-[var(--line)] rounded-2xl shadow-xs">
              <h3 className="font-extrabold text-sm text-[var(--foreground)] mb-1">Account & Security Settings</h3>
              <p className="text-xs text-[var(--muted)] mb-3">
                Manage notification preferences, password reset recovery, or account deletion controls.
              </p>
              <Link href="/dashboard/exhibitor/settings" className="button button-secondary text-xs w-full justify-between gap-2 py-2">
                <span>Manage Security Settings</span>
                <ArrowRight size={14} />
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}

