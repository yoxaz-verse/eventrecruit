"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/auth";
import { validateOnboarding } from "@/lib/onboarding-rules";
import type { UserRole } from "@/lib/types";

const value = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

export async function completeOnboarding(_state: { error: string }, formData: FormData): Promise<{ error: string }> {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const user = await getCurrentAccount();

  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) return { error: "Unable to load your profile. Please try again." };

  if (profile.role === "organizer") redirect("/dashboard/organizer/company");
  if (!["talent", "agency", "exhibitor"].includes(profile.role)) return { error: "This account type cannot use this form." };

  const validationError = validateOnboarding(profile.role as UserRole, formData);
  if (validationError) return { error: validationError };
  const city = value(formData, "city");
  const phone = value(formData, "phone");
  const experience = value(formData, "experience_years");
  const commission = value(formData, "commission_value");

  const { error: cityError } = await supabase
    .from("profiles")
    .update({
      city,
    })
    .eq("id", user.id);
  if (cityError) return { error: "Unable to save your location. Please try again." };

  const { error: contactError } = await supabase.from("contact_details").upsert({
    profile_id: user.id,
    phone,
  });
  if (contactError) return { error: "Unable to save your contact details. Please try again." };

  if (profile.role === "talent") {
    const skills = String(formData.get("skills") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const languages = String(formData.get("languages") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const { error } = await supabase.from("talent_profiles").upsert({
      profile_id: user.id,
      headline: value(formData, "headline"),
      bio: value(formData, "bio"),
      skills,
      languages,
      availability: value(formData, "availability"),
      experience_years: Number(experience || 0),
      documents_note: value(formData, "documents_note"),
    });
    if (error) return { error: "Unable to save your talent profile. Please try again." };
  }

  if (profile.role === "agency") {
    const { error } = await supabase.from("agencies").upsert(
      {
      owner_id: user.id,
      name: value(formData, "business_name"),
      commission_type: value(formData, "commission_type"),
      commission_value: Number(commission || 10),
      },
      { onConflict: "owner_id" },
    );
    if (error) return { error: "Unable to save your agency profile. Please try again." };
  }

  if (profile.role === "exhibitor") {
    const normalizedEmail = user.email.trim().toLowerCase();
    const { data: claimable } = await supabase.from("exhibitors").select("id").eq("kind", "external").eq("claim_email", normalizedEmail).is("owner_id", null).maybeSingle();
    const payload = { owner_id: user.id, company_name: value(formData, "business_name"), industry: value(formData, "industry"), kind: "platform", claimed_at: new Date().toISOString() };
    const { error } = claimable
      ? await supabase.from("exhibitors").update(payload).eq("id", claimable.id).is("owner_id", null)
      : await supabase.from("exhibitors").upsert(payload, { onConflict: "owner_id" });
    if (error) return { error: "Unable to save your exhibitor profile. Please try again." };
  }

  const { error: completionError } = await supabase.from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() }).eq("id", user.id);
  if (completionError) return { error: "Your profile was saved, but setup could not be completed. Please try again." };
  redirect(`/dashboard/${profile.role}`);
}
