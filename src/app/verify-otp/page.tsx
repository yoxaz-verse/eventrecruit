import Link from "next/link";
import { redirect } from "next/navigation";
import {
  requestLoginOtp,
  requestPasswordReset,
  resendSignupOtp,
  verifyEmailOtp,
} from "@/app/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthMessage, resolveAuthMessage } from "@/components/auth/auth-message";
import { OtpInput } from "@/components/auth/otp-input";
import { ResendButton } from "@/components/auth/resend-button";
import { TopNav } from "@/components/top-nav";
import { getSupabaseServerConfig } from "@/lib/supabase/env";

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
      <TopNav />
      <AuthCard
        badge="Email OTP"
        title={labels[type] ?? "Verify OTP"}
        description="Enter the 6 digit code sent to your email. Only the latest code will work."
        footer={{ text: "Already verified?", href: "/login", label: "Return to login" }}
      >
        <AuthMessage message={message} />
        <form action={verifyEmailOtp} className="grid gap-4">
          <input name="type" type="hidden" value={type} />
          <label className="label">
            Email
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
          <button className="button button-primary" type="submit">
            Verify and continue
          </button>
        </form>
        <div className="auth-resend">
          <form
            action={
              type === "recovery"
                ? requestPasswordReset
                : type === "signup" || type === "activation"
                  ? resendSignupOtp
                  : requestLoginOtp
            }
          >
            <input name="email" type="hidden" value={email} />
            <ResendButton key={`${email}:${params?.message ?? ""}`} disabled={!email} />
          </form>
          <Link className="button button-secondary" href="/forgot-password">
            Forgot password
          </Link>
        </div>
      </AuthCard>
    </div>
  );
}
