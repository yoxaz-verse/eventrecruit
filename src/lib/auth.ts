import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export async function getCurrentProfile() {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, verification_status, avatar_url")
    .eq("id", user.id)
    .single();

  return data;
}

export async function requireRole(allowed: UserRole[]) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!allowed.includes(profile.role as UserRole)) {
    redirect(`/dashboard/${profile.role}`);
  }

  return profile;
}
