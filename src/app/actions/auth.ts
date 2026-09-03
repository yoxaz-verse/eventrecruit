"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

const roles: UserRole[] = ["admin", "agency", "exhibitor", "talent"];
const otpTypes = ["signup", "email", "magiclink", "recovery"] as const;

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

function cleanEmail(formData: FormData) {
  return String(formData.get("email") ?? "").trim().toLowerCase();
}

function isEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function messageUrl(path: string, message: string, extra?: Record<string, string>) {
  const params = new URLSearchParams({ message, ...extra });
  return `${path}?${params.toString()}`;
}

export async function signInWithPassword(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login?message=configure-supabase");

  const email = cleanEmail(formData);
  const password = String(formData.get("password") ?? "");

  if (!isEmail(email)) redirect(messageUrl("/login", "Enter a valid email address."));
  if (password.length < 8) redirect(messageUrl("/login", "Password must be at least 8 characters."));

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(`/login?message=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export async function requestLoginOtp(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login?mode=otp&message=configure-supabase");

  const email = cleanEmail(formData);
  if (!isEmail(email)) redirect(messageUrl("/login", "Enter a valid email address.", { mode: "otp" }));

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${appUrl()}/auth/callback?next=/dashboard`,
    },
  });

  if (error) redirect(messageUrl("/login", error.message, { mode: "otp" }));
  redirect(messageUrl("/verify-otp", "We sent an OTP to your email.", { email, type: "email" }));
}

export async function verifyEmailOtp(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/verify-otp?message=configure-supabase");

  const email = cleanEmail(formData);
  const token = String(formData.get("token") ?? "").replace(/\s/g, "");
  const type = String(formData.get("type") ?? "email");

  if (!isEmail(email)) redirect(messageUrl("/verify-otp", "Enter a valid email address.", { type }));
  if (!/^\d{6}$/.test(token)) {
    redirect(messageUrl("/verify-otp", "Enter the 6 digit OTP code.", { email, type }));
  }
  if (!otpTypes.includes(type as (typeof otpTypes)[number])) {
    redirect(messageUrl("/verify-otp", "Invalid OTP type.", { email }));
  }

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: type as (typeof otpTypes)[number],
  });

  if (error) redirect(messageUrl("/verify-otp", error.message, { email, type }));
  if (type === "signup") redirect("/onboarding");
  if (type === "recovery") redirect("/reset-password");
  redirect("/dashboard");
}

export async function resendSignupOtp(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/verify-otp?type=signup&message=configure-supabase");

  const email = cleanEmail(formData);
  if (!isEmail(email)) redirect(messageUrl("/verify-otp", "Enter a valid email address.", { type: "signup" }));

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${appUrl()}/auth/callback?next=/onboarding`,
    },
  });

  if (error) redirect(messageUrl("/verify-otp", error.message, { email, type: "signup" }));
  redirect(messageUrl("/verify-otp", "We sent another signup verification code.", { email, type: "signup" }));
}

export async function signUpWithEmailVerification(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/signup?message=configure-supabase");

  const fullName = String(formData.get("full_name") ?? "");
  const email = cleanEmail(formData);
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "talent") as UserRole;

  if (fullName.trim().length < 2) redirect(messageUrl("/signup", "Enter your full name."));
  if (!isEmail(email)) redirect(messageUrl("/signup", "Enter a valid email address."));
  if (password.length < 8) redirect(messageUrl("/signup", "Password must be at least 8 characters."));
  if (!roles.includes(role)) redirect(messageUrl("/signup", "Choose a valid account type."));

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl()}/auth/callback?next=/onboarding`,
      data: {
        full_name: fullName.trim(),
        role,
      },
    },
  });

  if (error) redirect(`/signup?message=${encodeURIComponent(error.message)}`);
  redirect(messageUrl("/verify-otp", "Check your email for the verification OTP or magic link.", {
    email,
    type: "signup",
  }));
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/forgot-password?message=configure-supabase");

  const email = cleanEmail(formData);
  if (!isEmail(email)) redirect(messageUrl("/forgot-password", "Enter a valid email address."));

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl()}/auth/callback?next=/reset-password`,
  });

  if (error) redirect(messageUrl("/forgot-password", error.message));
  redirect(messageUrl("/verify-otp", "We sent password recovery instructions to your email.", {
    email,
    type: "recovery",
  }));
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/reset-password?message=configure-supabase");

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) redirect(messageUrl("/reset-password", "Password must be at least 8 characters."));
  if (password !== confirmPassword) redirect(messageUrl("/reset-password", "Passwords do not match."));

  const { error } = await supabase.auth.updateUser({ password });

  if (error) redirect(messageUrl("/reset-password", error.message));
  redirect(messageUrl("/login", "Password updated. Log in with your new password."));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/");
}
