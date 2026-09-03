"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus, UserRole } from "@/lib/types";

const applicationStatuses: ApplicationStatus[] = [
  "applied",
  "shortlisted",
  "accepted",
  "rejected",
  "completed",
  "cancelled",
];

const recommendationStatuses = ["recommended", "accepted", "rejected", "withdrawn"];
const verificationStatuses = ["pending_verification", "verified", "rejected"];
const revieweeRoles: Array<Extract<UserRole, "talent" | "exhibitor">> = ["talent", "exhibitor"];
const reviewVisibilityStatuses = ["published", "hidden"];

function ratingValue(formData: FormData, key: string) {
  const value = Number(formData.get(key) ?? 0);

  if (!Number.isInteger(value) || value < 1 || value > 5) {
    redirect("/dashboard?message=invalid-review-rating");
  }

  return value;
}

export async function createStaffingRole(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/dashboard/exhibitor?message=configure-supabase");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: exhibitor } = await supabase
    .from("exhibitors")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      exhibitor_id: exhibitor?.id ?? null,
      agency_id: profile?.role === "agency" ? agency?.id ?? null : null,
      title: String(formData.get("event_title") ?? ""),
      venue: String(formData.get("venue") ?? ""),
      city: String(formData.get("city") ?? ""),
      starts_at: String(formData.get("starts_at") ?? ""),
      ends_at: String(formData.get("ends_at") ?? ""),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (eventError) redirect(`/dashboard/exhibitor?message=${encodeURIComponent(eventError.message)}`);

  const { error } = await supabase.from("staffing_roles").insert({
    event_id: event.id,
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    headcount: Number(formData.get("headcount") ?? 1),
    hourly_rate: Number(formData.get("hourly_rate") ?? 0),
    shift_start: String(formData.get("shift_start") ?? ""),
    shift_end: String(formData.get("shift_end") ?? ""),
    required_skills: String(formData.get("required_skills") ?? "")
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean),
  });

  if (error) redirect(`/dashboard/exhibitor?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard/exhibitor");
}

export async function applyForRole(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/browse?message=configure-supabase");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase.from("applications").insert({
    staffing_role_id: String(formData.get("staffing_role_id") ?? ""),
    talent_id: user.id,
    cover_note: String(formData.get("cover_note") ?? ""),
  });

  if (error) redirect(`/browse?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/browse");
}

export async function updateApplicationStatus(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const status = String(formData.get("status") ?? "applied") as ApplicationStatus;
  const applicationId = String(formData.get("application_id") ?? "");

  if (!applicationStatuses.includes(status)) {
    redirect("/dashboard?message=invalid-application-status");
  }

  const { error } = await supabase
    .from("applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (error) redirect(`/dashboard?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard/exhibitor");
  revalidatePath("/dashboard/agency");
}

export async function createPlacementReview(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const revieweeRole = String(formData.get("reviewee_role") ?? "talent") as Extract<
    UserRole,
    "talent" | "exhibitor"
  >;

  if (!revieweeRoles.includes(revieweeRole)) {
    redirect("/dashboard?message=invalid-reviewee-role");
  }

  const testimonial = String(formData.get("testimonial") ?? "").trim();

  if (testimonial.length < 10) {
    redirect("/dashboard?message=review-testimonial-too-short");
  }

  const { error } = await supabase.from("placement_reviews").insert({
    placement_id: String(formData.get("placement_id") ?? ""),
    reviewer_id: user.id,
    reviewee_id: String(formData.get("reviewee_id") ?? ""),
    reviewee_role: revieweeRole,
    rating: ratingValue(formData, "rating"),
    communication_rating: ratingValue(formData, "communication_rating"),
    professionalism_rating: ratingValue(formData, "professionalism_rating"),
    reliability_rating: ratingValue(formData, "reliability_rating"),
    testimonial,
    visibility_status: "published",
  });

  if (error) redirect(`/dashboard?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard/exhibitor");
  revalidatePath("/dashboard/talent");
  revalidatePath("/dashboard/admin");
}

export async function recommendTalent(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: agency, error: agencyError } = await supabase
    .from("agencies")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (agencyError) redirect(`/dashboard/agency?message=${encodeURIComponent(agencyError.message)}`);

  const { error } = await supabase.from("talent_recommendations").insert({
    agency_id: agency.id,
    staffing_role_id: String(formData.get("staffing_role_id") ?? ""),
    talent_id: String(formData.get("talent_id") ?? ""),
    note: String(formData.get("note") ?? ""),
  });

  if (error) redirect(`/dashboard/agency?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard/agency");
  revalidatePath("/dashboard/exhibitor");
}

export async function updateRecommendationStatus(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const recommendationId = String(formData.get("recommendation_id") ?? "");
  const status = String(formData.get("status") ?? "recommended");

  if (!recommendationStatuses.includes(status)) {
    redirect("/dashboard/exhibitor?message=invalid-recommendation-status");
  }

  const { error } = await supabase
    .from("talent_recommendations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", recommendationId);

  if (error) redirect(`/dashboard/exhibitor?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard/exhibitor");
  revalidatePath("/dashboard/agency");
}

export async function updateProfileVerification(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const profileId = String(formData.get("profile_id") ?? "");
  const verificationStatus = String(formData.get("verification_status") ?? "pending_verification");

  if (!verificationStatuses.includes(verificationStatus)) {
    redirect("/dashboard/admin?message=invalid-verification-status");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ verification_status: verificationStatus, updated_at: new Date().toISOString() })
    .eq("id", profileId);

  if (error) redirect(`/dashboard/admin?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard/admin");
}

export async function updateReviewVisibility(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const reviewId = String(formData.get("review_id") ?? "");
  const visibilityStatus = String(formData.get("visibility_status") ?? "published");

  if (!reviewVisibilityStatuses.includes(visibilityStatus)) {
    redirect("/dashboard/admin?message=invalid-review-visibility");
  }

  const { error } = await supabase
    .from("placement_reviews")
    .update({ visibility_status: visibilityStatus, updated_at: new Date().toISOString() })
    .eq("id", reviewId);

  if (error) redirect(`/dashboard/admin?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/talent");
  revalidatePath("/dashboard/exhibitor");
  revalidatePath("/dashboard/agency");
}
