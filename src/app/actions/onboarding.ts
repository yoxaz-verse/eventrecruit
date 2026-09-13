"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/auth";

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

  const { error: cityError } = await supabase
    .from("profiles")
    .update({
      city: String(formData.get("city") ?? ""),
    })
    .eq("id", user.id);
  if (cityError) return { error: "Unable to save your location. Please try again." };

  const { error: contactError } = await supabase.from("contact_details").upsert({
    profile_id: user.id,
    phone: String(formData.get("phone") ?? ""),
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
      headline: String(formData.get("headline") ?? ""),
      bio: String(formData.get("bio") ?? ""),
      skills,
      languages,
      availability: String(formData.get("availability") ?? ""),
      experience_years: Number(formData.get("experience_years") ?? 0),
      documents_note: String(formData.get("documents_note") ?? ""),
    });
    if (error) return { error: "Unable to save your talent profile. Please try again." };
  }

  if (profile.role === "agency") {
    const { error } = await supabase.from("agencies").upsert(
      {
      owner_id: user.id,
      name: String(formData.get("business_name") ?? ""),
      commission_type: String(formData.get("commission_type") ?? "percentage"),
      commission_value: Number(formData.get("commission_value") ?? 10),
      },
      { onConflict: "owner_id" },
    );
    if (error) return { error: "Unable to save your agency profile. Please try again." };
  }

  if (profile.role === "exhibitor") {
    const { error } = await supabase.from("exhibitors").upsert(
      {
        owner_id: user.id,
        company_name: String(formData.get("business_name") ?? ""),
        industry: String(formData.get("industry") ?? ""),
      },
      { onConflict: "owner_id" },
    );
    if (error) return { error: "Unable to save your exhibitor profile. Please try again." };
  }

  redirect(`/dashboard/${profile.role}`);
}
