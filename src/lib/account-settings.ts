import "server-only";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

const roles: UserRole[] = ["admin", "organizer", "agency", "exhibitor", "talent"];
export async function accountSettingsData() {
  const profile = await requireRole(roles);
  const db = await createClient();
  if (!db) throw new Error("Settings are unavailable.");
  const [preferences, deletion] = await Promise.all([
    db.from("account_notification_preferences").select("email_notifications,in_app_notifications").eq("profile_id", profile.id).maybeSingle(),
    db.from("account_deletion_requests").select("id").eq("profile_id", profile.id).eq("status", "pending").maybeSingle(),
  ]);
  if (preferences.error || deletion.error) throw new Error("Unable to load account settings. Apply the latest migration.");
  return { profile, emailNotifications: preferences.data?.email_notifications ?? true, inAppNotifications: preferences.data?.in_app_notifications ?? true, deletionPending: Boolean(deletion.data) };
}

