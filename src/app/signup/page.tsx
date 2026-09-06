import { Building2, UserRoundCheck, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { signUpWithEmailVerification } from "@/app/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthMessage, resolveAuthMessage } from "@/components/auth/auth-message";
import { PasswordField } from "@/components/auth/password-field";
import { TopNav } from "@/components/top-nav";
import { getSupabaseServerConfig } from "@/lib/supabase/env";

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

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string; role?: string }>;
}) {
  const params = await searchParams;
  const supabaseConfigured = getSupabaseServerConfig().isConfigured;
  if (params?.message === "configure-supabase" && supabaseConfigured) {
    redirect("/signup");
  }

  const message = resolveAuthMessage(params?.message, {
    supabaseConfigured,
  });

  return (
    <div className="shell">
      <TopNav />
      <AuthCard
        badge="Verified signup"
        title="Create your account"
        description="Start as an event organizer, talent, an exhibitor, or an agency for events and retail activations across India."
        footer={{ text: "Already registered?", href: "/login", label: "Log in" }}
      >
        <form action={signUpWithEmailVerification} className="grid gap-4">
          <AuthMessage message={message} />
          <label className="label">
            Full name
            <input autoComplete="name" className="input" name="full_name" required />
          </label>
          <label className="label">
            Email
            <input autoComplete="email" className="input" name="email" required type="email" />
          </label>
          <PasswordField autoComplete="new-password" />
          <label className="label">
            Account type
            <select className="input" name="role" required defaultValue={params?.role === "organizer" ? "organizer" : "talent"}>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.title}
                </option>
              ))}
            </select>
          </label>
          <div className="role-options" aria-label="Available account types">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <article className="role-option" key={role.value}>
                  <Icon size={20} aria-hidden />
                  <div>
                    <strong>{role.title}</strong>
                    <p>{role.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
          <button className="button button-primary" type="submit">
            Sign up and verify email
          </button>
        </form>
      </AuthCard>
    </div>
  );
}
