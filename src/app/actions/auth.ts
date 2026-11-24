"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkNewPassword } from "@/lib/password-strength";
import { hashPassword, verifyPassword } from "@/lib/app-auth/crypto";
import { commitSessionCookie, issueTokenForVerifiedAccount, prepareSessionToken, revokeAllSessions, revokeToken, tokenAccount } from "@/lib/app-auth/session";
import { AuthEmailStageError, authEmailDiagnostic } from "@/lib/email/failure";
import type { UserRole } from "@/lib/types";
import { validOtp } from "@/lib/app-auth/otp-code";
import { consumePasswordLoginLimit } from "@/lib/app-auth/password-rate-limit";
import type { ExistingEmailPurpose } from "@/lib/app-auth/email-eligibility";
import { getCurrentAccount } from "@/lib/auth";
import { nextAccountPath, onboardingPath } from "@/lib/onboarding";
import { prepareExistingOtp, prepareSignupOtp, sendPreparedOtp, verifyPreparedOtp } from "@/lib/app-auth/otp-preparation";
import { createAuthPerformance } from "@/lib/app-auth/performance";

export type AuthFormState = { error: string };
type Purpose = "signup" | "activation" | "login" | "recovery";
const roles: UserRole[] = ["organizer", "agency", "sponsor_agency", "exhibitor", "talent"];
const codeSentMessage = "We sent a code. Check your inbox and spam folder.";
const sendFailed = "We could not send a verification code right now. Please try again in a minute.";
const authUnavailable = "Authentication is temporarily unavailable. Please try again later.";
const codeFailed = "The code is invalid or has expired. Request a new code and try again.";
function db() { const client = createAdminClient(); if (!client) throw new Error("Database is not configured."); return client; }
function emailOf(data: FormData) { return String(data.get("email") ?? "").trim().toLowerCase(); }
function isEmail(email: string) { return email.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email); }
function url(path: string, message: string, extra?: Record<string,string>) { return `${path}?${new URLSearchParams({message,...extra})}`; }
function log(event: string, error: unknown) {
  const diagnostic = error instanceof AuthEmailStageError ? authEmailDiagnostic(error) : { stage: "unexpected", category: "service_error" };
  console.error(JSON.stringify({event, request_id: randomUUID(), ...(diagnostic.stage === "smtp_delivery" ? {transport:"mxroute_https_api"} : {}), ...diagnostic}));
}
async function account(email: string, client = db()) {
  const { data, error } = await client.from("app_accounts").select("id,email,password_hash,email_verified_at,disabled_at").eq("email",email).maybeSingle();
  if (error) throw new AuthEmailStageError("account_lookup", ["PGRST205","42P01"].includes(error.code) ? "migration_missing" : "database_error");
  return data;
}
async function sendExisting(data: FormData, purpose: ExistingEmailPurpose): Promise<AuthFormState> {
  const email = emailOf(data);
  if (!isEmail(email)) return {error:"Enter a valid email address."};
  const timing = createAuthPerformance(`otp_${purpose}`);
  const client = createAdminClient();
  if (!client) { timing.finish("unavailable"); return {error:authUnavailable}; }
  try {
    const { prepared, code } = await timing.measure("database_preparation", () => prepareExistingOtp(client, email, purpose));
    if (prepared.status !== "ready") {
      timing.finish(prepared.status);
      if (prepared.status === "not_registered") return {error:"This email is not registered. Create an account to continue."};
      if (prepared.status === "disabled") return {error:"This account is disabled. Contact support for help."};
      if (prepared.status === "already_verified") return {error:"This account is already verified. Log in instead."};
      if (prepared.status === "not_verified") return {error:"This account is not verified yet. Complete signup verification first."};
      if (prepared.status === "rate_limited") return {error:`Please wait ${prepared.retry_after_seconds ?? 60} seconds before requesting another code.`};
      return {error:authUnavailable};
    }
    await timing.measure("email_delivery", () => sendPreparedOtp(client, prepared, email, code));
    timing.finish("sent");
  } catch (error) { timing.finish("failed"); log("auth_email_send_failed",error); return {error:sendFailed}; }
  redirect(url("/verify-otp",codeSentMessage,{email,type:purpose === "login" ? "magiclink" : purpose}));
}

export async function signUpWithEmailVerification(_state:AuthFormState,data:FormData):Promise<AuthFormState> {
  const email=emailOf(data), fullName=String(data.get("full_name")??"").trim(), password=String(data.get("password")??"");
  const role=String(data.get("role")??"talent") as UserRole;
  if(fullName.length<2||fullName.length>160)return {error:"Enter your full name."};
  if(!isEmail(email))return {error:"Enter a valid email address."};
  const strength=checkNewPassword(password); if(!strength.strong)return {error:strength.reason};
  if(!roles.includes(role))return {error:"Choose a valid account type."};
  const timing = createAuthPerformance("signup");
  const client = createAdminClient();
  if (!client) { timing.finish("unavailable"); return {error:authUnavailable}; }
  let purpose: Purpose = "signup";
  let accountExists = false;
  try {
    const hashed = await timing.measure("password_hash", () => hashPassword(password));
    const { prepared, code } = await timing.measure("database_preparation", () => prepareSignupOtp(client, {email,passwordHash:hashed,fullName,role}));
    if (prepared.status === "already_verified") {
      accountExists = true;
      timing.finish("already_verified");
    } else if (prepared.status !== "created" && prepared.status !== "activation") {
      timing.finish(prepared.status);
      if (prepared.status === "disabled") return {error:"This account is disabled. Contact support for help."};
      if (prepared.status === "role_conflict") return {error:"A signup for this email is pending with a different account type. Use the activation code or contact support."};
      if (prepared.status === "rate_limited") return {error:`Please wait ${prepared.retry_after_seconds ?? 60} seconds before requesting another code.`};
      return {error:authUnavailable};
    } else {
      purpose = prepared.purpose === "activation" ? "activation" : "signup";
      await timing.measure("email_delivery", () => sendPreparedOtp(client, prepared, email, code));
      timing.finish(prepared.status);
    }
  } catch(error){timing.finish("failed");log("signup_email_send_failed",error);return {error:sendFailed};}
  if (accountExists) redirect("/login?message=account-exists");
  redirect(url("/verify-otp",codeSentMessage,{email,type:purpose}));
}

