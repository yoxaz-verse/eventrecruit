import Link from "next/link";
import { completeOnboarding } from "@/app/actions/onboarding";
import { TopNav } from "@/components/top-nav";

export default function OnboardingPage() {
  return (
    <div className="shell">
      <TopNav />
      <main className="page py-12">
        <section className="panel p-8">
          <span className="badge">Onboarding</span>
          <h1 className="mt-4 text-4xl font-black">Your workspace is ready</h1>
          <p className="mt-3 max-w-3xl leading-8 text-[var(--muted)]">
            Complete your role profile next. Event talent enter verification, exhibitors
            and store teams add business details, and agencies create their records before
            matching people to client needs.
          </p>
          <form action={completeOnboarding} className="mt-6 grid gap-4">
            <div className="surface-card grid gap-4 p-4">
              <h2 className="text-xl font-black">Location and contact</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="label">City<input className="input" name="city" /></label>
                <label className="label">Private phone<input className="input" name="phone" /></label>
              </div>
            </div>
            <div className="surface-card grid gap-4 p-4">
              <h2 className="text-xl font-black">Business or agency details</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="label">Business name<input className="input" name="business_name" placeholder="For agencies, exhibitors, or stores" /></label>
                <label className="label">Industry<input className="input" name="industry" placeholder="Events, retail, FMCG" /></label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="label">Commission type
                  <select className="input" name="commission_type">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed fee</option>
                  </select>
                </label>
                <label className="label">Commission value<input className="input" min="0" name="commission_value" type="number" /></label>
              </div>
            </div>
            <div className="surface-card grid gap-4 p-4">
              <h2 className="text-xl font-black">Talent profile and verification</h2>
              <label className="label">Headline<input className="input" name="headline" placeholder="For event talent" /></label>
              <label className="label">Bio<textarea className="input textarea" name="bio" /></label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="label">Skills<input className="input" name="skills" placeholder="Lead capture, Sampling, Greeting" /></label>
                <label className="label">Languages<input className="input" name="languages" placeholder="English, Hindi" /></label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="label">Availability<input className="input" name="availability" placeholder="Weekends, evenings, city coverage" /></label>
                <label className="label">Experience years<input className="input" min="0" name="experience_years" step="0.5" type="number" /></label>
              </div>
              <label className="label">Documents note<textarea className="input textarea" name="documents_note" /></label>
            </div>
            <button className="button button-primary" type="submit">Complete onboarding</button>
          </form>
          <div className="mt-4 flex gap-3">
            <Link className="button button-secondary" href="/browse">
              View roles
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
