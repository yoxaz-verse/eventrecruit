"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { validDate } from "@/lib/organizer";

export async function submitExhibitorEvent(formData: FormData) {
  const profile = await requireRole(["exhibitor"]);
  const db = await createClient();
  if (!db) throw new Error("Event submission is temporarily unavailable.");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const starts_at = String(formData.get("starts_at") ?? "");
  const ends_at = String(formData.get("ends_at") ?? "");
  if (!title || title.length > 160 || !venue || venue.length > 200 || !city || city.length > 120 || description.length > 10000 || !validDate(starts_at) || !validDate(ends_at) || ends_at < starts_at) throw new Error("Check the event details and dates.");
  const { data: exhibitor } = await db.from("exhibitors").select("id").eq("owner_id", profile.id).maybeSingle();
  if (!exhibitor) throw new Error("Complete your exhibitor profile first.");
  const { error } = await db.from("exhibitor_event_submissions").insert({ exhibitor_id: exhibitor.id, title, description, venue, city, starts_at, ends_at, status: "pending" });
  if (error) throw new Error("Unable to submit event.");
  revalidatePath("/dashboard/exhibitor/events");
  revalidatePath("/dashboard/admin/events");
  redirect("/dashboard/exhibitor/events?submitted=1");
}

export async function reviewExhibitorEvent(formData: FormData) {
  const admin = await requireRole(["admin"]);
  const db = await createClient();
  if (!db) throw new Error("Review is temporarily unavailable.");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id) || !["approved", "rejected"].includes(status)) throw new Error("Invalid review action.");
  const { data, error } = await db.from("exhibitor_event_submissions").update({ status, reviewed_by: admin.id, reviewed_at: new Date().toISOString() }).eq("id", id).eq("status", "pending").select("id").maybeSingle();
  if (error || !data) throw new Error("Event is no longer pending or could not be reviewed.");
  for (const path of ["/dashboard/admin/events", "/dashboard/exhibitor/events", "/dashboard/exhibitor/requests/new", "/events", "/"]) revalidatePath(path);
}
