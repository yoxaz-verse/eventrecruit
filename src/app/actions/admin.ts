"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { allowedAdminTransition } from "@/lib/admin";
import {todayInIndia} from "@/lib/exhibitor-listings";

export type AdminActionState={error:string;success:string;phone?:string;email?:string};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const targets:Record<string,{table:string;column:string;paths:string[]}>= {
 profile:{table:"profiles",column:"verification_status",paths:["/dashboard/admin","/dashboard/admin/users"]},
 agency:{table:"agencies",column:"verification_status",paths:["/dashboard/admin","/dashboard/admin/organizations"]},
 exhibitor:{table:"exhibitors",column:"verification_status",paths:["/dashboard/admin","/dashboard/admin/organizations"]},
 organizer_event:{table:"organizer_events",column:"status",paths:["/dashboard/admin","/dashboard/admin/events","/events"]},
 staffing_role:{table:"staffing_roles",column:"status",paths:["/dashboard/admin","/dashboard/admin/workforce","/browse"]},
 application:{table:"applications",column:"status",paths:["/dashboard/admin","/dashboard/admin/workforce"]},
 placement:{table:"placements",column:"status",paths:["/dashboard/admin","/dashboard/admin/workforce"]},
 inquiry:{table:"event_space_inquiries",column:"status",paths:["/dashboard/admin","/dashboard/admin/bookings"]},
 relationship:{table:"agency_exhibitor_relationships",column:"status",paths:["/dashboard/admin","/dashboard/admin/network"]},
 recommendation:{table:"talent_recommendations",column:"status",paths:["/dashboard/admin","/dashboard/admin/network"]},
 commission:{table:"commission_records",column:"status",paths:["/dashboard/admin","/dashboard/admin/network"]},
 review:{table:"placement_reviews",column:"visibility_status",paths:["/dashboard/admin","/dashboard/admin/reputation"]},
 event_submission:{table:"exhibitor_event_submissions",column:"status",paths:["/dashboard/admin","/dashboard/admin/events","/events"]},
};

export async function updateAdminStatus(_state:AdminActionState,data:FormData):Promise<AdminActionState>{
 const admin=await requireRole(["admin"]); const db=await createClient();
 if(!db)return {error:"Admin service is unavailable.",success:""};
 const entity=String(data.get("entity")??""),id=String(data.get("id")??""),next=String(data.get("status")??"");
 const target=targets[entity]; if(!target||!uuid.test(id))return {error:"Invalid admin action.",success:""};
 const {data:record,error:loadError}=await db.from(target.table).select(`id,${target.column}`).eq("id",id).maybeSingle();
 const current=(record as unknown as Record<string,unknown>|null)?.[target.column] as string|undefined;
 if(loadError||!record||!current)return {error:"This record is no longer available.",success:""};
 if(entity==="profile"&&id===admin.id)return {error:"You cannot change your own administrator verification.",success:""};
 if(!allowedAdminTransition(entity,current,next))return {error:"That status transition is not allowed.",success:""};
 const values:Record<string,unknown>={[target.column]:next};
 if(entity==="event_submission"){
   if(current!=="pending")return {error:"This submission has already been reviewed.",success:""};
   const {data:event}=await db.from("exhibitor_event_submissions").select("ends_at").eq("id",id).maybeSingle();
   if(next==="approved"&&(!event||event.ends_at<todayInIndia()))return {error:"Past events cannot be approved.",success:""};
   values.reviewed_by=admin.id;values.reviewed_at=new Date().toISOString();
 }
 if(["profile","application","inquiry","relationship","recommendation","review"].includes(entity))values.updated_at=new Date().toISOString();
 const {data:updated,error}=await db.from(target.table).update(values).eq("id",id).eq(target.column,current).select("id").maybeSingle();
 if(error||!updated)return {error:error?.message?.includes("Role is full")?"The staffing role is full.":error?.message?.includes("already booked")?"The talent member is already booked.":"The record changed or failed validation. Refresh and retry.",success:""};
 for(const path of target.paths)revalidatePath(path);
 return {error:"",success:"Status updated."};
}

export async function cancelAdminBooking(_state:AdminActionState,data:FormData):Promise<AdminActionState>{
 await requireRole(["admin"]); const db=await createClient(); if(!db)return {error:"Admin service is unavailable.",success:""};
 const id=String(data.get("id")??""); if(!uuid.test(id))return {error:"Invalid booking.",success:""};
 const {data:booking}=await db.from("event_bookings").select("cancel_token_hash,cancelled_at").eq("id",id).maybeSingle();
 if(!booking||booking.cancelled_at)return {error:"This booking is already unavailable.",success:""};
 const {data:cancelled,error}=await db.rpc("cancel_event_booking",{p_token_hash:booking.cancel_token_hash});
 if(error||!cancelled)return {error:"Unable to cancel this booking.",success:""};
 revalidatePath("/dashboard/admin");revalidatePath("/dashboard/admin/bookings");revalidatePath("/events","layout");
 return {error:"",success:"Booking cancelled."};
}

export async function revealAdminContact(_state:AdminActionState,data:FormData):Promise<AdminActionState>{
 await requireRole(["admin"]); const db=await createClient(); if(!db)return {error:"Admin service is unavailable.",success:""};
 const id=String(data.get("profile_id")??""); if(!uuid.test(id))return {error:"Invalid contact.",success:""};
 const {data:contact,error}=await db.from("contact_details").select("phone,alternate_email").eq("profile_id",id).maybeSingle();
 if(error||!contact)return {error:"Contact details are unavailable.",success:""};
 return {error:"",success:"Contact revealed.",phone:contact.phone??"Not provided",email:contact.alternate_email??"Not provided"};
}
