import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

type RateLimitResult = { allowed: boolean; retry_after_seconds: number };

function digest(value: string) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw Object.assign(new Error("Auth email configuration is incomplete."), { code: "AUTH_EMAIL_CONFIGURATION" });
  }
  return createHmac("sha256", key).update(value).digest("hex");
}

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

export async function authAccountExists(email: string) {
  const admin = createAdminClient();
  if (!admin) {
    throw Object.assign(new Error("Auth email configuration is incomplete."), { code: "AUTH_EMAIL_CONFIGURATION" });
  }

  const { data, error } = await admin.rpc("auth_user_exists", { p_email: email });
  if (error || typeof data !== "boolean") {
    throw error ?? Object.assign(new Error("Auth account lookup is unavailable."), { code: "AUTH_EMAIL_LOOKUP_UNAVAILABLE" });
  }
  return data;
}
