"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { normalizeCustomAmenities, validDate, validEventAmenities } from "@/lib/organizer";
import { todayInIndia } from "@/lib/exhibitor-listings";
import { isUpcomingDateRange } from "@/lib/event-selection";
import { canManageExhibitor } from "@/lib/agency-workspace";
import { parseLockedLocation } from "@/lib/location";
import { resolveActiveLocations } from "@/lib/locations";
import { invalidatePublicData, PUBLIC_CACHE_TAGS } from "@/lib/public-data";

export type ExhibitorEventFormState = { error: string };

function logSubmissionFailure(stage: string, error: { code?: string; message?: string } | null) {
  console.error("Exhibitor event submission failed", {
    stage,
    code: error?.code ?? "unknown",
    message: error?.message ?? "No database error was returned",
  });
}

export async function submitExhibitorEvent(_state: ExhibitorEventFormState, formData: FormData): Promise<ExhibitorEventFormState> {
  const profile = await requireRole(["exhibitor","agency"]);
  const db = await createClient();
  if (!db) return { error: "Event submission is temporarily unavailable. Please try again." };
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const locationId = String(formData.get("location_id") ?? "").trim();
  const catalogLocations=locationId?await resolveActiveLocations([locationId]):[];
  if(!locationId || !catalogLocations) return { error: "Choose an active city from the list." };
  const city=String(formData.get("city")??"").trim();
  const starts_at = String(formData.get("starts_at") ?? "");
  const ends_at = String(formData.get("ends_at") ?? "");
  const amenities = formData.getAll("amenities").map(String);
  const rawCustomAmenities = formData.getAll("custom_amenities").map(String);
  const customAmenities = normalizeCustomAmenities(rawCustomAmenities);
  const location = parseLockedLocation(formData);
  if (!title || title.length > 160) return { error: "Enter an event title within 160 characters." };
  if (!venue || venue.length > 200 || !city || city.length > 120) return { error: "Choose and lock a complete venue location." };
  if (description.length > 10000) return { error: "Keep the event description within 10,000 characters." };
  if (!validDate(starts_at) || !validDate(ends_at) || !isUpcomingDateRange(starts_at, ends_at, todayInIndia())) return { error: "Use current or upcoming dates, with the end date on or after the start date." };
  if (!location.valid) return { error: "Choose and lock an Indian venue location before submitting." };
  if (!validEventAmenities(amenities, rawCustomAmenities)) return { error: "Choose valid amenities and add no more than 10 unique custom amenities." };
  const { data: owned, error: ownerError } = await db.from("exhibitors").select("id").eq("owner_id", profile.id).maybeSingle();
  if (ownerError) {
    logSubmissionFailure("load_exhibitor", ownerError);
    return { error: "Unable to verify your exhibitor profile. Please try again." };
  }
  const exhibitorId = profile.role === "agency" ? String(formData.get("exhibitor_id") ?? "") : owned?.id ?? "";
  const exhibitor = exhibitorId && await canManageExhibitor(db, profile.id, exhibitorId) ? {id:exhibitorId} : null;
  if (!exhibitor) return { error: profile.role === "agency" ? "You no longer have access to submit events for this exhibitor." : "Complete your exhibitor profile first." };
  const { error } = await db.from("exhibitor_event_submissions").insert({ exhibitor_id: exhibitor.id, actor_id: profile.id, title, description, venue, city, location_id:locationId||null, latitude:location.latitude, longitude:location.longitude, location_label:location.locationLabel, location_country_code:location.countryCode, starts_at, ends_at, amenities, custom_amenities:customAmenities, status: "pending" });
  if (error) {
    logSubmissionFailure("insert_submission", error);
    return { error: "Unable to submit the event right now. Your details are still here; please try again." };
  }
  revalidatePath("/dashboard/exhibitor/events");
  revalidatePath("/dashboard/admin/events");
  redirect(profile.role === "agency" ? `/dashboard/agency/events?client=${exhibitor.id}&submitted=1` : "/dashboard/exhibitor/events?submitted=1");
}

export async function reviewExhibitorEvent(formData: FormData) {
  const admin = await requireRole(["admin"]);
  const db = await createClient();
  if (!db) throw new Error("Review is temporarily unavailable.");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id) || !["approved", "rejected"].includes(status)) throw new Error("Invalid review action.");
  if (status === "approved") {
    const { data: pending, error: loadError } = await db.from("exhibitor_event_submissions").select("starts_at,ends_at").eq("id", id).eq("status", "pending").maybeSingle();
    if (loadError || !pending || !isUpcomingDateRange(pending.starts_at, pending.ends_at, todayInIndia())) throw new Error("This event has ended and cannot be approved.");
  }
  let update = db.from("exhibitor_event_submissions").update({ status, reviewed_by: admin.id, reviewed_at: new Date().toISOString() }).eq("id", id).eq("status", "pending");
  if (status === "approved") update = update.gte("ends_at", todayInIndia());
  const { data, error } = await update.select("id").maybeSingle();
  if (error || !data) throw new Error("Event is no longer pending or could not be reviewed.");
  invalidatePublicData(PUBLIC_CACHE_TAGS.submissions);
  for (const path of ["/dashboard/admin/events", "/dashboard/exhibitor/events", "/dashboard/exhibitor/requests/new", "/events", "/"]) revalidatePath(path, "page");
}
