import Link from "next/link";

export function LoginTabs({ mode }: { mode: "password" | "otp" }) {
  return (
    <div className="auth-tabs" role="tablist" aria-label="Login method">
      <Link
        aria-selected={mode === "password"}
        className={mode === "password" ? "auth-tab auth-tab-active" : "auth-tab"}
        href="/login"
        role="tab"
      >
        Password
      </Link>
      <Link
        aria-selected={mode === "otp"}
        className={mode === "otp" ? "auth-tab auth-tab-active" : "auth-tab"}
        href="/login?mode=otp"
        role="tab"
      >
        Email OTP
      </Link>
    </div>
  );
}
