import { AuthActionForm } from "@/components/auth/auth-action-form";
import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requestLoginOtp, signInWithPassword } from "@/app/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthMessage, resolveAuthMessage } from "@/components/auth/auth-message";
import { LoginTabs } from "@/components/auth/login-tabs";
import { PasswordField } from "@/components/auth/password-field";
import { TopNav } from "@/components/top-nav";
import { getSupabaseServerConfig } from "@/lib/supabase/env";
import { getCurrentAccount } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string; mode?: string }>;
}) {
  if (await getCurrentAccount()) redirect("/dashboard");
  const params = await searchParams;
  const mode = params?.mode === "otp" ? "otp" : "password";
  const supabaseConfigured = getSupabaseServerConfig().isConfigured;
  if (params?.message === "configure-supabase" && supabaseConfigured) {
    redirect(mode === "otp" ? "/login?mode=otp" : "/login");
  }

  const message = resolveAuthMessage(params?.message, {
    supabaseConfigured,
  });

  return (
    <div className="shell">
      <TopNav />
      <AuthCard
        badge="Secure access"
        title="Log in to expo sphere"
        description="Access your India-wide event and retail staffing workspace with password or email OTP."
        footer={{ text: "New here?", href: "/signup", label: "Create account" }}
      >
        <p className="mb-4 text-sm">Event organizer login: use your company account email below. <Link href="/signup?role=organizer" className="font-bold">Register your company</Link></p>
        <LoginTabs mode={mode} />
        <AuthMessage message={message} />
        {mode === "password" ? (
          <AuthActionForm action={signInWithPassword}>
          <label className="label">
            Email
              <input autoComplete="email" className="input" name="email" required type="email" />
          </label>
            <PasswordField />
          <SubmitButton className="button button-primary" pendingText="Logging in…">Log in</SubmitButton>
            <Link className="text-sm font-bold text-[var(--accent)]" href="/forgot-password">
              Forgot password?
            </Link>
        </AuthActionForm>
        ) : (
          <AuthActionForm action={requestLoginOtp}>
            <label className="label">
              Email
              <input autoComplete="email" className="input" name="email" required type="email" />
            </label>
            <SubmitButton className="button button-primary" pendingText="Sending code…">Send OTP</SubmitButton>
          </AuthActionForm>
        )}
      </AuthCard>
    </div>
  );
}
