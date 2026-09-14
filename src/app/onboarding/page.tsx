import { AuthActionForm } from "@/components/auth/auth-action-form";
import { SubmitButton } from "@/components/submit-button";
import { getCurrentProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { completeOnboarding } from "@/app/actions/onboarding";
import { TopNav } from "@/components/top-nav";
import { nextAccountPath } from "@/lib/onboarding";

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const next = await nextAccountPath(profile.id);
  if (next !== "/onboarding") redirect(next);
  const role = profile.role;
  const title = role === "talent" ? "Build your talent profile" : role === "agency" ? "Set up your agency" : "Set up your exhibitor company";
  return (
    <div className="shell">
      <TopNav />
      <main className="page py-12">
        <section className="panel p-8">
          <span className="badge">Onboarding</span>
          <h1 className="mt-4 text-4xl font-black">{title}</h1>
          <p className="mt-3 max-w-3xl leading-8 text-[var(--muted)]">
            Add your contact details and complete the information for your account type.
          </p>
          <AuthActionForm action={completeOnboarding} className="mt-6 grid gap-4">
            <div className="surface-card grid gap-4 p-4">
              <h2 className="text-xl font-black">Location and contact</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="label">City<input className="input" name="city" required maxLength={120} /></label>
                <label className="label">Private phone<input className="input" name="phone" required maxLength={40} type="tel" /></label>
              </div>
            </div>
            {role === "agency" || role === "exhibitor" ? <div className="surface-card grid gap-4 p-4">
              <h2 className="text-xl font-black">{role === "agency" ? "Agency details" : "Company details"}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="label">{role === "agency" ? "Agency name" : "Company name"}<input className="input" name="business_name" required maxLength={160} /></label>
                {role === "exhibitor" ? <label className="label">Industry<input className="input" name="industry" placeholder="Events, retail, FMCG" /></label> : null}
              </div>
              {role === "agency" ? <div className="grid gap-3 md:grid-cols-2">
                <label className="label">Commission type
                  <select className="input" name="commission_type">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed fee</option>
                  </select>
                </label>
                <label className="label">Commission value<input className="input" min="0" name="commission_value" type="number" step="0.01" /></label>
              </div> : null}
            </div> : null}
            {role === "talent" ? <div className="surface-card grid gap-4 p-4">
              <h2 className="text-xl font-black">Talent profile</h2>
              <label className="label">Headline<input className="input" name="headline" required /></label>
              <label className="label">Bio<textarea className="input textarea" name="bio" /></label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="label">Skills<input className="input" name="skills" required placeholder="Lead capture, Sampling, Greeting" /></label>
                <label className="label">Languages<input className="input" name="languages" placeholder="English, Hindi" /></label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="label">Availability<input className="input" name="availability" placeholder="Weekends, evenings, city coverage" /></label>
                <label className="label">Experience years<input className="input" min="0" name="experience_years" step="0.5" type="number" /></label>
              </div>
              <label className="label">Documents note<textarea className="input textarea" name="documents_note" /></label>
            </div> : null}
            <SubmitButton className="button button-primary" pendingText="Saving profile…">Complete onboarding</SubmitButton>
          </AuthActionForm>
        </section>
      </main>
    </div>
  );
}
