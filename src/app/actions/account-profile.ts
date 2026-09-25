"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAccount, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

const roles: UserRole[] = ["admin", "organizer", "agency", "exhibitor", "talent"];

export async function saveAccountProfile(_state: { error: string }, data: FormData): Promise<{ error: string }> {
  const profile = await requireRole(roles);
  const db = await createClient();
  if (!db) return { error: "Profile editing is temporarily unavailable." };
  const fullName = String(data.get("full_name") ?? "").trim();
  const phone = String(data.get("phone") ?? "").trim();
  if (fullName.length < 2 || fullName.length > 160) return { error: "Enter your name within 160 characters." };
  if (!phone || phone.length > 40) return { error: "Enter a valid private phone number." };
  const [profileResult, contactResult] = await Promise.all([
    db.from("profiles").update({ full_name: fullName, profile_updated_at: new Date().toISOString() }).eq("id", profile.id),
    db.from("contact_details").upsert({ profile_id: profile.id, phone }),
  ]);
  if (profileResult.error || contactResult.error) return { error: "Unable to save your account profile." };
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/${profile.role}/profile?saved=account`);
}

export async function accountProfileData() {
  const profile = await requireRole(roles);
  const account = await getCurrentAccount();
  const db = await createClient();
  if (!db || !account) throw new Error("Account profile is unavailable.");
  const { data: contact, error } = await db.from("contact_details").select("phone").eq("profile_id", profile.id).maybeSingle();
  if (error) throw new Error("Unable to load account profile.");
  return { profile, email: account.email, phone: contact?.phone ?? "" };
}

