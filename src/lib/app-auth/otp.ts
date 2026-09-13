import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAuthEmail } from "@/lib/email/send-auth-email";
import type { AuthEmailPurpose } from "@/lib/email/message";
import { classifyAuthEmailFailure, AuthEmailStageError } from "@/lib/email/failure";
import { digest, generateOtp } from "./crypto";
import { validOtp } from "./otp-code";

type Purpose = AuthEmailPurpose;
const ttl = 10 * 60 * 1000;

function db() {
  const client = createAdminClient();
  if (!client) throw new AuthEmailStageError("configuration", "database_missing");
  return client;
}

export async function createAndSendOtp(accountId: string, email: string, purpose: Purpose) {
  let code: string;
  try { code = generateOtp(); }
  catch { throw new AuthEmailStageError("otp_generate", "otp_generation_failed"); }

  const { error: invalidateError } = await db().from("app_otp_challenges")
    .update({ consumed_at: new Date().toISOString() })
    .eq("account_id", accountId).is("consumed_at", null);
  if (invalidateError) throw new AuthEmailStageError("otp_store", "database_error");
  const { data, error } = await db().from("app_otp_challenges").insert({
    account_id: accountId, purpose, code_hash: digest(`${accountId}:${purpose}:${code}`),
    expires_at: new Date(Date.now() + ttl).toISOString(),
  }).select("id").single();
  if (error || !data) throw new AuthEmailStageError("otp_store", "database_error");
  try { await sendAuthEmail(email, code, purpose); }
  catch (cause) {
    await db().from("app_otp_challenges").update({ consumed_at: new Date().toISOString() }).eq("id", data.id);
    throw classifyAuthEmailFailure("smtp_delivery", cause);
  }
}

export async function consumeOtp(accountId: string, purpose: Purpose, code: string) {
  if (!validOtp(code)) return false;
  const { data, error } = await db().rpc("consume_app_otp", {
    p_account: accountId, p_purpose: purpose,
    p_hash: digest(`${accountId}:${purpose}:${code}`),
  });
  if (error) throw new AuthEmailStageError("otp_verify", "database_error");
  return data === true;
}
