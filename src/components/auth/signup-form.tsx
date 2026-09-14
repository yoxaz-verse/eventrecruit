"use client";
import { useActionState } from "react";
import { Building2, UserRoundCheck, Users, Briefcase, User, Mail, CheckCircle2 } from "lucide-react";
import { signUpWithEmailVerification } from "@/app/actions/auth";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/submit-button";
import { usePreserveFormValues } from "@/components/use-preserve-form-values";

const roles = [
  {
    value: "talent",
    title: "Event Talent",
    text: "Apply for verified roles & build profile.",
    icon: UserRoundCheck,
    tag: "Popular",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    value: "exhibitor",
    title: "Exhibitor / Brand",
    text: "Post staffing needs & hire crews.",
    icon: Briefcase,
    tag: "Exhibitors",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    value: "organizer",
    title: "Event Organizer",
    text: "Publish events & manage staffing.",
    icon: Building2,
    tag: "Organizers",
    color: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    value: "agency",
    title: "Staffing Agency",
    text: "Manage clients & placements.",
    icon: Users,
    tag: "Agencies",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

export function SignupForm({ selectedRole }: { selectedRole: string }) {
  const [state, action, pending] = useActionState(signUpWithEmailVerification, { error: "" });
  const { formRef, capture } = usePreserveFormValues(state.error, pending);

  return (
    <form
      action={action}
      aria-busy={pending}
      className="grid gap-3.5"
      onSubmit={(event) => {
        if (pending) event.preventDefault();
        else capture();
      }}
      ref={formRef}
    >
      {!pending && state.error ? (
        <p className="alert text-xs py-2 px-3" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="label text-xs">
          <span>Full name <span className="text-red-500">*</span></span>
          <div className="input-icon-wrap">
            <User size={17} aria-hidden />
            <input autoComplete="name" className="input" name="full_name" placeholder="Aisha Rahman" required />
          </div>
        </label>

        <label className="label text-xs">
          <span>Email address <span className="text-red-500">*</span></span>
          <div className="input-icon-wrap">
            <Mail size={17} aria-hidden />
            <input autoComplete="email" className="input" name="email" placeholder="aisha@example.com" required type="email" />
          </div>
        </label>
      </div>

      <PasswordField autoComplete="new-password" showStrength />

      <fieldset className="grid gap-1.5 border-0 p-0 m-0">
        <div className="flex items-center justify-between mb-0.5">
          <legend className="label font-bold text-[11px] uppercase tracking-wider text-[var(--muted)]">Choose account type</legend>
          <span className="text-[10px] text-[var(--muted)]">Select your primary role</span>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <label
                className="role-card-select relative flex flex-col justify-between p-3 rounded-xl border border-[var(--line)] bg-white cursor-pointer transition-all hover:border-[var(--accent)]/50 hover:shadow-sm has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--surface)]/70 has-[:checked]:ring-2 has-[:checked]:ring-[var(--accent)]/30 group"
                key={role.value}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  defaultChecked={selectedRole === role.value}
                  required
                  className="sr-only peer"
                />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${role.color} shrink-0`}>
                      <Icon size={15} aria-hidden />
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white border border-[var(--line)] text-[var(--muted)]">
                      {role.tag}
                    </span>
                  </div>

                  <strong className="text-xs font-bold block text-[var(--foreground)] tracking-tight">
                    {role.title}
                  </strong>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">
                    {role.text}
                  </p>
                </div>

                <div className="mt-2 pt-1.5 border-t border-[var(--line)]/50 flex items-center justify-between text-[10px] font-bold text-[var(--muted)] peer-checked:text-[var(--accent)]">
                  <span>Select role</span>
                  <CheckCircle2 size={14} className="opacity-0 peer-checked:opacity-100 transition-opacity text-[var(--accent)]" />
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      <SubmitButton className="button button-primary w-full mt-1 shadow-md font-bold py-2.5 text-sm" pendingText="Creating account…">
        Create account & verify email
      </SubmitButton>
    </form>
  );
}


