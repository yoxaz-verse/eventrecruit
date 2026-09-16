import { AuthActionForm } from "@/components/auth/auth-action-form";
import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  resendLoginOtp,
  resendRecoveryOtp,
  resendSignupOtp,
  verifyEmailOtp,
} from "@/app/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthMessage, resolveAuthMessage } from "@/components/auth/auth-message";
import { OtpInput } from "@/components/auth/otp-input";
import { ResendButton } from "@/components/auth/resend-button";
import { TopNav } from "@/components/top-nav";
import { getSupabaseServerConfig } from "@/lib/supabase/env";
import { getCurrentAccount } from "@/lib/auth";
import { nextAccountPath } from "@/lib/onboarding";
import { RefreshRestoredOtp } from "@/components/auth/refresh-restored-otp";

const labels: Record<string, string> = {
  signup: "Verify signup",
  activation: "Activate account",
  recovery: "Verify recovery",
  magiclink: "Verify login",
};

export default async function VerifyOtpPage({
  searchParams,
}: {
  searchParams?: Promise<{ email?: string; message?: string; type?: string }>;
}) {
  const account = await getCurrentAccount();
  if (account) redirect(await nextAccountPath(account.id));
  const params = await searchParams;
  const type = params?.type ?? "magiclink";
  const email = params?.email ?? "";
  const supabaseConfigured = getSupabaseServerConfig().isConfigured;
  if (params?.message === "configure-supabase" && supabaseConfigured) {
    const cleanParams = new URLSearchParams();
    if (email) cleanParams.set("email", email);
    if (type) cleanParams.set("type", type);
    redirect(`/verify-otp${cleanParams.size ? `?${cleanParams.toString()}` : ""}`);
  }

  const message = resolveAuthMessage(params?.message, {
    supabaseConfigured,
  });

  return (
    <div className="shell">
      <RefreshRestoredOtp />
      <TopNav />
      <AuthCard
        badge="Email OTP"
        title={labels[type] ?? "Verify OTP"}
        description="Enter your 6 digit email code. Only the latest code will work."
        footer={{ text: "Already verified?", href: "/login", label: "Return to login" }}
        showTabs={false}
      >
        <AuthMessage message={message} />
        <AuthActionForm action={verifyEmailOtp} className="grid gap-4 mt-3">
          <input name="type" type="hidden" value={type} />
          <label className="label text-xs">
            <span>Email address</span>
            <input
              autoComplete="email"
              className="input"
              defaultValue={email}
              name="email"
              required
              type="email"
            />
          </label>
          <OtpInput />
          <SubmitButton className="button button-primary w-full mt-2 font-extrabold text-sm py-3 shadow-md" pendingText="Verifying…">
            Verify and continue
          </SubmitButton>
        </AuthActionForm>

        <div className="auth-resend mt-6 pt-5 border-t border-[var(--line)] grid gap-3 sm:grid-cols-2">
          <AuthActionForm action={
            type === "recovery"
              ? resendRecoveryOtp
              : type === "signup" || type === "activation"
                ? resendSignupOtp
                : resendLoginOtp
          }>
            <input name="email" type="hidden" value={email} />
            <ResendButton key={`${email}:${params?.message ?? ""}`} disabled={!email} />
          </AuthActionForm>
          <Link className="button button-secondary w-full text-xs font-bold min-h-[42px] justify-center" href="/forgot-password">
            Forgot password
          </Link>
        </div>
      </AuthCard>
    </div>
  );
}
