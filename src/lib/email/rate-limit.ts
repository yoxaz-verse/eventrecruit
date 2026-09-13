import "server-only";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { digest } from "@/lib/app-auth/crypto";

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
    throw Object.assign(new Error("Auth email configuration is incomplete."), { code: "AUTH_EMAIL_CONFIGURATION" });
  }

  const { data, error } = await admin.rpc("consume_auth_email_rate_limit", {
    p_email_hash: emailHash(email),
    p_ip_hash: await getRequestIpHash(),
  });

  if (error || !data || typeof data !== "object") {
    throw error ?? Object.assign(new Error("Email rate limiting is unavailable."), { code: "AUTH_EMAIL_RATE_LIMIT_UNAVAILABLE" });
  }

  return data as RateLimitResult;
}
