import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { tokenAccount } from "@/lib/app-auth/session";
import type { UserRole } from "@/lib/types";

export async function getCurrentAccount() {
  const account = await tokenAccount("session");
  return account?.email_verified_at ? account : null;
}

export async function getCurrentProfile() {
  const account = await getCurrentAccount();
  if (!account) return null;
  const db = createAdminClient();
  if (!db) return null;
  const {data,error} = await db.from("profiles")
    .select("id,full_name,role,verification_status,avatar_url")
    .eq("id",account.id).maybeSingle();
  return error ? null : data;
}

export async function requireRole(allowed: UserRole[]) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!allowed.includes(profile.role as UserRole)) redirect(`/dashboard/${profile.role}`);
  return profile;
}
