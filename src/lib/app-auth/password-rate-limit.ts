import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { emailHash, getRequestIpHash } from "@/lib/email/rate-limit";

export async function consumePasswordLoginLimit(email: string): Promise<{ allowed: boolean; retry_after_seconds: number }> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Database is not configured.");
  const { data, error } = await admin.rpc("consume_auth_password_rate_limit", {
    p_email_hash: emailHash(email),
    p_ip_hash: await getRequestIpHash(),
  });
  if (error || !data || typeof data.allowed !== "boolean" ||
      !Number.isFinite(data.retry_after_seconds) || data.retry_after_seconds < 0) {
    throw new Error("Password login limit is unavailable.");
  }
  return data;
}
