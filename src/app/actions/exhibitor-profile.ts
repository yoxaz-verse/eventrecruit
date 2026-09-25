"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { validateExhibitorProfile } from "@/lib/exhibitor-profile";
import { createClient } from "@/lib/supabase/server";

export async function saveExhibitorProfile(_state: { error: string }, data: FormData): Promise<{ error: string }> {
  const profile = await requireRole(["exhibitor"]);
  const db = await createClient();
  if (!db) return { error: "Profile editing is temporarily unavailable." };

  const validation = validateExhibitorProfile(data);
  if (validation.error !== null) return { error: validation.error };
  const values = validation.values;

  const { data: exhibitor, error: ownerError } = await db.from("exhibitors").select("id").eq("owner_id", profile.id).maybeSingle();
  if (ownerError || !exhibitor) return { error: "Your exhibitor company could not be verified." };

  const optional = (value: string) => value || null;
  const results = await Promise.all([
    db.from("profiles").update({ full_name: values.fullName, city: values.city, profile_updated_at: new Date().toISOString() }).eq("id", profile.id),
    db.from("contact_details").upsert({ profile_id: profile.id, phone: values.accountPhone }),
    db.from("exhibitors").update({
      company_name: values.companyName,
      company_type: optional(values.companyType),
      industry: optional(values.industry),
      description: optional(values.description),
      website: optional(values.website),
      address: optional(values.address),
      city: values.city,
      primary_contact_name: optional(values.primaryContactName),
      contact_phone: optional(values.contactPhone),
      contact_email: optional(values.contactEmail),
    }).eq("id", exhibitor.id).eq("owner_id", profile.id),
  ]);
  if (results.some((result) => result.error)) return { error: "Unable to save your profile. Please try again." };

  revalidatePath("/dashboard/exhibitor");
  revalidatePath("/dashboard/exhibitor/profile");
  redirect("/dashboard/exhibitor/profile?saved=1");
}
