import { AuthActionForm } from "@/components/auth/auth-action-form";
import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requestPasswordReset } from "@/app/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthMessage, resolveAuthMessage } from "@/components/auth/auth-message";
import { TopNav } from "@/components/top-nav";
import { getSupabaseServerConfig } from "@/lib/supabase/env";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabaseConfigured = getSupabaseServerConfig().isConfigured;
  if (params?.message === "configure-supabase" && supabaseConfigured) {
    redirect("/forgot-password");
  }

  const message = resolveAuthMessage(params?.message, {
    supabaseConfigured,
  });

  return (
    <div className="shell">
      <TopNav />
      <AuthCard
        badge="Account recovery"
        title="Reset your password"
        description="Enter your account email. We will send a 6 digit recovery code to confirm ownership."
      >
        <AuthMessage message={message} />
        <AuthActionForm action={requestPasswordReset}>
          <label className="label">
            Email
            <input autoComplete="email" className="input" name="email" required type="email" />
          </label>
          <SubmitButton className="button button-primary" pendingText="Sending code…">Send recovery code</SubmitButton>
        </AuthActionForm>
        <p className="text-sm text-[var(--muted)]">
          Remembered it?{" "}
          <Link className="font-bold text-[var(--accent)]" href="/login">
            Log in
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}
