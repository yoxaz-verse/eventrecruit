"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { invalidatePublicData, PUBLIC_CACHE_TAGS } from "@/lib/public-data";

export async function requestParticipation(form: FormData) {
  const profile = await requireRole(["exhibitor"]);
  const eventId = String(form.get("event_id") ?? "");
  const db = await createClient();
  if (!db) throw new Error("Participation is unavailable.");
  const {data:event} = await db.from("organizer_events").select("id,ends_at").eq("id",eventId).eq("status","published").maybeSingle();
  const {data:exhibitor} = await db.from("exhibitors").select("id").eq("owner_id",profile.id).maybeSingle();
  if (!event || !exhibitor || event.ends_at < new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"})) throw new Error("Event is unavailable.");
  const {data:existing} = await db.from("exhibitor_event_participation").select("id").eq("event_id",eventId).eq("exhibitor_id",exhibitor.id).maybeSingle();
  if (existing) return;
  const {error} = await db.from("exhibitor_event_participation").insert({event_id:eventId,exhibitor_id:exhibitor.id,status:"pending"});
  if (error) throw new Error("Unable to request participation.");
  revalidatePath(`/events/${eventId}`);
}

export async function reviewParticipation(form: FormData) {
  const profile = await requireRole(["organizer"]);
  const id = String(form.get("participation_id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!["approved","rejected"].includes(status)) throw new Error("Invalid status.");
  const db = await createClient();
  if (!db) throw new Error("Participation is unavailable.");
  const {data:participation} = await db.from("exhibitor_event_participation").select("id,event_id").eq("id",id).maybeSingle();
  const {data:event} = participation ? await db.from("organizer_events").select("id,company_id").eq("id",participation.event_id).maybeSingle() : {data:null};
  const {data:company} = await db.from("organizer_companies").select("id").eq("owner_id",profile.id).maybeSingle();
  if (!event || event.company_id !== company?.id) throw new Error("Not authorized.");
  const {error} = await db.from("exhibitor_event_participation").update({status,reviewed_at:new Date().toISOString()}).eq("id",id);
  if (error) throw new Error("Unable to review participation.");
  revalidatePath(`/events/${event.id}`);
  revalidatePath("/events");
  invalidatePublicData(PUBLIC_CACHE_TAGS.participation);
}
