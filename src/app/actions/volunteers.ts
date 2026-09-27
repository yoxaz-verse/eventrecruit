"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { validDate } from "@/lib/organizer";
import { containsContactDetails } from "@/lib/contact-detector";

export type VolunteerFormState={error:string};
export async function createVolunteerOpening(_state:VolunteerFormState,formData:FormData):Promise<VolunteerFormState>{
 const profile=await requireRole(["organizer"]),db=await createClient();if(!db)return {error:"Volunteer openings are temporarily unavailable."};
 const organizerEventId=String(formData.get("organizer_event_id")??""),title=String(formData.get("title")??"").trim(),description=String(formData.get("description")??"").trim(),workStart=String(formData.get("work_starts_on")??""),workEnd=String(formData.get("work_ends_on")??""),shiftStart=String(formData.get("shift_start")??""),shiftEnd=String(formData.get("shift_end")??""),headcount=Number(formData.get("headcount"));
 if(!title||title.length>160||containsContactDetails(title).hasContact||containsContactDetails(description).hasContact)return {error:"Enter a valid title and description without direct contact details."};
 if(!validDate(workStart)||!validDate(workEnd)||workEnd<workStart||!/^([01]\d|2[0-3]):[0-5]\d$/.test(shiftStart)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(shiftEnd)||!Number.isInteger(headcount)||headcount<1)return {error:"Check the volunteer dates, shift, and headcount."};
 const {data:catalog}=await db.from("organizer_events").select("id,title,venue,city,location_id,latitude,longitude,location_label,map_url,starts_at,ends_at,status,company_id,organizer_company_memberships!inner(profile_id)").eq("id",organizerEventId).eq("organizer_company_memberships.profile_id",profile.id).maybeSingle();
 if(!catalog)return {error:"You cannot manage this event."};if(!catalog.starts_at||!catalog.ends_at||workStart<catalog.starts_at||workEnd>catalog.ends_at)return {error:"Volunteer work dates must fall within the event dates."};
 let operational=(await db.from("events").select("id").eq("organizer_event_id",catalog.id).is("exhibitor_id",null).maybeSingle()).data;
 if(!operational){const inserted=await db.from("events").insert({organizer_event_id:catalog.id,title:catalog.title,venue:catalog.venue,city:catalog.city,location_id:catalog.location_id,latitude:catalog.latitude,longitude:catalog.longitude,location_label:catalog.location_label,map_url:catalog.map_url,starts_at:catalog.starts_at,ends_at:catalog.ends_at,verification_status:catalog.status==="published"?"verified":"pending",created_by:profile.id,actor_id:profile.id,payer_type:"exhibitor"}).select("id").single();operational=inserted.data;if(inserted.error?.code==="23505")operational=(await db.from("events").select("id").eq("organizer_event_id",catalog.id).is("exhibitor_id",null).single()).data;}
 if(!operational)return {error:"Unable to prepare this event for volunteers."};
 const split=(key:string)=>String(formData.get(key)??"").split(",").map(value=>value.trim()).filter(Boolean);
 const {error}=await db.from("staffing_roles").insert({event_id:operational.id,opportunity_type:"volunteer",title,description,headcount,hourly_rate:0,rate_mode:"fixed",proposed_rate_min:null,proposed_rate_max:null,shift_start:shiftStart,shift_end:shiftEnd,work_starts_on:workStart,work_ends_on:workEnd,required_skills:split("required_skills"),preferred_skills:[],required_languages:split("required_languages"),benefits:String(formData.get("benefits")??"").trim()||null,special_instructions:String(formData.get("special_instructions")??"").trim()||null,application_deadline:String(formData.get("application_deadline")??"")||null,publication_status:"published",published_at:new Date().toISOString(),operation_status:"requirement_received",status:"open"});
 if(error)return {error:"Unable to create the volunteer opening."};
 revalidatePath("/dashboard/organizer/volunteers");revalidatePath("/dashboard/talent");redirect(`/dashboard/organizer/volunteers?event=${catalog.id}`);
}
