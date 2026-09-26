import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export type DashboardDb = NonNullable<Awaited<ReturnType<typeof createClient>>>;
export type DashboardProfile = NonNullable<Awaited<ReturnType<typeof getCurrentProfile>>>;

export type DashboardWorkspace<R extends UserRole = UserRole, E = null> = {
  role: R;
  db: DashboardDb;
  profile: DashboardProfile & { role: R };
  entity: E;
};

type AgencyEntity = { id: string; name: string; logo_path: string | null; contact_phone: string | null };
type ExhibitorEntity = { id: string; company_name: string; kind: "platform" | "external"; logo_path: string | null };
type TalentEntity = { profile_id: string } | null;
type OrganizerCompany = { id: string; name: string; city: string; description: string; website: string; public_phone: string | null; verification_status: string; permission: string };

async function baseWorkspace<R extends UserRole>(role: R) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== role) redirect(`/dashboard/${profile.role}`);
  const db = await createClient();
  if (!db) throw new Error("Workspace is temporarily unavailable.");
  return { role, db, profile: profile as DashboardProfile & { role: R } };
}

export const requireAdminWorkspace = cache(async (): Promise<DashboardWorkspace<"admin">> => ({ ...(await baseWorkspace("admin")), entity: null }));

export const requireAgencyWorkspace = cache(async (): Promise<DashboardWorkspace<"agency", AgencyEntity>> => {
  const workspace = await baseWorkspace("agency");
  const { data, error } = await workspace.db.from("agencies").select("id,name,logo_path,contact_phone").eq("owner_id", workspace.profile.id).maybeSingle();
  if (error) throw new Error("Unable to load the agency workspace.");
  if (!data) redirect("/onboarding");
  return { ...workspace, entity: data };
});

export const requireExhibitorWorkspace = cache(async (): Promise<DashboardWorkspace<"exhibitor", ExhibitorEntity>> => {
  const workspace = await baseWorkspace("exhibitor");
  const { data, error } = await workspace.db.from("exhibitors").select("id,company_name,kind,logo_path").eq("owner_id", workspace.profile.id).maybeSingle();
  if (error) throw new Error("Unable to load the exhibitor workspace.");
  if (!data) redirect("/onboarding");
  return { ...workspace, entity: data as ExhibitorEntity };
});

export const requireTalentWorkspace = cache(async (): Promise<DashboardWorkspace<"talent", TalentEntity>> => {
  const workspace = await baseWorkspace("talent");
  const { data, error } = await workspace.db.from("talent_profiles").select("profile_id").eq("profile_id", workspace.profile.id).maybeSingle();
  if (error) throw new Error("Unable to load the talent workspace.");
  return { ...workspace, entity: data };
});

export const requireOrganizerWorkspace = cache(async (): Promise<DashboardWorkspace<"organizer", OrganizerCompany[]>> => {
  const workspace = await baseWorkspace("organizer");
  const { data, error } = await workspace.db.from("organizer_company_memberships").select("permission,organizer_companies(id,name,city,description,website,public_phone,verification_status)").eq("profile_id", workspace.profile.id);
  if (error) throw new Error("Unable to load companies. Apply the latest organizer migration.");
  const companies = (data ?? []).flatMap((row) => {
    const company = Array.isArray(row.organizer_companies) ? row.organizer_companies[0] : row.organizer_companies;
    return company ? [{ ...company, city: company.city ?? "", description: company.description ?? "", website: company.website ?? "", permission: row.permission } as OrganizerCompany] : [];
  });
  return { ...workspace, entity: companies };
});

export type AgencyWorkspace = Awaited<ReturnType<typeof requireAgencyWorkspace>>;
export type ExhibitorWorkspace = Awaited<ReturnType<typeof requireExhibitorWorkspace>>;
export type TalentWorkspace = Awaited<ReturnType<typeof requireTalentWorkspace>>;
export type OrganizerWorkspace = Awaited<ReturnType<typeof requireOrganizerWorkspace>>;
