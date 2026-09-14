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
import { Mail, KeyRound, Building2 } from "lucide-react";

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
        title="Log in to exporb"
        description="Access your India-wide event and retail staffing workspace with password or email OTP."
        footer={{ text: "New here?", href: "/signup", label: "Create account" }}
      >
        <div className="callout-banner callout-banner-emerald mb-4 p-3 rounded-xl">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <Building2 size={16} className="text-emerald-700 shrink-0" aria-hidden />
            <span>Event organizer? Use your company email below or <Link href="/signup?role=organizer" className="font-bold underline">register your company</Link>.</span>
          </div>
        </div>

        <LoginTabs mode={mode} />
        <AuthMessage message={message} />

        {mode === "password" ? (
          <AuthActionForm action={signInWithPassword} className="grid gap-3.5 mt-3">
            <label className="label text-xs">
              <span>Email address</span>
              <div className="input-icon-wrap">
                <Mail size={17} aria-hidden />
                <input autoComplete="email" className="input" name="email" placeholder="you@company.com" required type="email" />
              </div>
            </label>

            <PasswordField />

            <div className="flex items-center justify-between">
              <Link className="text-xs font-bold text-[var(--accent)] hover:underline" href="/forgot-password">
                Forgot password?
              </Link>
            </div>

            <SubmitButton className="button button-primary w-full mt-1 shadow-md font-bold py-2.5 text-sm" pendingText="Logging in…">
              Log in to workspace
            </SubmitButton>
          </AuthActionForm>
        ) : (
          <AuthActionForm action={requestLoginOtp} className="grid gap-3.5 mt-3">
            <label className="label text-xs">
              <span>Email address</span>
              <div className="input-icon-wrap">
                <Mail size={17} aria-hidden />
                <input autoComplete="email" className="input" name="email" placeholder="you@company.com" required type="email" />
              </div>
            </label>
            <SubmitButton className="button button-primary w-full mt-1 shadow-md font-bold py-2.5 text-sm" pendingText="Sending code…">
              Send OTP verification code
            </SubmitButton>
          </AuthActionForm>
        )}
      </AuthCard>
    </div>
  );
}