export async function signInWithPassword(_state:AuthFormState,data:FormData):Promise<AuthFormState>{
  const email=emailOf(data), password=String(data.get("password")??"");
  let accountId = "";
  if(!isEmail(email))return {error:"Enter a valid email address."};
  if(!password)return {error:"Enter your password."};
  const timing = createAuthPerformance("password_login");
  const client = createAdminClient();
  if (!client) { timing.finish("unavailable"); return {error:"Login is temporarily unavailable."}; }
  try {
    const limit=await timing.measure("rate_limit", () => consumePasswordLoginLimit(email, client));
    if(!limit.allowed){timing.finish("rate_limited");return {error:`Too many password login attempts. Try again in ${limit.retry_after_seconds} seconds.`};}
    const found=await timing.measure("account_lookup", () => account(email, client));
    if(found?.disabled_at){timing.finish("disabled");return {error:"This account is disabled. Contact support for help."};}
    if(!found||!found.email_verified_at||!await timing.measure("password_verify", () => verifyPassword(password,found.password_hash))){timing.finish("invalid");return {error:"Invalid email or password."};}
    await timing.measure("session_creation", () => issueTokenForVerifiedAccount(found.id,"session",client));
    accountId = found.id;
  } catch(error){timing.finish("failed");log("password_login_failed",error);return {error:"Login is temporarily unavailable."};}
  const destination = await timing.measure("destination_resolution", () => nextAccountPath(accountId));
  timing.finish("signed_in");
  redirect(destination);
}
export async function requestLoginOtp(_state:AuthFormState,data:FormData){return sendExisting(data,"login");}
export async function resendLoginOtp(_state:AuthFormState,data:FormData){return sendExisting(data,"login");}
export async function resendSignupOtp(_state:AuthFormState,data:FormData){return sendExisting(data,"activation");}
export async function resendRecoveryOtp(_state:AuthFormState,data:FormData){return sendExisting(data,"recovery");}
export async function requestPasswordReset(_state:AuthFormState,data:FormData){return sendExisting(data,"recovery");}

export async function verifyEmailOtp(_state:AuthFormState,data:FormData):Promise<AuthFormState>{
  const current = await getCurrentAccount();
  if (current) redirect(await nextAccountPath(current.id));
  const email=emailOf(data),code=String(data.get("token")??"").replace(/\s/g,"");
  let verifiedAccountId = "";
  const type=String(data.get("type")??""),purpose:Purpose=type==="magiclink"?"login":type as Purpose;
  if(!isEmail(email))return {error:"Enter a valid email address."};
  if(!validOtp(code))return {error:"Enter the 6 digit OTP code."};
  if(!["signup","activation","login","recovery"].includes(purpose))return {error:"Invalid OTP type."};
  const timing = createAuthPerformance("otp_verification");
  const client = createAdminClient();
  if (!client) { timing.finish("unavailable"); return {error:"Verification is temporarily unavailable."}; }
  let verifiedRole: UserRole | undefined;
  try {
    const found=await timing.measure("account_lookup", () => account(email, client));
    if(!found) { timing.finish("invalid"); return {error:codeFailed}; }
    verifiedAccountId = found.id;
    const sessionPurpose = purpose === "recovery" ? "reset" : "session";
    const preparedToken = prepareSessionToken(sessionPurpose);
    const verification = await timing.measure("verification_and_session", () => verifyPreparedOtp(client, {
      accountId: found.id,
      email,
      purpose,
      code,
      tokenHash: preparedToken.tokenHash,
      sessionPurpose,
      sessionExpiresAt: preparedToken.expiresAt,
    }));
    if (!verification.verified) { timing.finish("invalid"); return {error:codeFailed}; }
    verifiedRole = verification.role;
    await timing.measure("session_cookie", () => commitSessionCookie(preparedToken));
  }catch(error){timing.finish("failed");log("otp_verification_failed",error);return {error:"Verification is temporarily unavailable."};}
  if(purpose==="recovery") { timing.finish("verified"); redirect("/reset-password"); }
  const destination = (purpose === "signup" || purpose === "activation") && verifiedRole
    ? onboardingPath(verifiedRole)
    : await timing.measure("destination_resolution", () => nextAccountPath(verifiedAccountId));
  timing.finish("verified");
  redirect(destination);
}
export async function updatePassword(_state:AuthFormState,data:FormData):Promise<AuthFormState>{
  const password=String(data.get("password")??""), confirm=String(data.get("confirm_password")??"");
  const strength=checkNewPassword(password); if(!strength.strong)return {error:strength.reason};
  if(password!==confirm)return {error:"Passwords do not match."};
  const found=await tokenAccount("reset"); if(!found)return {error:"Verify a recovery code before updating your password."};
  try {
    const {error}=await db().from("app_accounts").update({password_hash:await hashPassword(password)}).eq("id",found.id);
    if(error)throw new Error("Password update failed.");
    await revokeAllSessions(found.id); await revokeToken("reset");
  }catch(error){log("password_update_failed",error);return {error:"Unable to update your password. Please try again."};}
  redirect(url("/login","Password updated. Log in with your new password."));
}
export async function signOut(){await revokeToken("session");redirect("/");}
