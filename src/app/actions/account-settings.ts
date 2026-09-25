"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requestPasswordReset } from "@/app/actions/auth";
import { requireRole } from "@/lib/auth";
import { revokeAllSessions } from "@/lib/app-auth/session";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

const roles: UserRole[] = ["admin", "organizer", "agency", "exhibitor", "talent"];

export async function saveAccountPreferences(data: FormData) {
  const profile = await requireRole(roles);
  const db = await createClient();
  if (!db) throw new Error("Settings are unavailable.");
  const { error } = await db.from("account_notification_preferences").upsert({
    profile_id: profile.id,
    email_notifications: data.get("email_notifications") === "on",
    in_app_notifications: data.get("in_app_notifications") === "on",
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error("Unable to save notification preferences.");
  revalidatePath(`/dashboard/${profile.role}/settings`);
}

export async function beginSignedInPasswordReset(): Promise<void> {
  const profile = await requireRole(roles);
  const db = await createClient();
  if (!db) throw new Error("Account recovery is unavailable.");
  const { data: account } = await db.from("app_accounts").select("email").eq("id", profile.id).maybeSingle();
  if (!account) throw new Error("Account recovery is unavailable.");
  const data = new FormData();
  data.set("email", account.email);
  const result = await requestPasswordReset({ error: "" }, data);
  throw new Error(result.error || "Unable to begin password reset.");
}

export async function requestAccountDeletion(data: FormData) {
  const profile = await requireRole(roles);
  if (data.get("confirm") !== "yes") throw new Error("Confirm that you want to request account deletion.");
  const db = await createClient();
  if (!db) throw new Error("Account controls are unavailable.");
  const { error } = await db.from("account_deletion_requests").insert({ profile_id: profile.id });
  if (error && error.code !== "23505") throw new Error("Unable to submit the deletion request.");
  revalidatePath(`/dashboard/${profile.role}/settings`);
}

export async function cancelAccountDeletion() {
  const profile = await requireRole(roles);
  const db = await createClient();
  if (!db) throw new Error("Account controls are unavailable.");
  const { error } = await db.from("account_deletion_requests").update({ status: "cancelled" }).eq("profile_id", profile.id).eq("status", "pending");
  if (error) throw new Error("Unable to cancel the deletion request.");
  revalidatePath(`/dashboard/${profile.role}/settings`);
}

export async function reviewAccountDeletion(data: FormData) {
  const admin = await requireRole(["admin"]);
  const requestId = String(data.get("request_id") ?? "");
  const decision = String(data.get("decision") ?? "");
  const note = String(data.get("review_note") ?? "").trim().slice(0, 1000);
  if (!/^[0-9a-f-]{36}$/i.test(requestId) || !["approved", "rejected"].includes(decision)) throw new Error("Invalid deletion review.");
  const db = await createClient();
  if (!db) throw new Error("Account controls are unavailable.");
  const { data: request } = await db.from("account_deletion_requests").select("profile_id").eq("id", requestId).eq("status", "pending").maybeSingle();
  if (!request || request.profile_id === admin.id) throw new Error("This deletion request cannot be reviewed.");
  const { data: updated, error } = await db.from("account_deletion_requests").update({ status: decision, reviewed_by: admin.id, reviewed_at: new Date().toISOString(), review_note: note || null }).eq("id", requestId).eq("status", "pending").select("id").maybeSingle();
  if (error || !updated) throw new Error("The deletion request is no longer pending.");
  if (decision === "approved") {
    const disabled = await db.from("app_accounts").update({ disabled_at: new Date().toISOString() }).eq("id", request.profile_id);
    if (disabled.error) throw new Error("The review was saved, but the account could not be disabled.");
    await revokeAllSessions(request.profile_id);
  }
  revalidatePath("/dashboard/admin/settings");
}

export async function reactivateAccount(data: FormData) {
  await requireRole(["admin"]);
  const profileId = String(data.get("profile_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(profileId)) throw new Error("Invalid account.");
  const db = await createClient();
  if (!db) throw new Error("Account controls are unavailable.");
  const { error } = await db.from("app_accounts").update({ disabled_at: null }).eq("id", profileId);
  if (error) throw new Error("Unable to reactivate the account.");
  revalidatePath("/dashboard/admin/settings");
  redirect("/dashboard/admin/settings?reactivated=1");
}
