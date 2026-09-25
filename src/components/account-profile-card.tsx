import { AuthActionForm } from "@/components/auth/auth-action-form";
import { ProfileImageForm } from "@/components/profile-image-form";
import { SubmitButton } from "@/components/submit-button";
import { saveAccountProfile } from "@/app/actions/account-profile";
import type { UserRole } from "@/lib/types";

export function AccountProfileCard({ id, role, fullName, email, phone, avatarUrl, saved = false }: { id: string; role: UserRole; fullName: string; email: string; phone: string; avatarUrl?: string | null; saved?: boolean }) {
  const imageScope = role === "talent" ? "talent" : "profile";
  return <section className="grid gap-5">
    {saved ? <p className="alert border-emerald-200 bg-emerald-50 text-emerald-800" role="status">Account profile saved.</p> : null}
    <div className="panel p-5 sm:p-6"><ProfileImageForm kind="Profile picture" imageUrl={avatarUrl ? `/api/media/${imageScope}/${id}` : null} target="avatar" /></div>
    <AuthActionForm action={saveAccountProfile} className="panel grid gap-5 p-5 sm:p-6">
      <div><span className="badge capitalize">{role} account</span><h2 className="mt-3 text-xl font-black">Personal details</h2></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="label">Account holder name <span className="text-red-600">*</span><input autoComplete="name" className="input" name="full_name" required maxLength={160} defaultValue={fullName} /></label>
        <label className="label">Private phone <span className="text-red-600">*</span><input autoComplete="tel" className="input" name="phone" type="tel" required maxLength={40} defaultValue={phone} /></label>
      </div>
      <label className="label">Login email<input className="input bg-[var(--surface)] text-[var(--muted)]" readOnly value={email} /><span className="field-hint">Your sign-in email cannot be changed here.</span></label>
      <SubmitButton className="button button-primary w-full sm:w-fit" pendingText="Saving profile…">Save personal profile</SubmitButton>
    </AuthActionForm>
  </section>;
}

