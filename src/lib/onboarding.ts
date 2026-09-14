import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/types";
import { hasCoreProfile } from "@/lib/onboarding-rules";

export function onboardingPath(role: UserRole) {
  return role === "organizer" ? "/dashboard/organizer/company" : "/onboarding";
}

export async function nextAccountPath(accountId: string): Promise<string> {
  const db = createAdminClient();
  if (!db) return "/dashboard";
  const { data: profile, error } = await db.from("profiles")
    .select("role,city,onboarding_completed_at").eq("id", accountId).maybeSingle();
  if (error || !profile) return "/dashboard";
  const role = profile.role as UserRole;
  if (role === "admin") return "/dashboard/admin";
  if (profile.onboarding_completed_at) return `/dashboard/${role}`;

  // Existing accounts predate the completion marker. Recognize only profiles
  // that already contain the same core information required by onboarding.
  if (role === "organizer") {
    const { data: company } = await db.from("organizer_companies").select("id").eq("owner_id", accountId).maybeSingle();
    return company ? "/dashboard/organizer" : onboardingPath(role);
  }
  const { data: contact } = await db.from("contact_details").select("phone").eq("profile_id", accountId).maybeSingle();
  if (!profile.city?.trim() || !contact?.phone?.trim()) return onboardingPath(role);
  if (role === "talent") {
    const { data } = await db.from("talent_profiles").select("headline,skills").eq("profile_id", accountId).maybeSingle();
    return hasCoreProfile(role, profile.city, contact.phone, data) ? "/dashboard/talent" : "/onboarding";
  }
  if (role === "agency") {
    const { data } = await db.from("agencies").select("name").eq("owner_id", accountId).maybeSingle();
    return hasCoreProfile(role, profile.city, contact.phone, data) ? "/dashboard/agency" : "/onboarding";
  }
  if (role === "exhibitor") {
    const { data } = await db.from("exhibitors").select("company_name").eq("owner_id", accountId).maybeSingle();
    return hasCoreProfile(role, profile.city, contact.phone, data) ? "/dashboard/exhibitor" : "/onboarding";
  }
  return "/dashboard";
}
