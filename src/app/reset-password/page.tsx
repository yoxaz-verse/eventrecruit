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
        description="Use the recovery email link first, then set a new password for your EventRecruit account."
        footer={profile ? undefined : { text: "Need a new recovery link?", href: "/forgot-password", label: "Send again" }}
      >
        <AuthMessage message={message ?? (profile ? undefined : "Open the recovery link from your email before updating your password.")} />
        <form action={updatePassword} className="grid gap-4">
          <PasswordField autoComplete="new-password" label="New password" />
          <PasswordField autoComplete="new-password" label="Confirm password" name="confirm_password" />
          <button className="button button-primary" type="submit">
            Update password
          </button>
        </form>
        {profile ? (
          <Link className="text-sm font-bold text-[var(--accent)]" href="/dashboard">
            Return to dashboard
          </Link>
        ) : null}
      </AuthCard>
    </div>
  );
}
