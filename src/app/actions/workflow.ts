"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount, getCurrentProfile } from "@/lib/auth";
import { canApply, canModerate, ownsStaffingEvent } from "@/lib/app-auth/authorization";
import type { ApplicationStatus, UserRole } from "@/lib/types";
import { validDate } from "@/lib/organizer";

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

async function actor() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

async function staffingOwner(db: NonNullable<Awaited<ReturnType<typeof createClient>>>, roleId: string, actorId: string) {
  const { data: role } = await db.from("staffing_roles").select("event_id").eq("id", roleId).maybeSingle();
  if (!role) return false;
  const { data: event } = await db.from("events").select("created_by").eq("id", role.event_id).maybeSingle();
  return ownsStaffingEvent(event?.created_by, actorId);
}

function ratingValue(formData: FormData, key: string) {
  const value = Number(formData.get(key) ?? 0);

  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return null;
  }

  return value;
}

export type WorkflowFormState = { error: string; success: string };

export async function createStaffingRole(_state: WorkflowFormState, formData: FormData): Promise<WorkflowFormState> {
  const source = formData.get("source") === "agency" ? "agency" : "exhibitor";
  const eventTitle = String(formData.get("event_title") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "");
  const endsAt = String(formData.get("ends_at") ?? "");
  const shiftStart = String(formData.get("shift_start") ?? "");
  const shiftEnd = String(formData.get("shift_end") ?? "");
  const headcount = Number(formData.get("headcount"));
  const hourlyRate = Number(formData.get("hourly_rate"));
  if (!eventTitle || !title || !venue || !city || eventTitle.length > 160 || title.length > 160 ||
    !validDate(startsAt) || !validDate(endsAt) || endsAt < startsAt ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(shiftStart) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(shiftEnd) ||
    !Number.isInteger(headcount) || headcount < 1 || !Number.isFinite(hourlyRate) || hourlyRate < 0) {
    return { error: "Check the event dates, shift times, headcount, and hourly rate before publishing.", success: "" };
  }
  const supabase = await createClient();
  if (!supabase) return { error: "Posting is temporarily unavailable. Please try again later.", success: "" };

  const user = await getCurrentAccount();

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

  if (profile?.role !== source || (source === "agency" ? !agency?.id : !exhibitor?.id)) {
    return { error: "Complete your business profile before posting a staffing request.", success: "" };
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      exhibitor_id: exhibitor?.id ?? null,
      agency_id: profile?.role === "agency" ? agency?.id ?? null : null,
      title: eventTitle,
      venue,
      city,
      starts_at: startsAt,
      ends_at: endsAt,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (eventError) {
    console.error(JSON.stringify({ event: "staffing_request_failed", stage: "event_insert", category: "database_error" }));
    return { error: "Unable to create the event. Check the details and try again.", success: "" };
  }

  const { error } = await supabase.from("staffing_roles").insert({
    event_id: event.id,
    title,
    description: String(formData.get("description") ?? ""),
    headcount,
    hourly_rate: hourlyRate,
    shift_start: shiftStart,
    shift_end: shiftEnd,
    required_skills: String(formData.get("required_skills") ?? "")
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean),
  });

  if (error) {
    console.error(JSON.stringify({ event: "staffing_request_failed", stage: "role_insert", category: "database_error" }));
    const { error: cleanupError } = await supabase.from("events").delete().eq("id", event.id);
    if (cleanupError) console.error(JSON.stringify({ event: "staffing_request_cleanup_failed", category: "database_error" }));
    return { error: "Unable to publish the staffing request. Check the details and try again.", success: "" };
  }
  revalidatePath("/dashboard/exhibitor");
  revalidatePath("/dashboard/agency");
  return { error: "", success: "Staffing request published." };
}

export async function applyForRole(_state: WorkflowFormState, formData: FormData): Promise<WorkflowFormState> {
  const supabase = await createClient();
  if (!supabase) return { error: "Applications are temporarily unavailable.", success: "" };

  const user = await getCurrentAccount();

  if (!user) redirect("/login");
  const profile = await actor();
  const roleId = String(formData.get("staffing_role_id") ?? "");
  const { data: openRole } = await supabase.from("staffing_roles").select("id").eq("id", roleId).eq("status", "open").maybeSingle();
  if (!canApply(profile.role,profile.verification_status,openRole ? "open" : "closed")) return { error: "A verified talent account and open role are required.", success: "" };

  const { error } = await supabase.from("applications").insert({
    staffing_role_id: roleId,
    talent_id: user.id,
    cover_note: String(formData.get("cover_note") ?? ""),
  });

  if (error) return { error: "Unable to apply for this role. Check whether you have already applied and try again.", success: "" };
  revalidatePath("/browse");
  return { error: "", success: "Application sent." };
}

