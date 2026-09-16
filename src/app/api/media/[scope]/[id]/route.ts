import { getCurrentProfile } from "@/lib/auth";
import { getR2Object } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f-]{36}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ scope: string; id: string }> }) {
  const { scope, id } = await params;
  if (!uuid.test(id) || !["talent", "agency", "exhibitor", "event"].includes(scope)) return new Response("Not found", { status: 404 });
  const db = await createClient();
  if (!db) return new Response("Unavailable", { status: 503 });
  let path: string | null = null;
  let isPrivate = false;

  if (scope === "talent") {
    const { data } = await db.from("profiles").select("avatar_url,role").eq("id", id).eq("role", "talent").maybeSingle();
    path = data?.avatar_url ?? null;
  } else if (scope === "agency") {
    const { data } = await db.from("agencies").select("logo_path").eq("id", id).maybeSingle();
    path = data?.logo_path ?? null;
  } else if (scope === "event") {
    const { data: event } = await db.from("organizer_events").select("logo_path,status,company_id").eq("id", id).maybeSingle();
    if (event?.status !== "published") {
      const viewer = await getCurrentProfile();
      const { data: company } = viewer ? await db.from("organizer_companies").select("owner_id").eq("id", event?.company_id ?? "").maybeSingle() : { data: null };
      if (!viewer || (viewer.role !== "admin" && company?.owner_id !== viewer.id)) return new Response("Not found", { status: 404 });
    }
    path = event?.logo_path ?? null;
  } else {
    isPrivate = true;
    const viewer = await getCurrentProfile();
    if (!viewer) return new Response("Unauthorized", { status: 401 });
    const { data: exhibitor } = await db.from("exhibitors").select("owner_id,logo_path").eq("id", id).maybeSingle();
    let allowed = viewer.role === "admin" || exhibitor?.owner_id === viewer.id;
    if (!allowed && viewer.role === "agency") {
      const { data: agency } = await db.from("agencies").select("id").eq("owner_id", viewer.id).maybeSingle();
      const { data: relationship } = agency ? await db.from("agency_exhibitor_relationships").select("id").eq("agency_id", agency.id).eq("exhibitor_id", id).eq("status", "active").maybeSingle() : { data: null };
      allowed = Boolean(relationship);
    }
    if (!allowed) return new Response("Forbidden", { status: 403 });
    path = exhibitor?.logo_path ?? null;
  }

  if (!path || !path.startsWith(`${scope === "talent" ? "talents" : `${scope}s`}/`)) return new Response("Not found", { status: 404 });
  try {
    const object = await getR2Object(path);
    if (!object?.body) return new Response("Not found", { status: 404 });
    return new Response(object.body, { headers: {
      "content-type": object.headers.get("content-type") ?? "application/octet-stream",
      "cache-control": isPrivate ? "private, max-age=300" : "public, max-age=3600, stale-while-revalidate=86400",
      "x-content-type-options": "nosniff",
    }});
  } catch {
    return new Response("Unavailable", { status: 503 });
  }
}
