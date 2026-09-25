import "server-only";
import { cache } from "react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";
import { accountSettingsAvailability } from "@/lib/account-settings-state";

const roles: UserRole[] = ["admin", "organizer", "agency", "exhibitor", "talent"];

function logSettingsFailure(stage: string, error: { code?: string | null } | null) {
  if (error) console.error(JSON.stringify({ event: "account_settings_load_failed", stage, code: error.code ?? "unknown" }));
}

export const accountSettingsData = cache(async function accountSettingsData() {
  const profile = await requireRole(roles);
  const db = await createClient();
  if (!db) return { profile, emailNotifications: true, inAppNotifications: true, deletionPending: false, availability: "temporarily_unavailable" as const };
  const [preferences, deletion] = await Promise.all([
    db.from("account_notification_preferences").select("email_notifications,in_app_notifications").eq("profile_id", profile.id).maybeSingle(),
    db.from("account_deletion_requests").select("id").eq("profile_id", profile.id).eq("status", "pending").maybeSingle(),
  ]);
  logSettingsFailure("preferences", preferences.error);
  logSettingsFailure("deletion_request", deletion.error);
  return { profile, emailNotifications: preferences.data?.email_notifications ?? true, inAppNotifications: preferences.data?.in_app_notifications ?? true, deletionPending: Boolean(deletion.data), availability: accountSettingsAvailability([preferences.error, deletion.error]) };
});
