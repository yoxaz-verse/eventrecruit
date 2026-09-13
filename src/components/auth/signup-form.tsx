"use client";
import { useActionState } from "react";
import { Building2, UserRoundCheck, Users } from "lucide-react";
import { signUpWithEmailVerification } from "@/app/actions/auth";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/submit-button";
import { usePreserveFormValues } from "@/components/use-preserve-form-values";
const roles = [
  { value: "organizer", title: "Event Organizer", text: "Register your event company and publish upcoming events.", icon: Building2 },
  {
    value: "talent",
    title: "Event Talent",
    text: "Apply to verified event roles and build a trusted work profile.",
    icon: UserRoundCheck,
  },
  {
    value: "exhibitor",
    title: "Exhibitor",
    text: "Post staffing needs, review applicants, and manage event placements.",
    icon: Building2,
  },
  {
    value: "agency",
    title: "Agency",
    text: "Manage exhibitor clients, staffing requests, and commission records.",
    icon: Users,
  },
];

export function SignupForm({ selectedRole }: { selectedRole: string }) {
 const [state, action, pending] = useActionState(signUpWithEmailVerification, {error:""});
 const { formRef, capture } = usePreserveFormValues(state.error, pending);
 return (
        <form action={action} aria-busy={pending} className="grid gap-4" onSubmit={(event) => { if (pending) event.preventDefault(); else capture(); }} ref={formRef}>
          {!pending && state.error ? <p className="alert" role="alert">{state.error}</p> : null}
          <label className="label">
            Full name
            <input autoComplete="name" className="input" name="full_name" required />
          </label>
          <label className="label">
            Email
            <input autoComplete="email" className="input" name="email" required type="email" />
          </label>
          <PasswordField autoComplete="new-password" showStrength />
          <fieldset className="role-options">
            <legend className="label role-legend">Account type</legend>
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <label className="role-option" key={role.value}>
                  <input type="radio" name="role" value={role.value} defaultChecked={selectedRole === role.value} required />
                  <Icon size={20} aria-hidden />
                  <div>
                    <strong>{role.title}</strong>
                    <p>{role.text}</p>
                  </div>
                </label>
              );
            })}
          </fieldset>
          <SubmitButton className="button button-primary" pendingText="Creating account…">Sign up and verify email</SubmitButton>
        </form>
 );
}
