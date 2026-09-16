"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function updateTalentPreferences(form:FormData) {
  const talent = await requireRole(["talent"]);
  const db = await createClient();
  if (!db) throw new Error("Preferences unavailable.");
  const {error} = await db.from("talent_job_preferences").upsert({talent_id:talent.id,is_online:form.get("is_online")==="true",notify_push:form.get("notify_push")==="true",updated_at:new Date().toISOString()});
  if (error) throw new Error("Unable to save preferences.");
  revalidatePath("/dashboard/talent");
}

export async function requestBookingCancellation(form:FormData) {
  const talent = await requireRole(["talent"]);
  const id = String(form.get("application_id") ?? "");
  const db = await createClient();
  if (!db) throw new Error("Booking unavailable.");
  const {data,error} = await db.from("applications").update({cancellation_requested_at:new Date().toISOString()}).eq("id",id).eq("talent_id",talent.id).eq("status","confirmed").select("id").maybeSingle();
  if (error || !data) throw new Error("Unable to request cancellation.");
  revalidatePath("/dashboard/talent");
}

export async function savePushSubscription(subscription:{endpoint:string;keys:{p256dh:string;auth:string}}) {
  const talent=await requireRole(["talent"]);
  let host="";
  try { host=new URL(subscription.endpoint).hostname; } catch { throw new Error("Invalid push subscription."); }
  const allowed=["fcm.googleapis.com","updates.push.services.mozilla.com","web.push.apple.com"];
  if (!subscription.endpoint.startsWith("https://") || !allowed.includes(host) || subscription.endpoint.length>2048 || !subscription.keys.p256dh || !subscription.keys.auth) throw new Error("Invalid push subscription.");
  const db=await createClient();
  if (!db) throw new Error("Push unavailable.");
  const {data:existing}=await db.from("talent_push_subscriptions").select("talent_id").eq("endpoint",subscription.endpoint).maybeSingle();
  if (existing && existing.talent_id!==talent.id) throw new Error("Subscription belongs to another account.");
  const {error}=await db.from("talent_push_subscriptions").upsert({talent_id:talent.id,endpoint:subscription.endpoint,p256dh:subscription.keys.p256dh,auth_secret:subscription.keys.auth},{onConflict:"endpoint"});
  if (error) throw new Error("Unable to save push subscription.");
}
