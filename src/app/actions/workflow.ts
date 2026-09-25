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
import { canManageExhibitor } from "@/lib/agency-workspace";
import { containsContactDetails } from "@/lib/contact-detector";
import { applicationProfileCheck } from "@/lib/application-profile";

const applicationStatuses: ApplicationStatus[] = [
  "applied",
  "shortlisted",
  "documents_requested",
  "under_review",
  "approved",
  "assigned",
  "rejected",
  "withdrawn",
  "no_response",
  "cancelled",
  "completed",
  "closed",
];

const recommendationStatuses = ["recommended", "accepted", "rejected", "withdrawn"];
const verificationStatuses = ["pending_verification", "verified", "rejected"];
const revieweeRoles: Array<Extract<UserRole, "talent" | "exhibitor">> = ["talent", "exhibitor"];
const reviewVisibilityStatuses = ["published", "hidden"];

async function actor() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/onboarding");
  return profile;
}

function staffingOwner(db: NonNullable<Awaited<ReturnType<typeof createClient>>>, roleId: string, actorId: string) {
  return db
    .from("staffing_roles")
    .select("events(created_by,exhibitor_id)")
    .eq("id", roleId)
    .single()
    .then(({ data }) => {
      const event = Array.isArray(data?.events) ? data.events[0] : data?.events;
      return ownsStaffingEvent(event?.created_by, actorId) || Boolean(event?.exhibitor_id && canManageExhibitor(db, actorId, event.exhibitor_id));
    });
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
  const description = String(formData.get("description") ?? "").trim();
  const requiredSkillsRaw = String(formData.get("required_skills") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "");
  const endsAt = String(formData.get("ends_at") ?? "");
  const shiftStart = String(formData.get("shift_start") ?? "");
  const shiftEnd = String(formData.get("shift_end") ?? "");
  const workStartsOn = String(formData.get("work_starts_on") ?? "");
  const workEndsOn = String(formData.get("work_ends_on") ?? "");
  const headcount = Number(formData.get("headcount"));
  const eventMode=String(formData.get("event_mode")??"existing");
  const rateMode=String(formData.get("rate_mode")??"fixed");
  const proposedRateMin=formData.get("proposed_rate_min")?Number(formData.get("proposed_rate_min")):null;
  const proposedRateMax=formData.get("proposed_rate_max")?Number(formData.get("proposed_rate_max")):proposedRateMin;
  const mapUrl=String(formData.get("map_url")??"").trim();

  // Contact detail auto-detector check
  const descCheck = containsContactDetails(description);
  if (descCheck.hasContact) {
    return { error: descCheck.reason ?? "Phone numbers and email addresses are not allowed in description fields.", success: "" };
  }
  const skillsCheck = containsContactDetails(requiredSkillsRaw);
  if (skillsCheck.hasContact) {
    return { error: skillsCheck.reason ?? "Phone numbers and email addresses are not allowed in required skills.", success: "" };
  }
  const titleCheck = containsContactDetails(title);
  if (titleCheck.hasContact) {
    return { error: titleCheck.reason ?? "Phone numbers and email addresses are not allowed in role titles.", success: "" };
  }

  if (!title || title.length > 160 || !validDate(workStartsOn) || !validDate(workEndsOn) || workEndsOn < workStartsOn ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(shiftStart) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(shiftEnd) ||
    !Number.isInteger(headcount) || headcount < 1 || !["fixed","range","negotiable"].includes(rateMode) ||
    (rateMode!=="negotiable"&&(!Number.isFinite(proposedRateMin)||proposedRateMin!<0||!Number.isFinite(proposedRateMax)||proposedRateMax!<proposedRateMin!))) {
    return { error: "Check the event dates, shift times, headcount, and proposed rate before publishing.", success: "" };
  }
  if(mapUrl){try{if(new URL(mapUrl).protocol!=="https:")return {error:"The map link must use HTTPS.",success:""};}catch{return {error:"Enter a valid shareable map link.",success:""};}}
  const supabase = await createClient();
  if (!supabase) return { error: "Posting is temporarily unavailable. Please try again later.", success: "" };

  const user = await getCurrentAccount();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: ownedExhibitor } = await supabase
    .from("exhibitors")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  const requestedExhibitorId = source === "agency" ? String(formData.get("exhibitor_id") ?? "") : ownedExhibitor?.id ?? "";
  const authorized = requestedExhibitorId ? await canManageExhibitor(supabase, user.id, requestedExhibitorId) : false;
  if (profile?.role !== source || (source === "agency" ? !agency?.id : !ownedExhibitor?.id) || !authorized) {
    return { error: "Complete your business profile before posting a staffing request.", success: "" };
  }

  let eventFields = { title: eventTitle, venue, city, location_id:null as string|null, starts_at: startsAt, ends_at: endsAt, organizer_event_id: null as string | null, exhibitor_event_submission_id: null as string | null, verification_status:"verification_required", map_url:mapUrl||null, payer_type:source };
  if(eventMode==="existing") {
    const selection = parseCatalogSelection(selectedEvent);
    if (!selection) return { error: "Choose an event from the list.", success: "" };
    const { kind, id } = selection;
    const result = kind === "organizer"
      ? await supabase.from("organizer_events").select("id,title,venue,city,location_id,map_url,starts_at,ends_at,status").eq("id", id).eq("status", "published").maybeSingle()
      : await supabase.from("exhibitor_event_submissions").select("id,title,venue,city,location_id,map_url,starts_at,ends_at,status").eq("id", id).in("status",["pending","approved"]).maybeSingle();
    const selected = result.data;
    if (result.error || !selected || (selected.status!=="pending"&&!isSelectableCatalogEvent(selected, kind, todayInIndia()))) return { error: "This event is not available for requests. Choose another event.", success: "" };
    eventFields = { title: selected.title, venue: selected.venue, city: selected.city, location_id:selected.location_id, starts_at: selected.starts_at, ends_at: selected.ends_at, organizer_event_id: kind === "organizer" ? id : null, exhibitor_event_submission_id: kind === "exhibitor" ? id : null, verification_status:selected.status==="pending"?"pending":"verified",map_url:selected.map_url??null,payer_type:source };
  } else {
    if(!eventTitle||!venue||!city||!validDate(startsAt)||!validDate(endsAt)||endsAt<startsAt) return {error:"Complete the event title, venue, city, and valid dates.",success:""};
  }
  if (workStartsOn < eventFields.starts_at || workEndsOn > eventFields.ends_at) return { error: "Work days must fall within the event dates.", success: "" };

  const catalogColumn = eventFields.organizer_event_id ? "organizer_event_id" : "exhibitor_event_submission_id";
  const catalogId = eventFields.organizer_event_id ?? eventFields.exhibitor_event_submission_id;
  const findExisting = async () => {
    if (!catalogId || !requestedExhibitorId) return null;
    const { data } = await supabase.from("events").select("id").eq("exhibitor_id", requestedExhibitorId).eq(catalogColumn, catalogId).maybeSingle();
    return data;
  };
  let event = await findExisting();
  let createdEvent = false;
  if (!event) {
    const inserted = await supabase.from("events").insert({
      exhibitor_id: requestedExhibitorId,
      agency_id: profile?.role === "agency" ? agency?.id ?? null : null,
      ...eventFields,
      created_by: user.id,
      actor_id: user.id,
    }).select("id").single();
    event = inserted.data;
    createdEvent = Boolean(event);
    // The unique catalog index protects simultaneous requests for the same event.
    if (inserted.error?.code === "23505") event = await findExisting();
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
    hourly_rate: proposedRateMin??0,
    rate_mode:rateMode,
    proposed_rate_min:proposedRateMin,
    proposed_rate_max:proposedRateMax,
    shift_start: shiftStart,
    shift_end: shiftEnd,
    work_starts_on: workStartsOn,
    work_ends_on: workEndsOn,
    required_skills: String(formData.get("required_skills") ?? "")
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean),
    preferred_skills:String(formData.get("preferred_skills")??"").split(",").map(x=>x.trim()).filter(Boolean),
    required_languages:String(formData.get("required_languages")??"").split(",").map(x=>x.trim()).filter(Boolean),
    worker_standard:String(formData.get("worker_standard")??"").trim()||null,
    reporting_time:String(formData.get("reporting_time")??"")||null,
    working_hours:String(formData.get("working_hours")??"").trim()||null,
    gender_requirement:String(formData.get("gender_requirement")??"").trim()||null,
    age_requirement:String(formData.get("age_requirement")??"").trim()||null,
    dress_code:String(formData.get("dress_code")??"").trim()||null,
    benefits:String(formData.get("benefits")??"").trim()||null,
    special_instructions:String(formData.get("special_instructions")??"").trim()||null,
    application_deadline:String(formData.get("application_deadline")??"")||null,
    publication_status:"draft",
    operation_status:"requirement_received",
  }).select("id").single();

  if (error) {
    console.error(JSON.stringify({ event: "staffing_request_failed", stage: "role_insert", category: "database_error" }));
    if (createdEvent) {
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
  if(eventFields.verification_status!=="verified"){const {data:pending}=await supabase.from("verification_requests").select("id").eq("entity_type","event").eq("entity_id",event.id).eq("status","pending").maybeSingle();if(!pending)await supabase.from("verification_requests").insert({entity_type:"event",entity_id:event.id,requester_id:user.id,status:"pending",notes:"Staffing request submitted with an event requiring verification"});}
  return { error: "", success: eventFields.verification_status==="verified"?"Staffing request submitted.":"Staffing request submitted. The event is awaiting verification." };
}

export async function applyForRole(_state: WorkflowFormState, formData: FormData): Promise<WorkflowFormState> {
  const supabase = await createClient();
  if (!supabase) return { error: "Applications are temporarily unavailable.", success: "" };

  const user = await getCurrentAccount();

  if (!user) redirect("/login");
  const profile = await actor();
  const roleId = String(formData.get("staffing_role_id") ?? "");
  const { data: openRole } = await supabase.from("staffing_roles").select("id,work_starts_on,work_ends_on,required_skills,preferred_skills,required_languages").eq("id", roleId).eq("status", "open").maybeSingle();
  if (!canApply(profile.role,profile.verification_status,openRole ? "open" : "closed")) return { error: "A verified talent account and open role are required.", success: "" };
  const [profileData,contactData,talentData]=await Promise.all([
    supabase.from("profiles").select("avatar_url,home_location_id,profile_updated_at").eq("id",user.id).single(),
    supabase.from("contact_details").select("phone").eq("profile_id",user.id).maybeSingle(),
    supabase.from("talent_profiles").select("skills,languages,availability,documents_note").eq("profile_id",user.id).maybeSingle(),
  ]);
  if(profileData.error||contactData.error||talentData.error)return {error:"Unable to check your profile. Please retry.",success:""};
  const check=applicationProfileCheck({avatarUrl:profileData.data.avatar_url,homeLocationId:profileData.data.home_location_id,profileUpdatedAt:profileData.data.profile_updated_at,phone:contactData.data?.phone,skills:talentData.data?.skills,languages:talentData.data?.languages,availability:talentData.data?.availability,documentsNote:talentData.data?.documents_note},{requiredSkills:openRole!.required_skills,preferredSkills:openRole!.preferred_skills,requiredLanguages:openRole!.required_languages});
  if(!check.canApply)return {error:`Complete these required profile items first: ${check.required.join(", ")}.`,success:""};
  if(check.stale&&formData.get("profile_current")!=="1")return {error:"Review your profile or confirm that the current information is still accurate.",success:""};
  const {data:existing}=await supabase.from("applications").select("id,staffing_role_id,status").eq("talent_id",user.id).eq("status","assigned");
  if (existing?.length) {
    const {data:booked}=await supabase.from("staffing_roles").select("id,work_starts_on,work_ends_on").in("id",existing.map(item=>item.staffing_role_id));
    if (booked?.some(item=>workDaysOverlap(item,openRole!))) return {error:"You are already booked on one or more of these days.",success:""};
  }

  const coverNote = String(formData.get("cover_note") ?? "").trim();
  const noteCheck = containsContactDetails(coverNote);
  if (noteCheck.hasContact) {
    return { error: noteCheck.reason ?? "Phone numbers and email addresses are not allowed in cover notes.", success: "" };
  }

  const { error } = await supabase.from("applications").insert({
    staffing_role_id: roleId,
    talent_id: user.id,
    cover_note: coverNote,
  });

  if (error) return { error: "Unable to apply for this role. Check whether you have already applied and try again.", success: "" };
  revalidatePath("/browse");
  return { error: "", success: "Application sent." };
}

export async function updateApplicationStatus(_state: WorkflowFormState, formData: FormData): Promise<WorkflowFormState> {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const status = String(formData.get("status") ?? "applied") as ApplicationStatus;
  const agreedRateRaw=String(formData.get("agreed_rate")??"").trim();
  const agreedRate=agreedRateRaw?Number(agreedRateRaw):null;
  const applicationId = String(formData.get("application_id") ?? "");
  const profile = await actor();

  if (!applicationStatuses.includes(status)) {
    return { error: "Choose a valid application status.", success: "" };
  }
  if (!["exhibitor", "agency"].includes(profile.role)) return { error: "You cannot update this application.", success: "" };
  if(profile.role==="agency"&&status==="assigned"&&(agreedRate===null||!Number.isFinite(agreedRate)||agreedRate<0))return {error:"Enter the agreed worker payout before assigning.",success:""};
  const { data: application } = await supabase.from("applications").select("staffing_role_id,status,cancellation_requested_at").eq("id", applicationId).maybeSingle();
  if (!application || !await staffingOwner(supabase, application.staffing_role_id, profile.id)) return { error: "You cannot update this application.", success: "" };
  if (application.status === "assigned" && !["assigned","closed","completed","cancelled"].includes(status)) return {error:"Assigned bookings may only be completed, cancelled, or closed.",success:""};

  const { data: updated, error } = await supabase
    .from("applications")
    .update({ status, cancellation_requested_at: status === "closed" ? null : application.cancellation_requested_at, updated_at: new Date().toISOString() })
    .eq("id", applicationId).select("id").maybeSingle();

  if (error?.message.includes("Role is full")) return {error:"This role has no remaining openings.",success:""};
  if (error?.message.includes("Talent is already booked")) return {error:"This talent is already booked on those days.",success:""};
  if (error || !updated) return { error: "Unable to update this application. Please retry.", success: "" };
  if(profile.role==="agency"&&status==="assigned"&&agreedRate!==null){const {data:placement}=await supabase.from("placements").update({agreed_rate:agreedRate}).eq("application_id",applicationId).select("id").maybeSingle();if(placement)await supabase.from("settlement_payouts").update({amount:agreedRate}).eq("placement_id",placement.id);}
  revalidatePath("/dashboard/exhibitor");
  revalidatePath("/dashboard/exhibitor/applicants");
  revalidatePath(`/dashboard/exhibitor/requests/${application.staffing_role_id}`);
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
  if (!["talent", "exhibitor", "agency"].includes(profile.role)) return { error: "Only placement participants can submit reviews.", success: "" };
  const { data: placement } = await supabase.from("placements").select("talent_id,staffing_role_id,status").eq("id",placementId).maybeSingle();
  if (!placement || placement.status !== "completed" || (placement.talent_id !== profile.id && !await staffingOwner(supabase,placement.staffing_role_id,profile.id))) return { error: "A completed placement you participated in is required.", success: "" };
  const { data: placementRole } = await supabase.from("staffing_roles").select("event_id").eq("id",placement.staffing_role_id).maybeSingle();
  const { data: placementEvent } = placementRole ? await supabase.from("events").select("created_by,exhibitor_id").eq("id",placementRole.event_id).maybeSingle() : { data: null };
  const revieweeId = String(formData.get("reviewee_id") ?? "");
  const exhibitorPrincipal = String(formData.get("exhibitor_id") ?? placementEvent?.exhibitor_id ?? "");
  if (profile.role === "agency" && (!placementEvent?.exhibitor_id || exhibitorPrincipal !== placementEvent.exhibitor_id || !await canManageExhibitor(supabase,profile.id,exhibitorPrincipal))) return { error: "You cannot review for this exhibitor.", success: "" };
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
    actor_id: user.id,
    reviewer_exhibitor_id: profile.role === "talent" ? null : exhibitorPrincipal,
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
