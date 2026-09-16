import { AuthActionForm } from "@/components/auth/auth-action-form";
import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { updatePassword } from "@/app/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthMessage, resolveAuthMessage } from "@/components/auth/auth-message";
import { PasswordField } from "@/components/auth/password-field";
import { TopNav } from "@/components/top-nav";
import { getCurrentProfile } from "@/lib/auth";
import { getSupabaseServerConfig } from "@/lib/supabase/env";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  const supabaseConfigured = getSupabaseServerConfig().isConfigured;
  if (params?.message === "configure-supabase" && supabaseConfigured) {
    redirect("/reset-password");
  }

  const message = resolveAuthMessage(params?.message, {
    supabaseConfigured,
  });

  return (
    <div className="shell">
      <TopNav />
      <AuthCard
        badge="New password"
        title="Create a new password"
        description="Verify the recovery code first, then set a new password for your exporb account."
        footer={profile ? undefined : { text: "Need a new recovery code?", href: "/forgot-password", label: "Send again" }}
        showTabs={false}
      >
        <AuthMessage message={message ?? (profile ? undefined : "Verify the recovery code from your email before updating your password.")} />
        <AuthActionForm action={updatePassword} className="grid gap-4 mt-3">
          <PasswordField autoComplete="new-password" label="New password" showStrength />
          <PasswordField autoComplete="new-password" label="Confirm password" name="confirm_password" />
          <SubmitButton className="button button-primary w-full mt-2 font-extrabold text-sm py-3 shadow-md" pendingText="Updating password…">
            Update password
          </SubmitButton>
        </AuthActionForm>
        {profile ? (
          <Link className="text-sm font-bold text-[var(--accent)]" href="/dashboard">
            Return to dashboard
          </Link>
        ) : null}
      </AuthCard>
    </div>
  );
}
