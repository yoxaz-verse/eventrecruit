import Link from "next/link";
import { requestLoginOtp, signInWithPassword } from "@/app/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthMessage } from "@/components/auth/auth-message";
import { LoginTabs } from "@/components/auth/login-tabs";
import { PasswordField } from "@/components/auth/password-field";
import { TopNav } from "@/components/top-nav";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const mode = params?.mode === "otp" ? "otp" : "password";

  return (
    <div className="shell">
      <TopNav />
      <AuthCard
        badge="Secure access"
        title="Log in to EventRecruit"
        description="Use your password or request a one-time code sent to your verified email."
        footer={{ text: "New here?", href: "/signup", label: "Create account" }}
      >
        <LoginTabs mode={mode} />
        <AuthMessage message={params?.message} />
        {mode === "password" ? (
          <form action={signInWithPassword} className="grid gap-4">
          <label className="label">
            Email
              <input autoComplete="email" className="input" name="email" required type="email" />
          </label>
            <PasswordField />
          <button className="button button-primary" type="submit">
            Log in
          </button>
            <Link className="text-sm font-bold text-[var(--accent)]" href="/forgot-password">
              Forgot password?
            </Link>
        </form>
        ) : (
          <form action={requestLoginOtp} className="grid gap-4">
            <label className="label">
              Email
              <input autoComplete="email" className="input" name="email" required type="email" />
            </label>
            <button className="button button-primary" type="submit">
              Send OTP
            </button>
            <p className="text-sm text-[var(--muted)]">
              OTP login works only for existing accounts, so unknown emails are not auto-created.
            </p>
          </form>
        )}
      </AuthCard>
    </div>
  );
}
