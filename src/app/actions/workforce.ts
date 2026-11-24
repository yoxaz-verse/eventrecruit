"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { validDate } from "@/lib/organizer";
import { containsContactDetails } from "@/lib/contact-detector";

export type WorkforceState = { error: string; success: string };
const value = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const uuid = /^[0-9a-f-]{36}$/i;

export async function createWorkforceOpening(_state: WorkforceState, data: FormData): Promise<WorkforceState> {
  const profile = await requireRole(["organizer"]), db = await createClient();
  if (!db) return { error: "Workforce services are unavailable.", success: "" };
  const eventId = value(data, "organizer_event_id"), opportunityType = value(data, "opportunity_type"), title = value(data, "title"), description = value(data, "description");
  const start = value(data, "work_starts_on"), end = value(data, "work_ends_on"), shiftStart = value(data, "shift_start"), shiftEnd = value(data, "shift_end"), headcount = Number(value(data, "headcount"));
  if (!uuid.test(eventId) || !["paid", "volunteer"].includes(opportunityType)) return { error: "Choose a valid event and opening type.", success: "" };
  if (!title || title.length > 160 || containsContactDetails(`${title} ${description}`).hasContact) return { error: "Enter a valid title and description without direct contact details.", success: "" };
  if (!validDate(start) || !validDate(end) || end < start || !/^([01]\d|2[0-3]):[0-5]\d$/.test(shiftStart) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(shiftEnd) || !Number.isInteger(headcount) || headcount < 1) return { error: "Check the work dates, shift, and headcount.", success: "" };
  const { data: event } = await db.from("organizer_events").select("id,title,venue,city,location_id,latitude,longitude,location_label,map_url,starts_at,ends_at,status,company_id,organizer_company_memberships!inner(profile_id)").eq("id", eventId).eq("organizer_company_memberships.profile_id", profile.id).maybeSingle();
  if (!event) return { error: "You cannot manage this event.", success: "" };
  if (!event.starts_at || !event.ends_at || start < event.starts_at || end > event.ends_at) return { error: "Work dates must fall within the event dates.", success: "" };
  const rateMode = value(data, "rate_mode") || "fixed", min = value(data, "proposed_rate_min") ? Number(value(data, "proposed_rate_min")) : null, max = value(data, "proposed_rate_max") ? Number(value(data, "proposed_rate_max")) : min;
  if (opportunityType === "paid" && (!["fixed", "range", "negotiable"].includes(rateMode) || (rateMode !== "negotiable" && (min === null || max === null || !Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min)))) return { error: "Paid staff openings require a valid fixed, ranged, or negotiable rate.", success: "" };
  let operational = (await db.from("events").select("id").eq("organizer_event_id", event.id).is("exhibitor_id", null).maybeSingle()).data;
  if (!operational) {
    const inserted = await db.from("events").insert({ organizer_event_id: event.id, organizer_company_id: event.company_id, title: event.title, venue: event.venue, city: event.city, location_id: event.location_id, latitude: event.latitude, longitude: event.longitude, location_label: event.location_label, map_url: event.map_url, starts_at: event.starts_at, ends_at: event.ends_at, verification_status: event.status === "published" ? "verified" : "pending", created_by: profile.id, actor_id: profile.id, payer_type: "organizer" }).select("id").single();
    operational = inserted.data;
    if (inserted.error?.code === "23505") operational = (await db.from("events").select("id").eq("organizer_event_id", event.id).is("exhibitor_id", null).single()).data;
  }
  if (!operational) return { error: "Unable to prepare this event for workforce openings.", success: "" };
  const split = (key: string) => value(data, key).split(",").map(x=>x.trim()).filter(Boolean);
  const volunteer = opportunityType === "volunteer";
  const { error } = await db.from("staffing_roles").insert({ event_id: operational.id, opportunity_type: opportunityType, title, description, headcount, hourly_rate: volunteer ? 0 : min ?? 0, rate_mode: volunteer ? "fixed" : rateMode, proposed_rate_min: volunteer ? null : min, proposed_rate_max: volunteer ? null : max, shift_start: shiftStart, shift_end: shiftEnd, work_starts_on: start, work_ends_on: end, required_skills: split("required_skills"), preferred_skills: split("preferred_skills"), required_languages: split("required_languages"), benefits: value(data, "benefits") || null, special_instructions: value(data, "special_instructions") || null, application_deadline: value(data, "application_deadline") || null, publication_status: "published", published_at: new Date().toISOString(), operation_status: "requirement_received", status: "open" });
  if (error) return { error: "Unable to create the workforce opening.", success: "" };
  revalidatePath(`/dashboard/organizer/events/${eventId}/workforce`); revalidatePath("/dashboard/talent"); revalidatePath("/browse");
  return { error: "", success: `${volunteer ? "Volunteer" : "Paid staff"} opening published.` };
}

export async function closeWorkforceOpening(data: FormData) {
  const profile = await requireRole(["organizer"]), db = await createClient(); if (!db) throw new Error("Unavailable.");
  const roleId = value(data, "role_id"), eventId = value(data, "event_id"); if (!uuid.test(roleId) || !uuid.test(eventId)) throw new Error("Invalid opening.");
  const { data: owned } = await db.from("staffing_roles").select("id,events!inner(organizer_event_id,organizer_events!inner(company_id,organizer_company_memberships!inner(profile_id)))").eq("id", roleId).eq("events.organizer_event_id", eventId).eq("events.organizer_events.organizer_company_memberships.profile_id", profile.id).maybeSingle();
  if (!owned) throw new Error("Forbidden.");
  await db.from("staffing_roles").update({ status: "closed" }).eq("id", roleId);
  revalidatePath(`/dashboard/organizer/events/${eventId}/workforce`); revalidatePath("/dashboard/talent");
}
