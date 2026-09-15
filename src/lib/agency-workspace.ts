import "server-only";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { SelectedClientContext } from "@/lib/types";
import { hasExhibitorAccess } from "@/lib/agency-access";

type Db = NonNullable<Awaited<ReturnType<typeof createClient>>>;

export async function getOwnedExhibitor(db: Db, profileId: string) {
  const { data } = await db.from("exhibitors").select("id,company_name,kind,owner_id").eq("owner_id", profileId).maybeSingle();
  return data;
}

export async function canManageExhibitor(db: Db, profileId: string, exhibitorId: string) {
  const { data: exhibitor } = await db.from("exhibitors").select("id,owner_id").eq("id", exhibitorId).maybeSingle();
  if (!exhibitor) return false;
  const { data: agency } = await db.from("agencies").select("id").eq("owner_id", profileId).maybeSingle();
  const { data: relationship } = agency ? await db.from("agency_exhibitor_relationships").select("agency_id,status").eq("agency_id", agency.id).eq("exhibitor_id", exhibitorId).maybeSingle() : {data:null};
  return hasExhibitorAccess({actorId:profileId,ownerId:exhibitor.owner_id,agencyId:agency?.id??null,relationshipAgencyId:relationship?.agency_id,relationshipStatus:relationship?.status});
}

export async function requireExhibitorAccess(exhibitorId: string) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const db = await createClient();
  if (!db) throw new Error("Workspace is temporarily unavailable.");
  if (!await canManageExhibitor(db, profile.id, exhibitorId)) throw new Error("You do not have access to this exhibitor.");
  return { db, profile };
}

export async function agencyClients(): Promise<SelectedClientContext[]> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "agency") return [];
  const db = await createClient();
  if (!db) return [];
  const { data: agency } = await db.from("agencies").select("id,name").eq("owner_id", profile.id).maybeSingle();
  if (!agency) return [];
  const { data } = await db.from("agency_exhibitor_relationships").select("exhibitor_id,exhibitors(id,company_name,kind)").eq("agency_id", agency.id).eq("status", "active");
  return (data ?? []).flatMap((row) => {
    const value = Array.isArray(row.exhibitors) ? row.exhibitors[0] : row.exhibitors;
    return value ? [{ exhibitorId: value.id, companyName: value.company_name, kind: value.kind, agencyId: agency.id, agencyName: agency.name } as SelectedClientContext] : [];
  }).sort((a,b) => a.companyName.localeCompare(b.companyName));
}

export function selectedAgencyClient(clients: SelectedClientContext[], requested?: string) {
  return clients.find((client) => client.exhibitorId === requested) ?? clients[0] ?? null;
}
