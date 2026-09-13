"use server";

import { redirect } from "next/navigation";
import { sendAuthEmail } from "@/lib/email/send-auth-email";
import type { AuthEmailPurpose } from "@/lib/email/message";
import { sendSignupCode } from "@/lib/email/signup-code";
import { authAccountExists, consumeAuthEmailLimit } from "@/lib/email/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { checkNewPassword } from "@/lib/password-strength";
import type { UserRole } from "@/lib/types";

const roles: UserRole[] = ["organizer", "agency", "exhibitor", "talent"];
const genericRequestMessage = "If the account is eligible, check your inbox and spam folder for a code. If it does not arrive, wait a minute and request another. If it keeps failing, contact support.";
const emailSendFailedMessage = "We could not send a verification code right now. Please try again in a minute.";
type VerifyPageType = "signup" | "activation" | "magiclink" | "recovery";

function cleanEmail(formData: FormData) {
  return String(formData.get("email") ?? "").trim().toLowerCase();
}

function isEmail(email: string) {
  return email.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email);
}

function messageUrl(path: string, message: string, extra?: Record<string, string>) {
  return `${path}?${new URLSearchParams({ message, ...extra }).toString()}`;
}

function safeLog(event: string, error?: unknown) {
  const record: Record<string, string | number> = { event };
  if (error && typeof error === "object") {
    const candidate = error as { code?: unknown; name?: unknown; status?: unknown };
    if (typeof candidate.name === "string") record.error_type = candidate.name;
    if (typeof candidate.code === "string" && /^[A-Z0-9_]+$/i.test(candidate.code)) record.error_code = candidate.code;
    if (typeof candidate.status === "number") record.status = candidate.status;
  }
  console.error(JSON.stringify(record));
}

async function enforceEmailLimit(email: string, returnPath: string, extra?: Record<string, string>) {
  let result: Awaited<ReturnType<typeof consumeAuthEmailLimit>>;
  try {
    result = await consumeAuthEmailLimit(email);
  } catch (error) {
    safeLog("auth_email_rate_limit_failed", error);
    redirect(messageUrl(returnPath, "Email verification is temporarily unavailable. Please try again shortly.", extra));
  }

  if (!result.allowed) {
    redirect(messageUrl(returnPath, `Please wait ${result.retry_after_seconds} seconds before requesting another code.`, extra));
  }
}

async function generateAndSendCode(
  email: string,
  purpose: AuthEmailPurpose,
  linkType: "magiclink" | "recovery",
) {
  const admin = createAdminClient();
  if (!admin) throw Object.assign(new Error("Auth email configuration is incomplete."), { code: "AUTH_EMAIL_CONFIGURATION" });

  const { data, error } = await admin.auth.admin.generateLink({
    type: linkType,
    email,
    options: { redirectTo: `${getAppUrl()}/login` },
  });
  if (error || !data.properties?.email_otp) {
    throw error ?? Object.assign(new Error("Supabase did not return an OTP."), { code: "SUPABASE_OTP_MISSING" });
  }
  await sendAuthEmail(email, data.properties.email_otp, purpose);
}

async function requestExistingAccountCode(
  formData: FormData,
  options: {
    linkType: "magiclink" | "recovery";
    purpose: AuthEmailPurpose;
    returnPath: "/login" | "/forgot-password" | "/verify-otp";
    verifyType: VerifyPageType;
  },
) {
  const email = cleanEmail(formData);
  const extra = options.returnPath === "/login" ? { mode: "otp" } : undefined;
  if (!isEmail(email)) redirect(messageUrl(options.returnPath, "Enter a valid email address.", extra));

  await enforceEmailLimit(email, options.returnPath, extra);
  let accountExists: boolean;
  try {
    accountExists = await authAccountExists(email);
  } catch (error) {
    safeLog("auth_email_lookup_failed", error);
    redirect(messageUrl(options.returnPath, "Email verification is temporarily unavailable. Please try again shortly.", extra));
  }

  if (!accountExists) {
    redirect(messageUrl("/verify-otp", genericRequestMessage, { email, type: options.verifyType }));
  }

  try {
    await generateAndSendCode(email, options.purpose, options.linkType);
  } catch (error) {
    safeLog("auth_email_send_failed", error);
    redirect(messageUrl("/verify-otp", emailSendFailedMessage, { email, type: options.verifyType }));
  }

  redirect(messageUrl("/verify-otp", genericRequestMessage, {
    email,
    type: options.verifyType,
  }));
}

