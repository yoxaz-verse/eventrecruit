import Link from "next/link";
import { updatePassword } from "@/app/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthMessage } from "@/components/auth/auth-message";
import { PasswordField } from "@/components/auth/password-field";
import { TopNav } from "@/components/top-nav";
import { getCurrentProfile } from "@/lib/auth";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const profile = await getCurrentProfile();

  return (
    <div className="shell">
      <TopNav />
      <AuthCard
        badge="New password"
        title="Create a new password"
        description="Use the recovery email link first, then set a new password for your EventRecruit account."
        footer={profile ? undefined : { text: "Need a new recovery link?", href: "/forgot-password", label: "Send again" }}
      >
        <AuthMessage message={params?.message ?? (profile ? undefined : "Open the recovery link from your email before updating your password.")} />
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