export async function updateApplicationStatus(_state: WorkflowFormState, formData: FormData): Promise<WorkflowFormState> {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const status = String(formData.get("status") ?? "applied") as ApplicationStatus;
  const applicationId = String(formData.get("application_id") ?? "");
  const profile = await actor();

  if (!applicationStatuses.includes(status)) {
    return { error: "Choose a valid application status.", success: "" };
  }
  if (!["exhibitor", "agency"].includes(profile.role)) return { error: "You cannot update this application.", success: "" };
  const { data: application } = await supabase.from("applications").select("staffing_role_id").eq("id", applicationId).maybeSingle();
  if (!application || !await staffingOwner(supabase, application.staffing_role_id, profile.id)) return { error: "You cannot update this application.", success: "" };

  const { data: updated, error } = await supabase
    .from("applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", applicationId).select("id").maybeSingle();

  if (error || !updated) return { error: "Unable to update this application. Please retry.", success: "" };
  revalidatePath("/dashboard/exhibitor");
  revalidatePath("/dashboard/agency");
  return { error: "", success: "Application updated." };
}

export async function createPlacementReview(_state: WorkflowFormState, formData: FormData): Promise<WorkflowFormState> {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const user = await getCurrentAccount();

  if (!user) redirect("/login");
  const profile = await actor();
  const placementId = String(formData.get("placement_id") ?? "");
  if (!["talent", "exhibitor"].includes(profile.role)) return { error: "Only placement participants can submit reviews.", success: "" };
  const { data: placement } = await supabase.from("placements").select("talent_id,staffing_role_id,status").eq("id",placementId).maybeSingle();
  if (!placement || placement.status !== "completed" || (placement.talent_id !== profile.id && !await staffingOwner(supabase,placement.staffing_role_id,profile.id))) return { error: "A completed placement you participated in is required.", success: "" };
  const { data: placementRole } = await supabase.from("staffing_roles").select("event_id").eq("id",placement.staffing_role_id).maybeSingle();
  const { data: placementEvent } = placementRole ? await supabase.from("events").select("created_by").eq("id",placementRole.event_id).maybeSingle() : { data: null };
  const revieweeId = String(formData.get("reviewee_id") ?? "");
  const expectedReviewee = placement.talent_id === profile.id ? placementEvent?.created_by : placement.talent_id;
  if (!expectedReviewee || revieweeId !== expectedReviewee) return { error: "Choose the other participant in this placement.", success: "" };

  const revieweeRole = String(formData.get("reviewee_role") ?? "talent") as Extract<
    UserRole,
    "talent" | "exhibitor"
  >;

  if (!revieweeRoles.includes(revieweeRole)) {
    return { error: "Choose a valid review recipient.", success: "" };
  }
  if (revieweeRole !== (profile.role === "talent" ? "exhibitor" : "talent")) return { error: "Choose a valid review recipient.", success: "" };

  const testimonial = String(formData.get("testimonial") ?? "").trim();
  const ratings = ["rating", "communication_rating", "professionalism_rating", "reliability_rating"].map((key) => ratingValue(formData, key));
  if (ratings.some((rating) => rating === null)) return { error: "Choose a rating from 1 to 5 for each category.", success: "" };

  if (testimonial.length < 10) {
    return { error: "Write at least 10 characters for the testimonial.", success: "" };
  }

  const { error } = await supabase.from("placement_reviews").insert({
    placement_id: placementId,
    reviewer_id: user.id,
    reviewee_id: revieweeId,
    reviewee_role: revieweeRole,
    rating: ratings[0],
    communication_rating: ratings[1],
    professionalism_rating: ratings[2],
    reliability_rating: ratings[3],
    testimonial,
    visibility_status: "published",
  });

  if (error) return { error: "Unable to publish the review. Please retry.", success: "" };
  revalidatePath("/dashboard/exhibitor");
  revalidatePath("/dashboard/talent");
  revalidatePath("/dashboard/admin");
  return { error: "", success: "Review published." };
}

