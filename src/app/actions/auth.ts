"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkNewPassword } from "@/lib/password-strength";
import { createAndSendOtp, consumeOtp } from "@/lib/app-auth/otp";
import { hashPassword, verifyPassword } from "@/lib/app-auth/crypto";
import { issueToken, revokeAllSessions, revokeToken, tokenAccount } from "@/lib/app-auth/session";
import { AuthEmailStageError, authEmailDiagnostic } from "@/lib/email/failure";
import { consumeAuthEmailLimit } from "@/lib/email/rate-limit";
import type { UserRole } from "@/lib/types";
import { validOtp } from "@/lib/app-auth/otp-code";
import { consumePasswordLoginLimit } from "@/lib/app-auth/password-rate-limit";
import { existingEmailError, type ExistingEmailPurpose } from "@/lib/app-auth/email-eligibility";
import { getCurrentAccount } from "@/lib/auth";
import { nextAccountPath } from "@/lib/onboarding";

export type AuthFormState = { error: string };
type Purpose = "signup" | "activation" | "login" | "recovery";
const roles: UserRole[] = ["organizer", "agency", "exhibitor", "talent"];
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
async function rateLimit(email: string) {
  try { const result = await consumeAuthEmailLimit(email); return result.allowed ? null : `Please wait ${result.retry_after_seconds} seconds before requesting another code.`; }
  catch (error) { log("auth_rate_limit_failed", error); return authUnavailable; }
}
async function account(email: string) {
  const { data, error } = await db().from("app_accounts").select("id,email,password_hash,email_verified_at").eq("email",email).maybeSingle();
  if (error) throw new AuthEmailStageError("account_lookup", ["PGRST205","42P01"].includes(error.code) ? "migration_missing" : "database_error");
  return data;
}
async function sendExisting(data: FormData, purpose: ExistingEmailPurpose): Promise<AuthFormState> {
  const email = emailOf(data);
  if (!isEmail(email)) return {error:"Enter a valid email address."};
  let found: Awaited<ReturnType<typeof account>>;
  try { found = await account(email); }
  catch (error) { log("auth_email_account_lookup_failed", error); return {error:authUnavailable}; }
  const eligibilityError = existingEmailError(purpose, found);
  if (eligibilityError) return {error:eligibilityError};
  const limited = await rateLimit(email); if (limited) return {error:limited};
  try {
    await createAndSendOtp(found!.id,email,purpose);
  } catch (error) { log("auth_email_send_failed",error); return {error:sendFailed}; }
  redirect(url("/verify-otp",codeSentMessage,{email,type:purpose === "login" ? "magiclink" : purpose}));
}

export async function signUpWithEmailVerification(_state:AuthFormState,data:FormData):Promise<AuthFormState> {
  const email=emailOf(data), fullName=String(data.get("full_name")??"").trim(), password=String(data.get("password")??"");
  const role=String(data.get("role")??"talent") as UserRole;
  if(fullName.length<2||fullName.length>160)return {error:"Enter your full name."};
  if(!isEmail(email))return {error:"Enter a valid email address."};
  const strength=checkNewPassword(password); if(!strength.strong)return {error:strength.reason};
  if(!roles.includes(role))return {error:"Choose a valid account type."};
  let found: Awaited<ReturnType<typeof account>>;
  try { found=await account(email); }
  catch(error){log("signup_account_lookup_failed",error);return {error:authUnavailable};}
  if(found?.email_verified_at)redirect("/login?message=account-exists");
  const limited=await rateLimit(email); if(limited)return {error:limited};
  let purpose:Purpose="signup";
  try {
    if(!found){
      const hashed=await hashPassword(password);
      const {data:created,error}=await db().from("app_accounts").insert({email,password_hash:hashed}).select("id").single();
      if(error||!created)throw new AuthEmailStageError("otp_store","database_error");
      found={id:created.id,email,password_hash:hashed,email_verified_at:null};
      const {error:profileError}=await db().from("profiles").insert({id:found.id,full_name:fullName,role});
      if(profileError){await db().from("app_accounts").delete().eq("id",found.id);throw new AuthEmailStageError("otp_store","database_error");}
      if(role==="talent"){
        const {error:talentError}=await db().from("talent_profiles").insert({profile_id:found.id});
        const {error:reputationError}=await db().from("profile_reputation").upsert({profile_id:found.id,role:"talent"});
        if(talentError||reputationError){await db().from("app_accounts").delete().eq("id",found.id);throw new AuthEmailStageError("otp_store","database_error");}
      }
    } else {
      purpose="activation";
      const {data:pendingProfile,error:pendingError}=await db().from("profiles").select("role").eq("id",found.id).maybeSingle();
      if(pendingError||!pendingProfile)throw new AuthEmailStageError("otp_store","database_error");
      if(pendingProfile.role!==role)return {error:"A signup for this email is pending with a different account type. Use the activation code or contact support."};
      const hashed=await hashPassword(password);
      const {error:passwordError}=await db().from("app_accounts").update({password_hash:hashed}).eq("id",found.id);
      if(passwordError)throw new AuthEmailStageError("otp_store","database_error");
    }
    await createAndSendOtp(found.id,email,purpose);
  } catch(error){log("signup_email_send_failed",error);return {error:sendFailed};}
  redirect(url("/verify-otp",codeSentMessage,{email,type:purpose}));
}

export async function signInWithPassword(_state:AuthFormState,data:FormData):Promise<AuthFormState>{
  const email=emailOf(data), password=String(data.get("password")??"");
  let accountId = "";
  if(!isEmail(email))return {error:"Enter a valid email address."};
  if(!password)return {error:"Enter your password."};
  try {
    const limit=await consumePasswordLoginLimit(email);
    if(!limit.allowed)return {error:`Too many password login attempts. Try again in ${limit.retry_after_seconds} seconds.`};
    const found=await account(email);
    if(!found||!found.email_verified_at||!await verifyPassword(password,found.password_hash))return {error:"Invalid email or password."};
    await issueToken(found.id,"session");
    accountId = found.id;
  } catch(error){log("password_login_failed",error);return {error:"Login is temporarily unavailable."};}
  redirect(await nextAccountPath(accountId));
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
  try {
    const found=await account(email);
    if(!found||!await consumeOtp(found.id,purpose,code))return {error:codeFailed};
    verifiedAccountId = found.id;
    if(purpose==="signup"||purpose==="activation"){
      const {error}=await db().from("app_accounts").update({email_verified_at:new Date().toISOString()}).eq("id",found.id);
      if(error)throw new Error("Activation failed.");
      await issueToken(found.id,"session");
    }else if(purpose==="login")await issueToken(found.id,"session");
    else await issueToken(found.id,"reset");
  }catch(error){log("otp_verification_failed",error);return {error:"Verification is temporarily unavailable."};}
  if(purpose==="recovery")redirect("/reset-password");
  if(purpose==="signup"||purpose==="activation"){
    redirect(await nextAccountPath(verifiedAccountId));
  }
  redirect(await nextAccountPath(verifiedAccountId));
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