export async function signInWithPassword(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login?message=configure-supabase");
  const email = cleanEmail(formData);
  const password = String(formData.get("password") ?? "");
  if (!isEmail(email)) redirect(messageUrl("/login", "Enter a valid email address."));
  if (!password) redirect(messageUrl("/login", "Enter your password."));

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(messageUrl("/login", "Invalid email or password."));
  redirect("/dashboard");
}

export async function requestLoginOtp(formData: FormData) {
  return requestExistingAccountCode(formData, { linkType: "magiclink", purpose: "login", returnPath: "/login", verifyType: "magiclink" });
}

export async function resendSignupOtp(formData: FormData) {
  return requestExistingAccountCode(formData, { linkType: "magiclink", purpose: "activation", returnPath: "/verify-otp", verifyType: "activation" });
}

export async function requestPasswordReset(formData: FormData) {
  return requestExistingAccountCode(formData, { linkType: "recovery", purpose: "recovery", returnPath: "/forgot-password", verifyType: "recovery" });
}

export async function signUpWithEmailVerification(formData: FormData) {
  const email = cleanEmail(formData);
  const fullName = String(formData.get("full_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "talent") as UserRole;

  if (fullName.length < 2 || fullName.length > 160) redirect(messageUrl("/signup", "Enter your full name."));
  if (!isEmail(email)) redirect(messageUrl("/signup", "Enter a valid email address."));
  const passwordCheck = checkNewPassword(password);
  if (!passwordCheck.strong) redirect(messageUrl("/signup", passwordCheck.reason));
  if (!roles.includes(role)) redirect(messageUrl("/signup", "Choose a valid account type."));

  await enforceEmailLimit(email, "/signup");
  const admin = createAdminClient();
  if (!admin) redirect(messageUrl("/signup", "Email verification is not configured for this deployment."));

  let verifyType: "signup" | "activation";
  try {
    verifyType = await sendSignupCode(
      () => admin.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: { data: { full_name: fullName, role }, redirectTo: `${getAppUrl()}/login` },
      }),
      (code) => sendAuthEmail(email, code, "signup"),
      () => generateAndSendCode(email, "activation", "magiclink"),
    );
  } catch (error) {
    safeLog("signup_email_send_failed", error);
    redirect(messageUrl("/verify-otp", emailSendFailedMessage, { email, type: "signup" }));
  }

  redirect(messageUrl("/verify-otp", genericRequestMessage, { email, type: verifyType }));
}

export async function verifyEmailOtp(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/verify-otp?message=configure-supabase");
  const email = cleanEmail(formData);
  const token = String(formData.get("token") ?? "").replace(/\s/g, "");
  const pageType = String(formData.get("type") ?? "magiclink") as VerifyPageType;
  const verifyTypes: Record<VerifyPageType, "signup" | "magiclink" | "recovery"> = {
    signup: "signup",
    activation: "magiclink",
    magiclink: "magiclink",
    recovery: "recovery",
  };

  if (!isEmail(email)) redirect(messageUrl("/verify-otp", "Enter a valid email address.", { type: pageType }));
  if (!/^\d{6}$/.test(token)) redirect(messageUrl("/verify-otp", "Enter the 6 digit OTP code.", { email, type: pageType }));
  if (!verifyTypes[pageType]) redirect(messageUrl("/verify-otp", "Invalid OTP type.", { email }));

  const { error } = await supabase.auth.verifyOtp({ email, token, type: verifyTypes[pageType] });
  if (error) redirect(messageUrl("/verify-otp", "The code is invalid or has expired. Request a new code and try again.", { email, type: pageType }));
  if (pageType === "signup" || pageType === "activation") redirect("/onboarding");
  if (pageType === "recovery") redirect("/reset-password");
  redirect("/dashboard");
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/reset-password?message=configure-supabase");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const passwordCheck = checkNewPassword(password);
  if (!passwordCheck.strong) redirect(messageUrl("/reset-password", passwordCheck.reason));
  if (password !== confirmPassword) redirect(messageUrl("/reset-password", "Passwords do not match."));

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(messageUrl("/reset-password", error.message));
  await supabase.auth.signOut();
  redirect(messageUrl("/login", "Password updated. Log in with your new password."));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/");
}