export async function recommendTalent(_state: WorkflowFormState, formData: FormData): Promise<WorkflowFormState> {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const user = await getCurrentAccount();

  if (!user) redirect("/login");
  const profile = await actor();
  if (profile.role !== "agency") return { error: "An agency account is required.", success: "" };

  const { data: agency, error: agencyError } = await supabase
    .from("agencies")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (agencyError) return { error: "Complete your agency profile before recommending talent.", success: "" };

  const { error } = await supabase.from("talent_recommendations").insert({
    agency_id: agency.id,
    staffing_role_id: String(formData.get("staffing_role_id") ?? ""),
    talent_id: String(formData.get("talent_id") ?? ""),
    note: String(formData.get("note") ?? ""),
  });

  if (error) return { error: "Unable to send this recommendation. Please retry.", success: "" };
  revalidatePath("/dashboard/agency");
  revalidatePath("/dashboard/exhibitor");
  return { error: "", success: "Recommendation sent." };
}

export async function updateRecommendationStatus(_state: WorkflowFormState, formData: FormData): Promise<WorkflowFormState> {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const recommendationId = String(formData.get("recommendation_id") ?? "");
  const status = String(formData.get("status") ?? "recommended");
  const profile = await actor();

  if (!recommendationStatuses.includes(status)) {
    return { error: "Choose a valid recommendation status.", success: "" };
  }
  const { data: recommendation } = await supabase.from("talent_recommendations").select("agency_id,staffing_role_id").eq("id",recommendationId).maybeSingle();
  if (!recommendation) return { error: "You cannot update this recommendation.", success: "" };
  const { data: agency } = await supabase.from("agencies").select("owner_id").eq("id",recommendation.agency_id).maybeSingle();
  if (agency?.owner_id !== profile.id && !await staffingOwner(supabase,recommendation.staffing_role_id,profile.id)) return { error: "You cannot update this recommendation.", success: "" };

  const { data: updated, error } = await supabase
    .from("talent_recommendations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", recommendationId).select("id").maybeSingle();

  if (error || !updated) return { error: "Unable to update this recommendation. Please retry.", success: "" };
  revalidatePath("/dashboard/exhibitor");
  revalidatePath("/dashboard/agency");
  return { error: "", success: "Recommendation updated." };
}

export async function updateProfileVerification(_state: WorkflowFormState, formData: FormData): Promise<WorkflowFormState> {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const profileId = String(formData.get("profile_id") ?? "");
  const verificationStatus = String(formData.get("verification_status") ?? "pending_verification");
  const profile = await actor();
  if (!canModerate(profile.role)) return { error: "Administrator access is required.", success: "" };

  if (!verificationStatuses.includes(verificationStatus)) {
    return { error: "Choose a valid verification status.", success: "" };
  }

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ verification_status: verificationStatus, updated_at: new Date().toISOString() })
    .eq("id", profileId).select("id").maybeSingle();

  if (error || !updated) return { error: "Unable to update profile verification. Please retry.", success: "" };
  revalidatePath("/dashboard/admin");
  return { error: "", success: "Verification updated." };
}

export async function updateReviewVisibility(_state: WorkflowFormState, formData: FormData): Promise<WorkflowFormState> {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const reviewId = String(formData.get("review_id") ?? "");
  const visibilityStatus = String(formData.get("visibility_status") ?? "published");
  const profile = await actor();
  if (!canModerate(profile.role)) return { error: "Administrator access is required.", success: "" };

  if (!reviewVisibilityStatuses.includes(visibilityStatus)) {
    return { error: "Choose a valid review visibility.", success: "" };
  }

  const { data: updated, error } = await supabase
    .from("placement_reviews")
    .update({ visibility_status: visibilityStatus, updated_at: new Date().toISOString() })
    .eq("id", reviewId).select("id").maybeSingle();

  if (error || !updated) return { error: "Unable to update review visibility. Please retry.", success: "" };
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/talent");
  revalidatePath("/dashboard/exhibitor");
  revalidatePath("/dashboard/agency");
  return { error: "", success: "Review visibility updated." };
}
