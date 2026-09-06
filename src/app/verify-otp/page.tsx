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
import { TopNav } from "@/components/top-nav";
import { getSupabaseServerConfig } from "@/lib/supabase/env";

const labels: Record<string, string> = {
  signup: "Verify signup",
  email: "Verify login",
  recovery: "Verify recovery",
  magiclink: "Verify login",
};

export default async function VerifyOtpPage({
  searchParams,
}: {
  searchParams?: Promise<{ email?: string; message?: string; type?: string }>;
}) {
  const params = await searchParams;
  const type = params?.type ?? "email";
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
        description="Enter the 6 digit code sent to your email, or use the magic link in the same message."
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
                : type === "signup"
                  ? resendSignupOtp
                  : requestLoginOtp
            }
          >
            <input name="email" type="hidden" value={email} />
            <button className="button button-secondary" disabled={!email} type="submit">
              Send another code
            </button>
          </form>
          <Link className="button button-secondary" href="/forgot-password">
            Forgot password
          </Link>
        </div>
      </AuthCard>
    </div>
  );
}
