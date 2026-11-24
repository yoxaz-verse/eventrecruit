"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createPlatformNotification } from "@/lib/platform-notifications";

export async function reviewVerification(formData: FormData) {
  const admin = await requireRole(["admin"]);
  const id = String(formData.get("verification_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["verified", "rejected"].includes(decision)) throw new Error("Invalid decision.");
  if (decision === "rejected" && !reason) throw new Error("Add a reason before rejecting this verification.");
  const db = await createClient();
  if (!db) throw new Error("Verification unavailable.");
  const { data: request } = await db.from("verification_requests").select("id,entity_type,entity_id,status").eq("id", id).maybeSingle();
  if (!request || request.status !== "pending") throw new Error("Verification request is no longer pending.");
  const reviewedAt = new Date().toISOString();
  const { data: reviewed, error } = await db.from("verification_requests").update({ status: decision, reviewer_id: admin.id, reviewed_at: reviewedAt, updated_at: reviewedAt }).eq("id", id).eq("status", "pending").select("id").maybeSingle();
  if (error || !reviewed) throw new Error("Verification request is no longer pending.");

  let recipientId: string | null = null;
  if (request.entity_type === "event") {
    await db.from("events").update({ verification_status: decision }).eq("id", request.entity_id);
  }
  if (request.entity_type === "sponsor_agency") {
    const { data: agency } = await db.from("sponsor_agencies").update({ verification_status: decision, updated_at: reviewedAt }).eq("id", request.entity_id).select("owner_id").maybeSingle();
    recipientId = agency?.owner_id ?? null;
  }
  await db.from("workflow_activity").insert({ actor_id: admin.id, subject_type: `verification:${request.entity_type}`, subject_id: request.entity_id, previous_status: "pending", next_status: decision, reason: reason || null });
  if (recipientId) await createPlatformNotification({
    profileId: recipientId,
    category: "verification",
    title: decision === "verified" ? "Verification approved" : "Verification needs attention",
    body: decision === "verified" ? "Your organization verification has been approved." : `Your verification was not approved.${reason ? ` ${reason}` : ""}`,
    actionHref: "/dashboard/sponsor_agency/profile",
    relatedType: request.entity_type,
    relatedId: request.entity_id,
    deduplicationKey: `verification:${request.id}:${decision}`,
  });
  revalidatePath("/dashboard/admin/verifications");
  revalidatePath("/dashboard/admin/organizations");
  if (recipientId) revalidatePath("/dashboard/sponsor_agency", "layout");
}
