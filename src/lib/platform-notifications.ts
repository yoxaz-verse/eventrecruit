import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlatformNotification, PlatformNotificationCategory } from "@/lib/types";

type NotificationRow = {
  id: string;
  category: PlatformNotificationCategory;
  title: string;
  body: string;
  action_href: string | null;
  read_at: string | null;
  created_at: string;
};

function mapNotification(row: NotificationRow): PlatformNotification {
  return { id: row.id, category: row.category, title: row.title, body: row.body, actionHref: row.action_href, readAt: row.read_at, createdAt: row.created_at };
}

export const notificationSummary = cache(async (profileId: string) => {
  const db = createAdminClient();
  if (!db) return { unread: 0, available: false };
  const { count, error } = await db.from("platform_notifications").select("id", { count: "exact", head: true }).eq("profile_id", profileId).is("read_at", null);
  if (error) {
    if (error.code !== "PGRST205" && error.code !== "42P01") console.error(JSON.stringify({ event: "notification_summary_failed", code: error.code }));
    return { unread: 0, available: false };
  }
  return { unread: count ?? 0, available: true };
});

export async function listNotifications(profileId: string, limit = 50): Promise<{ notifications: PlatformNotification[]; available: boolean }> {
  const db = createAdminClient();
  if (!db) return { notifications: [], available: false };
  const { data, error } = await db.from("platform_notifications")
    .select("id,category,title,body,action_href,read_at,created_at")
    .eq("profile_id", profileId).order("created_at", { ascending: false }).limit(Math.min(Math.max(limit, 1), 100));
  if (error) {
    if (error.code !== "PGRST205" && error.code !== "42P01") console.error(JSON.stringify({ event: "notification_list_failed", code: error.code }));
    return { notifications: [], available: false };
  }
  return { notifications: (data ?? []).map((row) => mapNotification(row as NotificationRow)), available: true };
}

export async function createPlatformNotification(input: {
  profileId: string;
  category: PlatformNotificationCategory;
  title: string;
  body: string;
  actionHref?: string | null;
  relatedType?: string | null;
  relatedId?: string | null;
  deduplicationKey?: string | null;
}) {
  const db = createAdminClient();
  if (!db) return false;
  const { error } = await db.from("platform_notifications").insert({
    profile_id: input.profileId,
    category: input.category,
    title: input.title.slice(0, 160),
    body: input.body.slice(0, 1000),
    action_href: input.actionHref?.startsWith("/") ? input.actionHref.slice(0, 500) : null,
    related_type: input.relatedType?.slice(0, 80) || null,
    related_id: input.relatedId || null,
    deduplication_key: input.deduplicationKey?.slice(0, 240) || null,
  });
  if (error?.code === "23505") return true;
  if (error) console.error(JSON.stringify({ event: "platform_notification_create_failed", code: error.code }));
  return !error;
}
