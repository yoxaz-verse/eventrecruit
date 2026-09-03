import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthMessage } from "@/components/auth/auth-message";
import { TopNav } from "@/components/top-nav";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="shell">
      <TopNav />
      <AuthCard
        badge="Account recovery"
        title="Reset your password"
        description="Enter your account email. We will send an OTP and recovery link to confirm ownership."
      >
        <AuthMessage message={params?.message} />
        <form action={requestPasswordReset} className="grid gap-4">
          <label className="label">
            Email
            <input autoComplete="email" className="input" name="email" required type="email" />
          </label>
          <button className="button button-primary" type="submit">
            Send recovery email
          </button>
        </form>
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
