"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentAccount, getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { canManageExhibitor } from "@/lib/agency-workspace";
import { parseCatalogSelection } from "@/lib/event-selection";
import { parseLockedLocation } from "@/lib/location";
import { resolveActiveLocations } from "@/lib/locations";
import { validDate } from "@/lib/organizer";

export type StallFormState={error:string};
const text=(formData:FormData,key:string,max:number)=>String(formData.get(key)??"").trim().slice(0,max);

export async function saveStall(_state:StallFormState,formData:FormData):Promise<StallFormState>{
  const [account,profile,db]=await Promise.all([getCurrentAccount(),getCurrentProfile(),createClient()]);
  if(!account||!profile) redirect("/login");
  if(!db||!["exhibitor","agency"].includes(profile.role)) return {error:"Stall setup is unavailable."};
  const exhibitorId=profile.role==="agency"?String(formData.get("exhibitor_id")??""):(await db.from("exhibitors").select("id").eq("owner_id",profile.id).maybeSingle()).data?.id??"";
  if(!exhibitorId||!(await canManageExhibitor(db,profile.id,exhibitorId))) return {error:"You do not have access to this exhibitor."};
  const name=text(formData,"name",160), mode=String(formData.get("event_mode")??"existing");
  if(!name)return {error:"Enter a stall name."};
  let eventId="";
  if(mode==="existing"){
    const selection=parseCatalogSelection(String(formData.get("selected_event")??""));
    if(!selection)return {error:"Choose an event."};
    const table=selection.kind==="organizer"?"organizer_events":"exhibitor_event_submissions";
    const query=db.from(table).select("id,title,venue,city,location_id,latitude,longitude,location_label,map_url,starts_at,ends_at,status").eq("id",selection.id);
    if(selection.kind==="organizer")query.eq("status","published");else query.in("status",["pending","approved"]).eq("exhibitor_id",exhibitorId);
    const {data:event}=await query.maybeSingle();
    if(!event)return {error:"That event is no longer available."};
    const column=selection.kind==="organizer"?"organizer_event_id":"exhibitor_event_submission_id";
    const existing=await db.from("events").select("id").eq("exhibitor_id",exhibitorId).eq(column,selection.id).maybeSingle();
    if(existing.data)eventId=existing.data.id;
    else {
      const inserted=await db.from("events").insert({exhibitor_id:exhibitorId,agency_id:null,title:event.title,venue:event.venue,city:event.city,location_id:event.location_id,latitude:event.latitude,longitude:event.longitude,location_label:event.location_label,map_url:event.map_url,starts_at:event.starts_at,ends_at:event.ends_at,[column]:selection.id,verification_status:event.status==="approved"||event.status==="published"?"verified":"pending",created_by:profile.id,actor_id:profile.id}).select("id").single();
      if(inserted.error?.code==="23505")eventId=(await db.from("events").select("id").eq("exhibitor_id",exhibitorId).eq(column,selection.id).single()).data?.id??"";else eventId=inserted.data?.id??"";
    }
  } else if(mode==="other") {
    const title=text(formData,"event_title",160),venue=text(formData,"venue",200),starts=String(formData.get("starts_at")??""),ends=String(formData.get("ends_at")??""),locationId=String(formData.get("location_id")??""),location=parseLockedLocation(formData);
    const locations=locationId?await resolveActiveLocations([locationId]):[];
    if(!title||!venue||!validDate(starts)||!validDate(ends)||ends<starts||!location.valid||!locations?.length)return {error:"Complete the missing event with valid venue, location, and dates."};
    const inserted=await db.from("events").insert({exhibitor_id:exhibitorId,title,venue,city:locations[0].name,location_id:locationId,latitude:location.latitude,longitude:location.longitude,location_label:location.locationLabel,map_url:text(formData,"map_url",1000)||null,starts_at:starts,ends_at:ends,verification_status:"verification_required",created_by:profile.id,actor_id:profile.id}).select("id").single();
    if(inserted.error)return {error:inserted.error.code==="23503"?"The selected venue location is no longer available. Choose it again.":"Unable to create the missing event. Check its location and dates, then try again."};
    eventId=inserted.data?.id??"";
  } else return {error:"Choose an event option."};
  if(!eventId)return {error:"Unable to prepare the event for this stall."};
  const area=String(formData.get("area_sqft")??"").trim();
  const {data:stall,error}=await db.from("exhibitor_stalls").insert({exhibitor_id:exhibitorId,event_id:eventId,created_by:profile.id,name,booth_number:text(formData,"booth_number",80)||null,booth_location:text(formData,"booth_location",240)||null,area_sqft:area?Number(area):null,dimensions:text(formData,"dimensions",160)||null,description:text(formData,"description",5000),products_services:text(formData,"products_services",5000),branding_notes:text(formData,"branding_notes",3000),utilities:text(formData,"utilities",3000),equipment:text(formData,"equipment",3000),setup_at:String(formData.get("setup_at")??"")||null,teardown_at:String(formData.get("teardown_at")??"")||null,vendor_details:text(formData,"vendor_details",3000),permits_documents:text(formData,"permits_documents",3000),instructions:text(formData,"instructions",5000)}).select("id").single();
  if(error||!stall)return {error:error?.code==="23503"?"The selected event is no longer available. Choose it again.":error?.code==="42501"?"You no longer have permission to create a stall for this exhibitor.":"Unable to save the stall details. Review the required fields and try again."};
  revalidatePath("/dashboard/exhibitor/stalls");
  redirect(profile.role==="agency"?`/dashboard/agency/requests/new?client=${encodeURIComponent(exhibitorId)}&stall=${stall.id}`:`/dashboard/exhibitor/requests/new?stall=${stall.id}`);
}

export async function updateStallDetails(formData:FormData){
 const [profile,db]=await Promise.all([getCurrentProfile(),createClient()]);if(!profile||!db)redirect("/login");
 const id=String(formData.get("id")??""),{data:stall}=await db.from("exhibitor_stalls").select("id,exhibitor_id").eq("id",id).maybeSingle();
 if(!stall||!(await canManageExhibitor(db,profile.id,stall.exhibitor_id)))throw new Error("You cannot edit this stall.");
 const name=text(formData,"name",160),area=String(formData.get("area_sqft")??"").trim();if(!name)throw new Error("Stall name is required.");
 const {error}=await db.from("exhibitor_stalls").update({name,booth_number:text(formData,"booth_number",80)||null,booth_location:text(formData,"booth_location",240)||null,area_sqft:area?Number(area):null,dimensions:text(formData,"dimensions",160)||null,description:text(formData,"description",5000),products_services:text(formData,"products_services",5000),branding_notes:text(formData,"branding_notes",3000),utilities:text(formData,"utilities",3000),equipment:text(formData,"equipment",3000),vendor_details:text(formData,"vendor_details",3000),permits_documents:text(formData,"permits_documents",3000),instructions:text(formData,"instructions",5000),updated_at:new Date().toISOString()}).eq("id",id);
 if(error)throw new Error("Unable to update the stall.");revalidatePath(`/dashboard/exhibitor/stalls/${id}`);redirect(`/dashboard/exhibitor/stalls/${id}?saved=1`);
}
