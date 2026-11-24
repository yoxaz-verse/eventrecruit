"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { validBrandImageSignature } from "@/lib/image-upload";
import { deleteR2Object, putR2Object } from "@/lib/r2";

export type SponsorActionState = { error: string; success: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const value = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const amount = (data: FormData, key: string) => value(data, key) ? Number(value(data, key)) : null;
function httpsUrl(raw: string) { if (!raw) return null; try { const url = new URL(raw); return url.protocol === "https:" ? url.toString() : undefined; } catch { return undefined; } }

async function sponsorContext() {
  const profile = await requireRole(["sponsor_agency"]);
  const db = await createClient();
  if (!db) throw new Error("Sponsor services are unavailable.");
  const { data: agency } = await db.from("sponsor_agencies").select("*").eq("owner_id", profile.id).maybeSingle();
  if (!agency) redirect("/onboarding");
  return { profile, db, agency };
}

async function organizerOwnsEvent(eventId: string) {
  const profile = await requireRole(["organizer"]);
  const db = await createClient();
  if (!db) throw new Error("Organizer services are unavailable.");
  const { data: event } = await db.from("organizer_events").select("id,company_id,organizer_company_memberships!inner(profile_id)").eq("id", eventId).eq("organizer_company_memberships.profile_id", profile.id).maybeSingle();
  return { profile, db, event };
}

async function replaceImage(file: FormDataEntryValue | null, remove: boolean, current: string | null, prefix: string) {
  if (!(file instanceof File) || file.size === 0) {
    if (remove) await deleteR2Object(current);
    return remove ? null : current;
  }
  if (!await validBrandImageSignature(file)) throw new Error("Upload a browser-compressed WebP image no larger than 500 KB.");
  const path = `${prefix}/${crypto.randomUUID()}.webp`;
  await putR2Object(path, file);
  await deleteR2Object(current);
  return path;
}

export async function saveSponsorAgencyProfile(_state: SponsorActionState, data: FormData): Promise<SponsorActionState> {
  try {
    const { profile, db, agency } = await sponsorContext();
    const name = value(data, "name"), city = value(data, "city"), description = value(data, "description"), phone = value(data, "contact_phone");
    const website = httpsUrl(value(data, "website"));
    if (name.length < 2 || name.length > 160 || !city || city.length > 120 || !phone || phone.length > 40 || description.length > 5000) return { error: "Complete the required agency fields within their limits.", success: "" };
    if (website === undefined) return { error: "Website must be a valid HTTPS URL.", success: "" };
    const logoPath = await replaceImage(data.get("logo"), data.get("remove_logo") === "1", agency.logo_path, `sponsor_agencies/${agency.id}`);
    const { error } = await db.from("sponsor_agencies").update({ name, city, description, contact_phone: phone, website, logo_path: logoPath, updated_at: new Date().toISOString() }).eq("id", agency.id).eq("owner_id", profile.id);
    if (error) return { error: "Unable to save the sponsor agency profile.", success: "" };
    await db.from("profiles").update({ city }).eq("id", profile.id);
    await db.from("contact_details").upsert({ profile_id: profile.id, phone });
    revalidatePath("/dashboard/sponsor_agency", "layout");
    return { error: "", success: "Agency profile saved." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to save the agency.", success: "" }; }
}

export async function saveSponsorBrand(_state: SponsorActionState, data: FormData): Promise<SponsorActionState> {
  try {
    const { db, agency } = await sponsorContext();
    const id = value(data, "id"), name = value(data, "name"), industry = value(data, "industry"), description = value(data, "description");
    const website = httpsUrl(value(data, "website"));
    if (id && !uuid.test(id)) return { error: "Invalid brand.", success: "" };
    if (name.length < 2 || name.length > 160 || industry.length > 160 || description.length > 5000) return { error: "Enter a valid brand name and details.", success: "" };
    if (website === undefined) return { error: "Brand website must use HTTPS.", success: "" };
    const current = id ? (await db.from("sponsor_brands").select("id,logo_path").eq("id", id).eq("agency_id", agency.id).maybeSingle()).data : null;
    if (id && !current) return { error: "You cannot edit this brand.", success: "" };
    const brandId = id || crypto.randomUUID();
    const logoPath = await replaceImage(data.get("logo"), data.get("remove_logo") === "1", current?.logo_path ?? null, `sponsor_brands/${brandId}`);
    const payload = { agency_id: agency.id, name, industry, description, website, contact_name: value(data, "contact_name"), contact_email: value(data, "contact_email"), contact_phone: value(data, "contact_phone"), logo_path: logoPath, is_active: data.get("is_active") !== "0", updated_at: new Date().toISOString() };
    const result = current ? await db.from("sponsor_brands").update(payload).eq("id", brandId).eq("agency_id", agency.id) : await db.from("sponsor_brands").insert({ id: brandId, ...payload });
    if (result.error) return { error: result.error.code === "23505" ? "This agency already has a brand with that name." : "Unable to save the sponsor brand.", success: "" };
    revalidatePath("/dashboard/sponsor_agency/brands");
    return { error: "", success: "Sponsor brand saved." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to save the brand.", success: "" }; }
}

export async function saveSponsorshipSettings(_state: SponsorActionState, data: FormData): Promise<SponsorActionState> {
  const eventId = value(data, "event_id");
  if (!uuid.test(eventId)) return { error: "Invalid event.", success: "" };
  const { db, event } = await organizerOwnsEvent(eventId);
  if (!event) return { error: "You cannot manage this event.", success: "" };
  const acceptsCash = data.get("accepts_cash") === "on", acceptsInKind = data.get("accepts_in_kind") === "on";
  const target = amount(data, "target_amount"), deadline = value(data, "response_deadline");
  if (!acceptsCash && !acceptsInKind) return { error: "Accept cash, in-kind support, or both.", success: "" };
  if (target !== null && (!Number.isFinite(target) || target < 0)) return { error: "Enter a valid target amount.", success: "" };
  const { error } = await db.from("event_sponsorship_settings").upsert({ event_id: eventId, is_enabled: data.get("is_enabled") === "on", brief: value(data, "brief"), target_amount: target, accepts_cash: acceptsCash, accepts_in_kind: acceptsInKind, accepts_custom_proposals: data.get("accepts_custom_proposals") === "on", response_deadline: deadline || null, desired_industries: value(data, "desired_industries").split(",").map(x => x.trim()).filter(Boolean), updated_at: new Date().toISOString() });
  if (error) return { error: "Unable to save sponsorship settings.", success: "" };
  revalidatePath(`/dashboard/organizer/events/${eventId}/sponsors`); revalidatePath(`/events/${eventId}`);
  return { error: "", success: "Sponsorship opportunity saved." };
}

export async function saveSponsorshipPackage(_state: SponsorActionState, data: FormData): Promise<SponsorActionState> {
  const eventId = value(data, "event_id"), id = value(data, "id");
  if (!uuid.test(eventId) || (id && !uuid.test(id))) return { error: "Invalid package.", success: "" };
  const { db, event } = await organizerOwnsEvent(eventId);
  if (!event) return { error: "You cannot manage this event.", success: "" };
  const name = value(data, "name"), price = amount(data, "price"), slots = Number(value(data, "available_slots") || 1), priority = Number(value(data, "display_priority") || 0);
  if (!name || name.length > 160 || (price !== null && (!Number.isFinite(price) || price < 0)) || !Number.isInteger(slots) || slots < 1 || slots > 10000 || !Number.isInteger(priority)) return { error: "Check the package name, price, capacity, and priority.", success: "" };
  const payload = { event_id: eventId, name, description: value(data, "description"), price, benefits: value(data, "benefits"), deliverables: value(data, "deliverables"), available_slots: slots, display_priority: priority, is_active: data.get("is_active") !== "0", updated_at: new Date().toISOString() };
  const result = id ? await db.from("sponsorship_packages").update(payload).eq("id", id).eq("event_id", eventId) : await db.from("sponsorship_packages").insert(payload);
  if (result.error) return { error: result.error.code === "23505" ? "Package names must be unique for an event." : "Unable to save the package.", success: "" };
  revalidatePath(`/dashboard/organizer/events/${eventId}/sponsors`);
  return { error: "", success: "Sponsorship package saved." };
}

export async function submitSponsorshipProposal(_state: SponsorActionState, data: FormData): Promise<SponsorActionState> {
  const { profile, db, agency } = await sponsorContext();
  if (agency.verification_status !== "verified") return { error: "Your sponsor agency must be verified before pitching events.", success: "" };
  const eventId = value(data, "event_id"), brandId = value(data, "brand_id"), packageId = value(data, "package_id");
  if (![eventId, brandId].every(uuid.test) || (packageId && !uuid.test(packageId))) return { error: "Choose a valid event, brand, and package.", success: "" };
  const [{ data: brand }, { data: setting }, { data: event }] = await Promise.all([
    db.from("sponsor_brands").select("id").eq("id", brandId).eq("agency_id", agency.id).eq("is_active", true).maybeSingle(),
    db.from("event_sponsorship_settings").select("*").eq("event_id", eventId).eq("is_enabled", true).maybeSingle(),
    db.from("organizer_events").select("id,status").eq("id", eventId).eq("status", "published").maybeSingle(),
  ]);
  if (!brand || !setting || !event || (setting.response_deadline && setting.response_deadline < new Date().toISOString().slice(0, 10))) return { error: "This sponsorship opportunity is unavailable.", success: "" };
  if (!packageId && !setting.accepts_custom_proposals) return { error: "This event accepts package proposals only.", success: "" };
  if (packageId && !(await db.from("sponsorship_packages").select("id").eq("id", packageId).eq("event_id", eventId).eq("is_active", true).maybeSingle()).data) return { error: "The selected package is unavailable.", success: "" };
  const cash = amount(data, "cash_amount"), inKind = amount(data, "in_kind_value"), inKindItems = value(data, "in_kind_items");
  if ((cash === null && inKind === null) || (cash !== null && (!setting.accepts_cash || cash < 0)) || (inKind !== null && (!setting.accepts_in_kind || inKind < 0 || !inKindItems))) return { error: "Enter an accepted cash or in-kind contribution.", success: "" };
  const terms = { cash_amount: cash, in_kind_items: inKindItems, in_kind_value: inKind, proposed_benefits: value(data, "proposed_benefits"), deliverables: value(data, "deliverables"), notes: value(data, "notes"), valid_until: value(data, "valid_until") || null };
  const { data: proposal, error } = await db.from("sponsorship_proposals").insert({ event_id: eventId, package_id: packageId || null, agency_id: agency.id, brand_id: brandId, status: "submitted", ...terms, submitted_at: new Date().toISOString() }).select("id,revision").single();
  if (error || !proposal) return { error: error?.code === "23505" ? "This brand already has a proposal for the event." : "Unable to submit the proposal.", success: "" };
  await db.from("sponsorship_proposal_revisions").insert({ proposal_id: proposal.id, revision: proposal.revision, terms, created_by: profile.id });
  await db.from("sponsorship_audit_log").insert({ proposal_id: proposal.id, actor_id: profile.id, action: "submitted", details: terms });
  const { data: memberships } = await db.from("organizer_company_memberships").select("profile_id,organizer_companies!inner(organizer_events!inner(id))").eq("organizer_companies.organizer_events.id", eventId);
  if (memberships?.length) await db.from("sponsorship_notifications").insert(memberships.map(row => ({ profile_id: row.profile_id, proposal_id: proposal.id, message: "A sponsor proposal was submitted for your event." })));
  revalidatePath("/dashboard/sponsor_agency/proposals"); revalidatePath(`/dashboard/organizer/events/${eventId}/sponsors`);
  return { error: "", success: "Proposal submitted." };
}

export async function reviseSponsorshipProposal(_state: SponsorActionState, data: FormData): Promise<SponsorActionState> {
  const { profile, db, agency } = await sponsorContext();
  if (agency.verification_status !== "verified") return { error: "Agency verification is required.", success: "" };
  const proposalId = value(data, "proposal_id"); if (!uuid.test(proposalId)) return { error: "Invalid proposal.", success: "" };
  const { data: proposal } = await db.from("sponsorship_proposals").select("id,event_id,status,revision").eq("id", proposalId).eq("agency_id", agency.id).maybeSingle();
  if (!proposal || proposal.status !== "changes_requested") return { error: "This proposal is not open for revision.", success: "" };
  const { data: settings } = await db.from("event_sponsorship_settings").select("accepts_cash,accepts_in_kind").eq("event_id", proposal.event_id).eq("is_enabled", true).maybeSingle();
  if (!settings) return { error: "The sponsorship opportunity is closed.", success: "" };
  const cash = amount(data, "cash_amount"), inKind = amount(data, "in_kind_value"), inKindItems = value(data, "in_kind_items");
  if ((cash === null && inKind === null) || (cash !== null && (!settings.accepts_cash || cash < 0)) || (inKind !== null && (!settings.accepts_in_kind || inKind < 0 || !inKindItems))) return { error: "Enter an accepted cash or in-kind contribution.", success: "" };
  const terms = { cash_amount: cash, in_kind_items: inKindItems, in_kind_value: inKind, proposed_benefits: value(data, "proposed_benefits"), deliverables: value(data, "deliverables"), notes: value(data, "notes"), valid_until: value(data, "valid_until") || null };
  const revision = proposal.revision + 1, now = new Date().toISOString();
  const { data: updated, error } = await db.from("sponsorship_proposals").update({ ...terms, revision, status: "submitted", submitted_at: now, updated_at: now }).eq("id", proposal.id).eq("status", "changes_requested").select("id").maybeSingle();
  if (error || !updated) return { error: "The proposal changed before this revision could be saved. Refresh and retry.", success: "" };
  await db.from("sponsorship_proposal_revisions").insert({ proposal_id: proposal.id, revision, terms, created_by: profile.id });
  await db.from("sponsorship_audit_log").insert({ proposal_id: proposal.id, actor_id: profile.id, action: "revised", details: terms });
  const { data: memberships } = await db.from("organizer_company_memberships").select("profile_id,organizer_companies!inner(organizer_events!inner(id))").eq("organizer_companies.organizer_events.id", proposal.event_id);
  if (memberships?.length) await db.from("sponsorship_notifications").insert(memberships.map(row => ({ profile_id: row.profile_id, proposal_id: proposal.id, message: "A sponsor proposal revision was submitted." })));
  revalidatePath("/dashboard/sponsor_agency/proposals"); revalidatePath(`/dashboard/organizer/events/${proposal.event_id}/sponsors`);
  return { error: "", success: "Revised proposal submitted." };
}

export async function transitionSponsorshipProposal(data: FormData): Promise<void> {
  const proposalId = value(data, "proposal_id"), next = value(data, "status");
  if (!uuid.test(proposalId)) throw new Error("Invalid proposal.");
  const db = await createClient(); if (!db) throw new Error("Sponsorship services are unavailable.");
  const { data: proposal } = await db.from("sponsorship_proposals").select("*").eq("id", proposalId).maybeSingle();
  if (!proposal) throw new Error("Proposal not found.");
  const now = new Date().toISOString(); let actorId = "";
  if (["under_review", "changes_requested", "organizer_accepted", "declined", "cancelled"].includes(next)) {
    const owned = await organizerOwnsEvent(proposal.event_id); if (!owned.event) throw new Error("Forbidden."); actorId = owned.profile.id;
    const allowed: Record<string, string[]> = { submitted: ["under_review", "declined"], under_review: ["changes_requested", "organizer_accepted", "declined"], changes_requested: ["under_review", "organizer_accepted", "declined"], organizer_accepted: ["cancelled"], confirmed: ["cancelled"] };
    if (!allowed[proposal.status]?.includes(next)) throw new Error("Invalid proposal transition.");
    const updates: Record<string, unknown> = { status: next, updated_at: now };
    if (next === "organizer_accepted") { updates.accepted_revision = proposal.revision; updates.accepted_terms = { cash_amount: proposal.cash_amount, in_kind_items: proposal.in_kind_items, in_kind_value: proposal.in_kind_value, proposed_benefits: proposal.proposed_benefits, deliverables: proposal.deliverables, notes: proposal.notes, valid_until: proposal.valid_until }; updates.organizer_accepted_at = now; }
    await db.from("sponsorship_proposals").update(updates).eq("id", proposal.id).eq("status", proposal.status);
    if (next === "cancelled") await db.from("event_sponsors").update({ status: "cancelled", cancelled_at: now }).eq("proposal_id", proposal.id).eq("status", "active");
  } else if (["withdrawn", "confirmed"].includes(next)) {
    const context = await sponsorContext(); if (context.agency.id !== proposal.agency_id) throw new Error("Forbidden."); actorId = context.profile.id;
    if (next === "withdrawn") { if (!["submitted", "under_review", "changes_requested"].includes(proposal.status)) throw new Error("Invalid proposal transition."); await db.from("sponsorship_proposals").update({ status: next, updated_at: now }).eq("id", proposal.id).eq("status", proposal.status); }
    else { const { error } = await db.rpc("confirm_sponsorship", { p_proposal_id: proposal.id, p_actor_id: actorId }); if (error) throw new Error(error.message); }
  } else throw new Error("Invalid proposal transition.");
  await db.from("sponsorship_audit_log").insert({ proposal_id: proposal.id, actor_id: actorId, action: next });
  if (["under_review", "changes_requested", "organizer_accepted", "declined", "cancelled"].includes(next)) {
    const { data: agency } = await db.from("sponsor_agencies").select("owner_id").eq("id", proposal.agency_id).maybeSingle();
    if (agency) await db.from("sponsorship_notifications").insert({ profile_id: agency.owner_id, proposal_id: proposal.id, message: `Your sponsor proposal is now ${next.replaceAll("_", " ")}.` });
  } else {
    const { data: memberships } = await db.from("organizer_company_memberships").select("profile_id,organizer_companies!inner(organizer_events!inner(id))").eq("organizer_companies.organizer_events.id", proposal.event_id);
    if (memberships?.length) await db.from("sponsorship_notifications").insert(memberships.map(row => ({ profile_id: row.profile_id, proposal_id: proposal.id, message: `A sponsor proposal is now ${next}.` })));
  }
  revalidatePath("/dashboard/sponsor_agency", "layout"); revalidatePath(`/dashboard/organizer/events/${proposal.event_id}/sponsors`); revalidatePath(`/events/${proposal.event_id}`);
}
