import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const profile = await getCurrentProfile();
  if (!profile) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (profile.role !== "talent") return Response.json({ error: "Talent access required." }, { status: 403 });
  const db = await createClient();
  if (!db) return Response.json({ error: "Presence unavailable." }, { status: 503 });
  const { error } = await db.from("talent_job_preferences").upsert({
    talent_id: profile.id,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: "talent_id" });
  if (error) return Response.json({ error: "Unable to update presence." }, { status: 500 });
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
