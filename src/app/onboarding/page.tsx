import { Check, Circle } from "lucide-react";
import { redirect } from "next/navigation";
import { completeOnboarding } from "@/app/actions/onboarding";
import { AuthActionForm } from "@/components/auth/auth-action-form";
import { SubmitButton } from "@/components/submit-button";
import { TopNav } from "@/components/top-nav";
import { getCurrentProfile } from "@/lib/auth";
import { nextAccountPath } from "@/lib/onboarding";
import { activeLocations } from "@/lib/locations";

const roleContent = {
  talent: {
    title: "Set up your talent profile",
    description: "Add the essentials employers use to find and contact you. You can improve the rest later.",
    submit: "Save profile and browse roles",
    steps: ["Account created", "Add your essentials", "Browse open roles"],
  },
  agency: {
    title: "Set up your agency",
    description: "Tell us who you are so you can start organizing client work.",
    submit: "Save agency and continue",
    steps: ["Account created", "Add agency details", "Add your first client"],
  },
  exhibitor: {
    title: "Set up your company",
    description: "Add the essentials once, then start planning your event presence.",
    submit: "Save company and continue",
    steps: ["Account created", "Add company details", "Add your first event"],
  },
} as const;

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const next = await nextAccountPath(profile.id);
  if (next !== "/onboarding") redirect(next);
  if (profile.role === "organizer") redirect("/dashboard/organizer/company");
  if (!(["talent", "agency", "exhibitor"] as const).includes(profile.role as "talent" | "agency" | "exhibitor")) redirect("/dashboard");

  const role = profile.role as keyof typeof roleContent;
  const content = roleContent[role];
  const locations = role === "talent" ? await activeLocations() : [];

  return (
    <div className="shell">
      <TopNav />
      <main className="page py-8 md:py-12">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
          <aside className="panel p-5 lg:sticky lg:top-6" aria-label="Setup progress">
            <span className="badge">About 2 minutes</span>
            <h2 className="mt-4 text-lg font-black">Your setup path</h2>
            <ol className="mt-4 grid gap-3">
              {content.steps.map((step, index) => (
                <li className="flex items-center gap-3 text-sm font-bold" key={step} aria-current={index === 1 ? "step" : undefined}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${index < 2 ? "bg-[var(--accent)] text-white" : "border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"}`} aria-hidden="true">
                    {index === 0 ? <Check size={15} /> : index === 1 ? "2" : <Circle size={9} />}
                  </span>
                  <span className={index === 2 ? "text-[var(--muted)]" : ""}>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 border-t border-[var(--line)] pt-4 text-xs leading-relaxed text-[var(--muted)]">Only fields marked required are needed now. Your phone stays private.</p>
          </aside>

          <section className="panel p-5 sm:p-8">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--accent)]">Step 2 of 3</span>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{content.title}</h1>
            <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">{content.description}</p>

            <AuthActionForm action={completeOnboarding} className="mt-7 grid gap-5">
              <fieldset className="grid gap-4 border-0 p-0">
                <legend className="mb-3 text-lg font-black">Contact details</legend>
                <div className="grid gap-4 md:grid-cols-2">
                  {role === "talent" ? <label className="label"><span>Home city <span className="text-red-600 ml-1">*</span></span><select autoComplete="address-level2" className="input" name="home_location_id" required defaultValue=""><option value="" disabled>Select your home city</option>{locations.map(location=><option key={location.id} value={location.id}>{location.name}</option>)}</select></label> : <label className="label"><span>City <span className="text-red-600 ml-1">*</span></span><input autoComplete="address-level2" className="input" name="city" required maxLength={120} /></label>}
                  <label className="label"><span>Phone <span className="text-red-600 ml-1">*</span></span><input autoComplete="tel" className="input" name="phone" placeholder="+91 98765 43210" required maxLength={40} type="tel" /><span className="field-hint">Private—used only for account and work coordination.</span></label>
                </div>
              </fieldset>

              {role === "agency" || role === "exhibitor" ? (
                <fieldset className="grid gap-4 border-0 border-t border-[var(--line)] p-0 pt-5">
                  <legend className="mb-3 text-lg font-black">{role === "agency" ? "Agency" : "Company"} details</legend>
                  <label className="label"><span>{role === "agency" ? "Agency name" : "Company name"} <span className="text-red-600 ml-1">*</span></span><input autoComplete="organization" className="input" name="business_name" required maxLength={160} /></label>
                  {role === "exhibitor" ? <label className="label"><span>Industry <span className="field-optional">Optional</span></span><input className="input" name="industry" placeholder="For example: FMCG, retail, technology" /></label> : null}
                  {role === "agency" ? (
                    <details className="optional-details">
                      <summary>Set commission preferences <span>Optional</span></summary>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <label className="label">Commission type<select className="input" name="commission_type" defaultValue="percentage"><option value="percentage">Percentage</option><option value="fixed">Fixed fee</option></select></label>
                        <label className="label">Commission value<input className="input" min="0" name="commission_value" type="number" step="0.01" placeholder="10" /></label>
                      </div>
                    </details>
                  ) : null}
                </fieldset>
              ) : null}

              {role === "talent" ? (
                <fieldset className="grid gap-4 border-0 border-t border-[var(--line)] p-0 pt-5">
                  <legend className="mb-3 text-lg font-black">Where you can work</legend>
                  <p className="text-sm text-[var(--muted)]">Choose at least one city. These choices control your matching alerts.</p>
                  <div className="grid gap-3 sm:grid-cols-2">{locations.map(location=><label className="flex items-center gap-2 rounded-xl border border-[var(--line)] p-3" key={location.id}><input type="checkbox" name="preferred_location_ids" value={location.id}/><span>{location.name}</span></label>)}</div>
                  <details className="optional-details">
                    <summary>Complete your work profile <span>Optional</span></summary>
                    <div className="mt-4 grid gap-4">
                      <label className="label">Profile headline<input className="input" name="headline" placeholder="Event host and product demonstrator" /></label>
                      <label className="label">Skills<input className="input" name="skills" placeholder="Hosting, lead capture, sampling" /><span className="field-hint">Separate skills with commas.</span></label>
                      <label className="label">Short bio<textarea className="input textarea" name="bio" placeholder="A few lines about your event experience" /></label>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="label">Languages<input className="input" name="languages" placeholder="English, Hindi" /></label>
                        <label className="label">Experience in years<input className="input" min="0" max="99" name="experience_years" step="0.5" type="number" /></label>
                      </div>
                      <label className="label">Availability<input className="input" name="availability" placeholder="Weekends, evenings, Mumbai and Pune" /></label>
                      <label className="label">Documents note<textarea className="input textarea" name="documents_note" placeholder="Mention any IDs or certificates you can provide" /></label>
                    </div>
                  </details>
                </fieldset>
              ) : null}

              <SubmitButton className="button button-primary w-full sm:w-auto" pendingText="Saving your profile…">{content.submit}</SubmitButton>
            </AuthActionForm>
          </section>
        </div>
      </main>
    </div>
  );
}
