"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolveActiveLocations } from "@/lib/locations";

const value=(data:FormData,key:string)=>String(data.get(key)??"").trim();

export async function saveTalentProfile(_state:{error:string},data:FormData):Promise<{error:string}> {
  const talent=await requireRole(["talent"]);
  const db=await createClient();
  if(!db)return {error:"Profile editing is temporarily unavailable."};
  const phone=value(data,"phone"),homeLocationId=value(data,"home_location_id");
  const preferred=data.getAll("preferred_location_ids").map(String).filter(Boolean);
  if(!phone||phone.length>40||!homeLocationId||!preferred.length||new Set(preferred).size!==preferred.length)return {error:"Enter your phone and choose a home city plus at least one work city."};
  const locations=await resolveActiveLocations([homeLocationId,...preferred]);
  if(!locations)return {error:"Choose valid active locations."};
  const experience=value(data,"experience_years");
  if(experience&&(!Number.isFinite(Number(experience))||Number(experience)<0||Number(experience)>99))return {error:"Enter valid years of experience."};
  const city=locations.find(location=>location.id===homeLocationId)?.name;
  if(!city)return {error:"Choose a valid home city."};
  const skills=value(data,"skills").split(",").map(item=>item.trim()).filter(Boolean);
  const languages=value(data,"languages").split(",").map(item=>item.trim()).filter(Boolean);
  const results=await Promise.all([
    db.from("profiles").update({city,home_location_id:homeLocationId}).eq("id",talent.id),
    db.from("contact_details").upsert({profile_id:talent.id,phone}),
    db.from("talent_profiles").upsert({profile_id:talent.id,headline:value(data,"headline"),bio:value(data,"bio"),skills,languages,availability:value(data,"availability"),experience_years:Number(experience||0),documents_note:value(data,"documents_note")}),
  ]);
  if(results.some(result=>result.error))return {error:"Unable to save your profile. Please try again."};
  const removed=await db.from("talent_preferred_locations").delete().eq("talent_id",talent.id);
  if(removed.error)return {error:"Unable to update work locations."};
  const inserted=await db.from("talent_preferred_locations").insert(preferred.map(location_id=>({talent_id:talent.id,location_id})));
  if(inserted.error)return {error:"Unable to update work locations."};
  revalidatePath("/dashboard/talent");
  revalidatePath("/dashboard/talent/profile");
  redirect("/dashboard/talent/profile?saved=1");
}
