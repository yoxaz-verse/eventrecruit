"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

const roles: UserRole[] = ["admin", "organizer", "agency", "sponsor_agency", "exhibitor", "talent"];

export async function markNotificationRead(data: FormData) {
  const profile = await requireRole(roles);
  const notificationId = String(data.get("notification_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(notificationId)) throw new Error("Invalid notification.");
  const db = await createClient();
  if (!db) throw new Error("Notifications are unavailable.");
  const { error } = await db.from("platform_notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId).eq("profile_id", profile.id).is("read_at", null);
  if (error) throw new Error("Unable to update the notification.");
  revalidatePath(`/dashboard/${profile.role}/notifications`);
  revalidatePath(`/dashboard/${profile.role}`, "layout");
}

export async function markAllNotificationsRead() {
  const profile = await requireRole(roles);
  const db = await createClient();
  if (!db) throw new Error("Notifications are unavailable.");
  const { error } = await db.from("platform_notifications").update({ read_at: new Date().toISOString() }).eq("profile_id", profile.id).is("read_at", null);
  if (error) throw new Error("Unable to update notifications.");
  revalidatePath(`/dashboard/${profile.role}/notifications`);
  revalidatePath(`/dashboard/${profile.role}`, "layout");
}
