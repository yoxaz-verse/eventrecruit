"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export type AgencyClientState = { error: string; success: string };

async function agencyActor() {
  const profile = await requireRole(["agency"]);
  const db = await createClient();
  if (!db) throw new Error("Workspace is temporarily unavailable.");
  const { data: agency } = await db.from("agencies").select("id,name").eq("owner_id", profile.id).maybeSingle();
  if (!agency) throw new Error("Complete your agency profile first.");
  return { profile, db, agency };
}

export async function createExternalClient(_state: AgencyClientState, formData: FormData): Promise<AgencyClientState> {
  const { profile, db, agency } = await agencyActor();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const companyType=String(formData.get("company_type")??"").trim(),primaryContactName=String(formData.get("primary_contact_name")??"").trim(),contactPhone=String(formData.get("contact_phone")??"").trim(),contactEmail=String(formData.get("contact_email")??"").trim().toLowerCase();
  const claimEmail = String(formData.get("claim_email") ?? "").trim().toLowerCase();
  if (!companyName || companyName.length > 160 || industry.length > 160 || companyType.length>120||primaryContactName.length>160||contactPhone.length>40||(contactEmail&&!emailPattern.test(contactEmail)) || (claimEmail && !emailPattern.test(claimEmail))) return { error: "Enter valid client and contact details.", success: "" };
  const {data:duplicate}=await db.from("exhibitors").select("id").ilike("company_name",companyName).limit(1).maybeSingle();
  if(duplicate)return {error:"A matching client already exists. Invite or link the existing platform client instead.",success:""};
  const { data: exhibitor, error } = await db.from("exhibitors").insert({ owner_id: null, company_name: companyName, industry: industry || null, company_type:companyType||null,primary_contact_name:primaryContactName||null,contact_phone:contactPhone||null,contact_email:contactEmail||null,kind: "external", created_by_agency_id: agency.id, claim_email: claimEmail || null, verification_status: "pending_verification" }).select("id").single();
  if (error || !exhibitor) return { error: "Unable to create this client. The claim email may already be in use.", success: "" };
  const linked = await db.from("agency_exhibitor_relationships").insert({ agency_id: agency.id, exhibitor_id: exhibitor.id, status: "active", invited_email: claimEmail || null, invited_by: profile.id, responded_by: profile.id, responded_at: new Date().toISOString() });
  if (linked.error) return { error: "Client created, but agency access could not be activated.", success: "" };
  await db.from("exhibitor_reputation").insert({ exhibitor_id: exhibitor.id });
  revalidatePath("/dashboard/agency");
  revalidatePath("/dashboard/agency/clients");
  return { error: "", success: "External exhibitor created." };
}

export async function invitePlatformExhibitor(_state: AgencyClientState, formData: FormData): Promise<AgencyClientState> {
  const { profile, db, agency } = await agencyActor();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!emailPattern.test(email)) return { error: "Enter a valid registered email.", success: "" };
  const generic = { error: "", success: "If that email belongs to an exhibitor, an invitation is now available in their dashboard." };
  const { data: account } = await db.from("app_accounts").select("id").eq("email", email).maybeSingle();
  if (!account) return generic;
  const { data: exhibitor } = await db.from("exhibitors").select("id").eq("owner_id", account.id).maybeSingle();
  if (!exhibitor) return generic;
  const { data: existing } = await db.from("agency_exhibitor_relationships").select("id,status").eq("agency_id", agency.id).eq("exhibitor_id", exhibitor.id).maybeSingle();
  if (existing?.status === "active" || existing?.status === "pending") return generic;
  const values = { status: "pending", invited_email: email, invited_by: profile.id, responded_by: null, responded_at: null, revoked_by: null, revoked_at: null, updated_at: new Date().toISOString() };
  const result = existing ? await db.from("agency_exhibitor_relationships").update(values).eq("id", existing.id) : await db.from("agency_exhibitor_relationships").insert({ agency_id: agency.id, exhibitor_id: exhibitor.id, ...values });
  if (result.error) return { error: "Unable to send the invitation. Please retry.", success: "" };
  revalidatePath("/dashboard/agency/clients");
  revalidatePath("/dashboard/exhibitor/agencies");
  return generic;
}

export async function respondToAgencyInvitation(formData: FormData) {
  const profile = await requireRole(["exhibitor"]);
  const db = await createClient(); if (!db) throw new Error("Workspace unavailable.");
  const id = String(formData.get("relationship_id") ?? ""), response = String(formData.get("response") ?? "");
  if (!uuid.test(id) || !["active","declined"].includes(response)) throw new Error("Invalid invitation response.");
  const { data: exhibitor } = await db.from("exhibitors").select("id").eq("owner_id", profile.id).maybeSingle();
  const { data, error } = exhibitor ? await db.from("agency_exhibitor_relationships").update({ status: response, responded_by: profile.id, responded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).eq("exhibitor_id", exhibitor.id).eq("status", "pending").select("id").maybeSingle() : { data: null, error: null };
  if (error || !data) throw new Error("Invitation is no longer available.");
  revalidatePath("/dashboard/exhibitor/agencies"); revalidatePath("/dashboard/agency/clients");
}

export async function updateAgencyRelationship(formData: FormData) {
  const intent = String(formData.get("intent") ?? "");
  const relationshipId = String(formData.get("relationship_id") ?? "");
  if (!uuid.test(relationshipId)) throw new Error("Invalid relationship.");
  const db = await createClient(); if (!db) throw new Error("Workspace unavailable.");
  if (intent === "revoke") {
    const profile = await requireRole(["exhibitor"]);
    const { data: exhibitor } = await db.from("exhibitors").select("id").eq("owner_id", profile.id).maybeSingle();
    const { data } = exhibitor ? await db.from("agency_exhibitor_relationships").update({ status: "revoked", revoked_by: profile.id, revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", relationshipId).eq("exhibitor_id", exhibitor.id).eq("status", "active").select("id").maybeSingle() : { data: null };
    if (!data) throw new Error("Relationship could not be revoked.");
  } else {
    const { profile, agency } = await agencyActor();
    const next = intent === "cancel" ? "revoked" : intent === "resend" ? "pending" : null;
    if (!next) throw new Error("Invalid relationship action.");
    const update = next === "revoked" ? { status: next, revoked_by: profile.id, revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() } : { status: next, updated_at: new Date().toISOString() };
    const { data } = await db.from("agency_exhibitor_relationships").update(update).eq("id", relationshipId).eq("agency_id", agency.id).eq("status", "pending").select("id").maybeSingle();
    if (!data) throw new Error("Invitation could not be updated.");
  }
  revalidatePath("/dashboard/agency/clients"); revalidatePath("/dashboard/exhibitor/agencies");
  redirect(intent === "revoke" ? "/dashboard/exhibitor/agencies" : "/dashboard/agency/clients");
}
