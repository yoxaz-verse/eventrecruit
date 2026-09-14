"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount, getCurrentProfile } from "@/lib/auth";
import { canApply, canModerate, ownsStaffingEvent } from "@/lib/app-auth/authorization";
import type { ApplicationStatus, UserRole } from "@/lib/types";
import { validDate } from "@/lib/organizer";
import { todayInIndia } from "@/lib/exhibitor-listings";
import { isSelectableCatalogEvent, parseCatalogSelection } from "@/lib/event-selection";
import { sendRolePush } from "@/lib/talent-push";
import { workDaysOverlap } from "@/lib/talent-jobs";

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
  const selectedEvent = String(formData.get("selected_event") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "");
  const endsAt = String(formData.get("ends_at") ?? "");
  const shiftStart = String(formData.get("shift_start") ?? "");
  const shiftEnd = String(formData.get("shift_end") ?? "");
  const workStartsOn = String(formData.get("work_starts_on") ?? "");
  const workEndsOn = String(formData.get("work_ends_on") ?? "");
  const headcount = Number(formData.get("headcount"));
  const hourlyRate = Number(formData.get("hourly_rate"));
  if ((source === "agency" && (!eventTitle || !venue || !city || eventTitle.length > 160 || !validDate(startsAt) || !validDate(endsAt) || endsAt < startsAt)) ||
    !title || title.length > 160 || !validDate(workStartsOn) || !validDate(workEndsOn) || workEndsOn < workStartsOn ||
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

  let eventFields = { title: eventTitle, venue, city, starts_at: startsAt, ends_at: endsAt, organizer_event_id: null as string | null, exhibitor_event_submission_id: null as string | null };
  if (source === "exhibitor") {
    const selection = parseCatalogSelection(selectedEvent);
    if (!selection) return { error: "Choose an approved event from the list.", success: "" };
    const { kind, id } = selection;
    const result = kind === "organizer"
      ? await supabase.from("organizer_events").select("id,title,venue,city,starts_at,ends_at,status").eq("id", id).eq("status", "published").maybeSingle()
      : await supabase.from("exhibitor_event_submissions").select("id,title,venue,city,starts_at,ends_at,status").eq("id", id).eq("status", "approved").maybeSingle();
    const selected = result.data;
    if (result.error || !selected || !isSelectableCatalogEvent(selected, kind, todayInIndia())) return { error: "This event is not available for requests. Choose another event.", success: "" };
    eventFields = { title: selected.title, venue: selected.venue, city: selected.city, starts_at: selected.starts_at, ends_at: selected.ends_at, organizer_event_id: kind === "organizer" ? id : null, exhibitor_event_submission_id: kind === "exhibitor" ? id : null };
  }
  if (workStartsOn < eventFields.starts_at || workEndsOn > eventFields.ends_at) return { error: "Work days must fall within the event dates.", success: "" };

  const catalogColumn = eventFields.organizer_event_id ? "organizer_event_id" : "exhibitor_event_submission_id";
  const catalogId = eventFields.organizer_event_id ?? eventFields.exhibitor_event_submission_id;
  const findExisting = async () => {
    if (source !== "exhibitor" || !catalogId || !exhibitor?.id) return null;
    const { data } = await supabase.from("events").select("id").eq("exhibitor_id", exhibitor.id).eq(catalogColumn, catalogId).maybeSingle();
    return data;
  };
  let event = await findExisting();
  let createdEvent = false;
  if (!event) {
    const inserted = await supabase.from("events").insert({
      exhibitor_id: exhibitor?.id ?? null,
      agency_id: profile?.role === "agency" ? agency?.id ?? null : null,
      ...eventFields,
      created_by: user.id,
    }).select("id").single();
    event = inserted.data;
    createdEvent = Boolean(event);
    // The unique catalog index protects simultaneous requests for the same event.
    if (inserted.error && source === "exhibitor" && inserted.error.code === "23505") event = await findExisting();
  }
  if (!event) {
    console.error(JSON.stringify({ event: "staffing_request_failed", stage: "event_insert", category: "database_error" }));
    return { error: "Unable to create the event. Check the details and try again.", success: "" };
  }

  const { data: createdRole, error } = await supabase.from("staffing_roles").insert({
    event_id: event.id,
    title,
    description: String(formData.get("description") ?? ""),
    headcount,
    hourly_rate: hourlyRate,
    shift_start: shiftStart,
    shift_end: shiftEnd,
    work_starts_on: workStartsOn,
    work_ends_on: workEndsOn,
    required_skills: String(formData.get("required_skills") ?? "")
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean),
  }).select("id").single();

  if (error) {
    console.error(JSON.stringify({ event: "staffing_request_failed", stage: "role_insert", category: "database_error" }));
    if (createdEvent && source === "agency") {
      const { error: cleanupError } = await supabase.from("events").delete().eq("id", event.id);
      if (cleanupError) console.error(JSON.stringify({ event: "staffing_request_cleanup_failed", category: "database_error" }));
    }
    return { error: "Unable to publish the staffing request. Check the details and try again.", success: "" };
  }
  // The database trigger creates matching in-app alerts for every role publication path.
  if (createdRole) await sendRolePush(createdRole.id).catch((error) => console.error("Talent push dispatch failed",error));
  revalidatePath("/dashboard/exhibitor");
  revalidatePath("/dashboard/exhibitor/requests");
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
  const { data: openRole } = await supabase.from("staffing_roles").select("id,work_starts_on,work_ends_on").eq("id", roleId).eq("status", "open").maybeSingle();
  if (!canApply(profile.role,profile.verification_status,openRole ? "open" : "closed")) return { error: "A verified talent account and open role are required.", success: "" };
  const {data:existing}=await supabase.from("applications").select("id,staffing_role_id,status").eq("talent_id",user.id).eq("status","accepted");
  if (existing?.length) {
    const {data:booked}=await supabase.from("staffing_roles").select("id,work_starts_on,work_ends_on").in("id",existing.map(item=>item.staffing_role_id));
    if (booked?.some(item=>workDaysOverlap(item,openRole!))) return {error:"You are already booked on one or more of these days.",success:""};
  }

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
  const { data: application } = await supabase.from("applications").select("staffing_role_id,status,cancellation_requested_at").eq("id", applicationId).maybeSingle();
  if (!application || !await staffingOwner(supabase, application.staffing_role_id, profile.id)) return { error: "You cannot update this application.", success: "" };
  if (application.status === "accepted" && !["accepted","cancelled","completed"].includes(status)) return {error:"Confirmed bookings may only be completed or cancelled.",success:""};
  if (status === "cancelled" && application.status !== "accepted") return {error:"Only confirmed bookings can be cancelled.",success:""};

  const { data: updated, error } = await supabase
    .from("applications")
    .update({ status, cancellation_requested_at: status === "cancelled" ? null : application.cancellation_requested_at, updated_at: new Date().toISOString() })
    .eq("id", applicationId).select("id").maybeSingle();

  if (error?.message.includes("Role is full")) return {error:"This role has no remaining openings.",success:""};
  if (error?.message.includes("Talent is already booked")) return {error:"This talent is already booked on those days.",success:""};
  if (error || !updated) return { error: "Unable to update this application. Please retry.", success: "" };
  revalidatePath("/dashboard/exhibitor");
  revalidatePath("/dashboard/exhibitor/applicants");
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
