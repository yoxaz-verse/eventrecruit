"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { validBrandImageSignature } from "@/lib/image-upload";
import { deleteR2Object, putR2Object } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

type ImageState = { error: string; success: string };

export async function saveProfileImage(_state: ImageState, data: FormData): Promise<ImageState> {
  const profile = await requireRole(["talent", "agency", "exhibitor"]);
  const db = await createClient();
  if (!db) return { error: "Image uploads are temporarily unavailable.", success: "" };
  const remove = data.get("remove") === "1";
  const file = data.get("image");
  if (!remove && (!(file instanceof File) || !(await validBrandImageSignature(file)))) {
    return { error: "Upload a browser-compressed WebP image no larger than 500 KB.", success: "" };
  }

  let table: "profiles" | "agencies" | "exhibitors";
  let idColumn: "id" | "owner_id";
  let id = profile.id;
  let column: "avatar_url" | "logo_path";
  let prefix: "talents" | "agencies" | "exhibitors";

  if (profile.role === "talent") {
    table = "profiles"; idColumn = "id"; column = "avatar_url"; prefix = "talents";
  } else if (profile.role === "agency") {
    table = "agencies"; idColumn = "owner_id"; column = "logo_path"; prefix = "agencies";
  } else {
    table = "exhibitors"; idColumn = "owner_id"; column = "logo_path"; prefix = "exhibitors";
  }

  const requestedExhibitor = String(data.get("exhibitor_id") ?? "").trim();
  if (requestedExhibitor) {
    const { data: agency } = profile.role === "agency" ? await db.from("agencies").select("id").eq("owner_id", profile.id).maybeSingle() : { data: null };
    const { data: managed } = agency && /^[0-9a-f-]{36}$/i.test(requestedExhibitor)
      ? await db.from("exhibitors").select("id").eq("id", requestedExhibitor).eq("kind", "external").eq("created_by_agency_id", agency.id).maybeSingle()
      : { data: null };
    if (!managed) {
      return { error: "You do not have access to this exhibitor.", success: "" };
    }
    table = "exhibitors"; idColumn = "id"; id = requestedExhibitor; column = "logo_path"; prefix = "exhibitors";
  }

  const { data: record, error: readError } = await db.from(table).select(`id,${column}`).eq(idColumn, id).maybeSingle();
  if (readError || !record) return { error: "The image owner could not be verified.", success: "" };
  const ownerId = String(record.id);
  const oldPath = (record as Record<string, unknown>)[column] as string | null;
  let newPath: string | null = null;
  try {
    if (!remove && file instanceof File) {
      newPath = `${prefix}/${ownerId}/${crypto.randomUUID()}.webp`;
      await putR2Object(newPath, file);
    }
    const { error: updateError } = await db.from(table).update({ [column]: newPath }).eq("id", ownerId);
    if (updateError) {
      await deleteR2Object(newPath);
      return { error: "The image uploaded, but could not be linked to this profile.", success: "" };
    }
    await deleteR2Object(oldPath);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to save the image.", success: "" };
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/events", "layout");
  return { error: "", success: remove ? "Image removed." : "Image saved." };
}
