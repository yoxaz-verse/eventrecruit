"use server";

import { redirect } from "next/navigation";
import { sendAuthEmail } from "@/lib/email/send-auth-email";
import type { AuthEmailPurpose } from "@/lib/email/message";
import { sendSignupCode } from "@/lib/email/signup-code";
import { atAuthEmailStage, authEmailDiagnostic, AuthEmailStageError, classifyAuthEmailFailure } from "@/lib/email/failure";
import { assertEmailOtp } from "@/lib/email/message";
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
  if (error instanceof AuthEmailStageError) {
    Object.assign(record, authEmailDiagnostic(error));
  } else if (error && typeof error === "object") {
    const candidate = error as { status?: unknown };
    record.category = "service_error";
    if (typeof candidate.status === "number") record.status = candidate.status;
  }
  console.error(JSON.stringify(record));
}

async function enforceEmailLimit(email: string): Promise<string | undefined> {
  let result: Awaited<ReturnType<typeof consumeAuthEmailLimit>>;
  try {
    result = await consumeAuthEmailLimit(email);
  } catch (error) {
    safeLog("auth_email_rate_limit_failed", error);
    return "Email verification is temporarily unavailable. Please try again shortly.";
  }

  if (!result.allowed) {
    return `Please wait ${result.retry_after_seconds} seconds before requesting another code.`;
  }
}

async function generateAndSendCode(
  email: string,
  purpose: AuthEmailPurpose,
  linkType: "magiclink" | "recovery",
) {
  const admin = createAdminClient();
  if (!admin) throw new AuthEmailStageError("configuration", "supabase_admin_missing");

  const redirectTo = `${await atAuthEmailStage("configuration", getAppUrl)}/login`;
  const { data, error } = await atAuthEmailStage("supabase_generate", () => admin.auth.admin.generateLink({
    type: linkType,
    email,
    options: { redirectTo },
  }));
  if (error) await atAuthEmailStage("supabase_generate", () => { throw error; });
  const code = await atAuthEmailStage("otp_validate", () => assertEmailOtp(data?.properties?.email_otp));
  await atAuthEmailStage("smtp_delivery", () => sendAuthEmail(email, code, purpose));
}

async function requestExistingAccountCode(
  formData: FormData,
  options: {
    linkType: "magiclink" | "recovery";
    purpose: AuthEmailPurpose;
    verifyType: VerifyPageType;
  },
): Promise<AuthFormState> {
  const email = cleanEmail(formData);
  if (!isEmail(email)) return { error: "Enter a valid email address." };

  const limitError = await enforceEmailLimit(email);
  if (limitError) return { error: limitError };
  let accountExists: boolean;
  try {
    accountExists = await authAccountExists(email);
  } catch (error) {
    safeLog("auth_email_lookup_failed", error);
    return { error: "Email verification is temporarily unavailable. Please try again shortly." };
  }

  if (!accountExists) {
    redirect(messageUrl("/verify-otp", genericRequestMessage, { email, type: options.verifyType }));
  }

  try {
    await generateAndSendCode(email, options.purpose, options.linkType);
  } catch (error) {
    safeLog("auth_email_send_failed", error);
    return { error: emailSendFailedMessage };
  }

  redirect(messageUrl("/verify-otp", genericRequestMessage, {
    email,
    type: options.verifyType,
  }));
}

export async function signInWithPassword(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const supabase = await createClient();
  if (!supabase) return { error: "Login is temporarily unavailable. Please try again later." };
  const email = cleanEmail(formData);
  const password = String(formData.get("password") ?? "");
  if (!isEmail(email)) return { error: "Enter a valid email address." };
  if (!password) return { error: "Enter your password." };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Invalid email or password." };
  redirect("/dashboard");
}

export async function requestLoginOtp(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  return requestExistingAccountCode(formData, { linkType: "magiclink", purpose: "login", verifyType: "magiclink" });
}

export async function resendSignupOtp(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  return requestExistingAccountCode(formData, { linkType: "magiclink", purpose: "activation", verifyType: "activation" });
}

export async function resendLoginOtp(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  return requestExistingAccountCode(formData, { linkType: "magiclink", purpose: "login", verifyType: "magiclink" });
}

export async function resendRecoveryOtp(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  return requestExistingAccountCode(formData, { linkType: "recovery", purpose: "recovery", verifyType: "recovery" });
}

export async function requestPasswordReset(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  return requestExistingAccountCode(formData, { linkType: "recovery", purpose: "recovery", verifyType: "recovery" });
}

export type AuthFormState = { error: string };

export async function signUpWithEmailVerification(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = cleanEmail(formData);
  const fullName = String(formData.get("full_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "talent") as UserRole;

  if (fullName.length < 2 || fullName.length > 160) return { error: "Enter your full name." };
  if (!isEmail(email)) return { error: "Enter a valid email address." };
  const passwordCheck = checkNewPassword(password);
  if (!passwordCheck.strong) return { error: passwordCheck.reason };
  if (!roles.includes(role)) return { error: "Choose a valid account type." };

  const limitError = await enforceEmailLimit(email);
  if (limitError) return { error: limitError };
  const admin = createAdminClient();
  if (!admin) return { error: "Email verification is not configured for this deployment." };

  let verifyType: "signup" | "activation";
  try {
    const redirectTo = `${await atAuthEmailStage("configuration", getAppUrl)}/login`;
    verifyType = await sendSignupCode(
      () => admin.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: { data: { full_name: fullName, role }, redirectTo },
      }),
      (code) => sendAuthEmail(email, code, "signup"),
      () => generateAndSendCode(email, "activation", "magiclink"),
    );
  } catch (error) {
    safeLog("signup_email_send_failed", error instanceof AuthEmailStageError ? error : classifyAuthEmailFailure("unexpected", error));
    return { error: emailSendFailedMessage };
  }

  redirect(messageUrl("/verify-otp", genericRequestMessage, { email, type: verifyType }));
}

export async function verifyEmailOtp(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const supabase = await createClient();
  if (!supabase) return { error: "Verification is temporarily unavailable. Please try again later." };
  const email = cleanEmail(formData);
  const token = String(formData.get("token") ?? "").replace(/\s/g, "");
  const pageType = String(formData.get("type") ?? "magiclink") as VerifyPageType;
  const verifyTypes: Record<VerifyPageType, "signup" | "magiclink" | "recovery"> = {
    signup: "signup",
    activation: "magiclink",
    magiclink: "magiclink",
    recovery: "recovery",
  };

  if (!isEmail(email)) return { error: "Enter a valid email address." };
  if (!/^\d{6}$/.test(token)) return { error: "Enter the 6 digit OTP code." };
  if (!verifyTypes[pageType]) return { error: "Invalid OTP type." };

  const { error } = await supabase.auth.verifyOtp({ email, token, type: verifyTypes[pageType] });
  if (error) return { error: "The code is invalid or has expired. Request a new code and try again." };
  if (pageType === "signup" || pageType === "activation") redirect("/onboarding");
  if (pageType === "recovery") redirect("/reset-password");
  redirect("/dashboard");
}

export async function updatePassword(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const supabase = await createClient();
  if (!supabase) return { error: "Password update is temporarily unavailable. Please try again later." };
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const passwordCheck = checkNewPassword(password);
  if (!passwordCheck.strong) return { error: passwordCheck.reason };
  if (password !== confirmPassword) return { error: "Passwords do not match." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Unable to update your password. Please verify your recovery code and try again." };
  await supabase.auth.signOut();
  redirect(messageUrl("/login", "Password updated. Log in with your new password."));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/");
}
