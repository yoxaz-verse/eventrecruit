import "server-only";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateToken, tokenHash } from "./crypto";

const sessionCookie = "expo_session";
const resetCookie = "expo_reset";
const sessionAge = 60 * 60 * 24 * 14;

function db() {
  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured.");
  return client;
}

async function setTokenCookie(name: string, token: string, age: number) {
  (await cookies()).set(name, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: age,
  });
}

export async function issueToken(accountId: string, purpose: "session" | "reset") {
  const { data: account } = await db().from("app_accounts").select("id").eq("id", accountId).is("disabled_at", null).maybeSingle();
  if (!account) throw new Error("This account is disabled.");
  const token = generateToken();
  const age = purpose === "session" ? sessionAge : 600;
  const { error } = await db().from("app_sessions").insert({
    token_hash: tokenHash(token), account_id: accountId, purpose,
    expires_at: new Date(Date.now() + age * 1000).toISOString(),
  });
  if (error) throw new Error("Unable to create a session.");
  await setTokenCookie(purpose === "session" ? sessionCookie : resetCookie, token, age);
}

export async function tokenAccount(purpose: "session" | "reset") {
  const token = (await cookies()).get(purpose === "session" ? sessionCookie : resetCookie)?.value;
  if (!token) return null;
  const { data, error } = await db().from("app_sessions")
    .select("account_id,app_accounts(id,email,email_verified_at,disabled_at)")
    .eq("token_hash", tokenHash(token)).eq("purpose", purpose)
    .gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error || !data) return null;
  const account = Array.isArray(data.app_accounts) ? data.app_accounts[0] : data.app_accounts;
  return account && !account.disabled_at ? account : null;
}

export async function revokeToken(purpose: "session" | "reset") {
  const name = purpose === "session" ? sessionCookie : resetCookie;
  const token = (await cookies()).get(name)?.value;
  if (token) await db().from("app_sessions").delete().eq("token_hash", tokenHash(token));
  (await cookies()).delete(name);
}

export async function revokeAllSessions(accountId: string) {
  await db().from("app_sessions").delete().eq("account_id", accountId);
}
