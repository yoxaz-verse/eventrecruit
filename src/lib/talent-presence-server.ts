import "server-only";

import type { DashboardDb } from "@/lib/dashboard-workspace";
import { deriveTalentPresence, type TalentPresence } from "@/lib/talent-presence";

export async function talentPresenceById(db: DashboardDb, talentIds: string[], now = new Date()) {
  const uniqueIds = [...new Set(talentIds)];
  if (!uniqueIds.length) return new Map<string, TalentPresence>();
  const { data, error } = await db.from("talent_job_preferences")
    .select("talent_id,available_for_work,presence_visible,last_seen_at")
    .in("talent_id", uniqueIds);
  if (error) throw new Error("Unable to load talent presence.");
  const rows = new Map((data ?? []).map(row => [row.talent_id, row]));
  return new Map(uniqueIds.map(id => [id, deriveTalentPresence(rows.get(id), now)]));
}
