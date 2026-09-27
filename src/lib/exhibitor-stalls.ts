import "server-only";

import { createClient } from "@/lib/supabase/server";
import { canManageExhibitor } from "@/lib/agency-workspace";

export type StallSummary = {
  id: string;
  event_id: string;
  name: string;
  booth_number: string | null;
  eventTitle: string;
  eventCity: string;
  verificationStatus: string;
};

export async function stallsForExhibitor(exhibitorId: string, actorId: string): Promise<StallSummary[]> {
  const db = await createClient();
  if (!db || !(await canManageExhibitor(db, actorId, exhibitorId))) return [];
  const { data, error } = await db.from("exhibitor_stalls")
    .select("id,event_id,name,booth_number,events(title,city,verification_status)")
    .eq("exhibitor_id", exhibitorId).order("created_at", { ascending: false });
  if (error) throw new Error("Unable to load stalls. Apply the latest migration.");
  return (data ?? []).flatMap((stall) => {
    const event = Array.isArray(stall.events) ? stall.events[0] : stall.events;
    return event ? [{ id:stall.id,event_id:stall.event_id,name:stall.name,booth_number:stall.booth_number,eventTitle:event.title,eventCity:event.city,verificationStatus:event.verification_status }] : [];
  });
}
