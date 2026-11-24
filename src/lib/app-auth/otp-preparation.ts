import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/types";
import type { AuthEmailPurpose } from "@/lib/email/message";
import { AuthEmailStageError } from "@/lib/email/failure";
import { sendAuthEmail } from "@/lib/email/send-auth-email";
import { digest, generateOtp } from "./crypto";
import { emailHash, getRequestIpHash } from "@/lib/email/rate-limit";

const ttl = 10 * 60 * 1000;

type PreparedOtp = {
  status: string;
  account_id?: string;
  challenge_id?: string;
  purpose?: AuthEmailPurpose;
  role?: UserRole;
  retry_after_seconds?: number;
};

function result(value: unknown): PreparedOtp {
  if (!value || typeof value !== "object" || Array.isArray(value) || typeof (value as PreparedOtp).status !== "string") {
    throw new AuthEmailStageError("otp_store", "invalid_database_response");
  }
  return value as PreparedOtp;
}

function otpHash(email: string, purpose: AuthEmailPurpose, code: string) {
  return digest(`${email}:${purpose}:${code}`);
}

export async function prepareSignupOtp(client: SupabaseClient, input: {
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
}) {
  const code = generateOtp();
  const ipHash = await getRequestIpHash();
  // New accounts use signup; pending accounts use activation. The SQL function
  // chooses the purpose, so provide both digests without exposing the OTP.
  const { data, error } = await client.rpc("prepare_app_signup", {
    p_email: input.email,
    p_email_hash: emailHash(input.email),
    p_ip_hash: ipHash,
    p_password_hash: input.passwordHash,
    p_full_name: input.fullName,
    p_role: input.role,
    p_code_hash: otpHash(input.email, "signup", code),
    p_activation_code_hash: otpHash(input.email, "activation", code),
    p_expires_at: new Date(Date.now() + ttl).toISOString(),
  });
  if (error) throw new AuthEmailStageError("otp_store", ["PGRST202", "42883"].includes(error.code) ? "migration_missing" : "database_error");
  return { prepared: result(data), code };
}

export async function prepareExistingOtp(client: SupabaseClient, email: string, purpose: "activation" | "login" | "recovery") {
  const code = generateOtp();
  const ipHash = await getRequestIpHash();
  const { data, error } = await client.rpc("prepare_existing_app_otp", {
    p_email: email,
    p_email_hash: emailHash(email),
    p_ip_hash: ipHash,
    p_purpose: purpose,
    p_code_hash: otpHash(email, purpose, code),
    p_expires_at: new Date(Date.now() + ttl).toISOString(),
  });
  if (error) throw new AuthEmailStageError("otp_store", ["PGRST202", "42883"].includes(error.code) ? "migration_missing" : "database_error");
  return { prepared: result(data), code };
}

export async function sendPreparedOtp(client: SupabaseClient, prepared: PreparedOtp, email: string, code: string) {
  if (!prepared.challenge_id || !prepared.purpose) throw new AuthEmailStageError("otp_store", "invalid_database_response");
  try { await sendAuthEmail(email, code, prepared.purpose); }
  catch (error) {
    await client.from("app_otp_challenges").update({ consumed_at: new Date().toISOString() }).eq("id", prepared.challenge_id);
    throw error;
  }
}

export function optimizedOtpDigest(email: string, purpose: AuthEmailPurpose, code: string) {
  return otpHash(email, purpose, code);
}

export async function verifyPreparedOtp(client: SupabaseClient, input: {
  accountId: string;
  email: string;
  purpose: AuthEmailPurpose;
  code: string;
  tokenHash: string;
  sessionPurpose: "session" | "reset";
  sessionExpiresAt: string;
}) {
  const { data, error } = await client.rpc("verify_app_otp_and_create_session", {
    p_account: input.accountId,
    p_purpose: input.purpose,
    p_hash: otpHash(input.email, input.purpose, input.code),
    p_legacy_hash: digest(`${input.accountId}:${input.purpose}:${input.code}`),
    p_token_hash: input.tokenHash,
    p_session_purpose: input.sessionPurpose,
    p_session_expires_at: input.sessionExpiresAt,
  });
  if (error) throw new AuthEmailStageError("otp_verify", ["PGRST202", "42883"].includes(error.code) ? "migration_missing" : "database_error");
  if (!data || typeof data !== "object" || Array.isArray(data) || typeof (data as { verified?: unknown }).verified !== "boolean") {
    throw new AuthEmailStageError("otp_verify", "invalid_database_response");
  }
  return data as { verified: boolean; role?: UserRole };
}
