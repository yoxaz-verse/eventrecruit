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
        showTabs={false}
      >
        <AuthMessage message={message} />
        <AuthActionForm action={requestPasswordReset} className="grid gap-4 mt-3">
          <label className="label text-xs">
            <span>Email address</span>
            <input autoComplete="email" className="input" name="email" placeholder="you@company.com" required type="email" />
          </label>
          <SubmitButton className="button button-primary w-full mt-2 font-extrabold text-sm py-3 shadow-md" pendingText="Sending code…">
            Send recovery code
          </SubmitButton>
        </AuthActionForm>
        <div className="mt-4 pt-4 border-t border-[var(--line)] text-center text-xs text-[var(--muted)]">
          Remembered your password?{" "}
          <Link className="font-extrabold text-[var(--accent)] hover:underline" href="/login">
            Log in to account
          </Link>
        </div>
      </AuthCard>
    </div>
  );
}
