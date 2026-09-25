"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function saveAgencyProfile(_state:{error:string}, data:FormData):Promise<{error:string}> {
  const profile=await requireRole(["agency"]),db=await createClient();
  if(!db)return {error:"Agency profile is unavailable."};
  const name=String(data.get("name")??"").trim(),phone=String(data.get("contact_phone")??"").trim(),type=String(data.get("commission_type")??""),raw=String(data.get("commission_value")??"").trim(),value=Number(raw);
  if(!name||name.length>160||!phone||phone.length>40)return {error:"Enter a valid agency name and contact phone."};
  if(!["percentage","fixed"].includes(type)||!Number.isFinite(value)||value<0||(type==="percentage"&&value>100))return {error:"Enter valid commission preferences."};
  const {error}=await db.from("agencies").update({name,contact_phone:phone,commission_type:type,commission_value:value}).eq("owner_id",profile.id);
  if(error)return {error:"Unable to save the agency profile."};
  revalidatePath("/dashboard/agency");revalidatePath("/dashboard/agency/profile");
  redirect("/dashboard/agency/profile?saved=agency");
}

