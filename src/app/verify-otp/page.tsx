import Link from "next/link";
import {
  requestLoginOtp,
  requestPasswordReset,
  resendSignupOtp,
  verifyEmailOtp,
} from "@/app/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthMessage } from "@/components/auth/auth-message";
import { OtpInput } from "@/components/auth/otp-input";
import { TopNav } from "@/components/top-nav";

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

  return (
    <div className="shell">
      <TopNav />
      <AuthCard
        badge="Email OTP"
        title={labels[type] ?? "Verify OTP"}
        description="Enter the 6 digit code sent by Supabase Auth, or use the magic link in the same email."
        footer={{ text: "Already verified?", href: "/login", label: "Return to login" }}
      >
        <AuthMessage message={params?.message} />
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
