"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) redirect(`/onboarding?message=${encodeURIComponent(profileError.message)}`);

  if (profile.role === "organizer") redirect("/dashboard/organizer/company");

  await supabase
    .from("profiles")
    .update({
      city: String(formData.get("city") ?? ""),
    })
    .eq("id", user.id);

  await supabase.from("contact_details").upsert({
    profile_id: user.id,
    phone: String(formData.get("phone") ?? ""),
  });

  if (profile.role === "talent") {
    const skills = String(formData.get("skills") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const languages = String(formData.get("languages") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    await supabase.from("talent_profiles").upsert({
      profile_id: user.id,
      headline: String(formData.get("headline") ?? ""),
      bio: String(formData.get("bio") ?? ""),
      skills,
      languages,
      availability: String(formData.get("availability") ?? ""),
      experience_years: Number(formData.get("experience_years") ?? 0),
      documents_note: String(formData.get("documents_note") ?? ""),
    });
  }

  if (profile.role === "agency") {
    await supabase.from("agencies").upsert(
      {
      owner_id: user.id,
      name: String(formData.get("business_name") ?? ""),
      commission_type: String(formData.get("commission_type") ?? "percentage"),
      commission_value: Number(formData.get("commission_value") ?? 10),
      },
      { onConflict: "owner_id" },
    );
  }

  if (profile.role === "exhibitor") {
    await supabase.from("exhibitors").upsert(
      {
        owner_id: user.id,
        company_name: String(formData.get("business_name") ?? ""),
        industry: String(formData.get("industry") ?? ""),
      },
      { onConflict: "owner_id" },
    );
  }

  redirect(`/dashboard/${profile.role}`);
}
