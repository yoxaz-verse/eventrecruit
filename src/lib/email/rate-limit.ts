import "server-only";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { digest } from "@/lib/app-auth/crypto";
import { AuthEmailStageError } from "./failure";
import { classifyRateLimitFailure } from "./rate-limit-failure";

type RateLimitResult = { allowed: boolean; retry_after_seconds: number };

export async function getRequestIpHash() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-vercel-forwarded-for")
    || requestHeaders.get("x-forwarded-for")
    || requestHeaders.get("x-real-ip");
  return digest(forwarded?.split(",")[0]?.trim() || "unknown");
}

export function emailHash(email: string) {
  return digest(email.trim().toLowerCase());
}

export async function consumeAuthEmailLimit(email: string) {
  const admin = createAdminClient();
  if (!admin) {
    throw new AuthEmailStageError("rate_limit", "database_configuration_missing");
  }

  if (!process.env.APP_AUTH_SECRET || process.env.APP_AUTH_SECRET.length < 32) {
    throw new AuthEmailStageError("rate_limit", "auth_secret_missing");
  }

  let hashes: { p_email_hash: string; p_ip_hash: string };
  try {
    hashes = { p_email_hash: emailHash(email), p_ip_hash: await getRequestIpHash() };
  } catch {
    throw new AuthEmailStageError("rate_limit", "request_context_failed");
  }

  let data: unknown;
  try {
    const result = await admin.rpc("consume_auth_email_rate_limit", hashes);
    if (result.error) throw result.error;
    data = result.data;
  } catch (error) {
    throw classifyRateLimitFailure(error);
  }

  if (!data || typeof data !== "object" || Array.isArray(data) ||
      typeof (data as RateLimitResult).allowed !== "boolean" ||
      !Number.isFinite((data as RateLimitResult).retry_after_seconds) ||
      (data as RateLimitResult).retry_after_seconds < 0) {
    throw new AuthEmailStageError("rate_limit", "invalid_database_response");
  }

  return data as RateLimitResult;
}
