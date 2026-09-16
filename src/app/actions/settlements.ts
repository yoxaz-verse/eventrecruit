"use server";
import {revalidatePath} from "next/cache";
import {requireRole} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
import {canManageExhibitor} from "@/lib/agency-workspace";

const money=(value:FormDataEntryValue|null)=>{const n=Number(value);return Number.isFinite(n)&&n>=0?Math.round(n*100)/100:null;};
async function roleContext(roleId:string){
 const db=await createClient();if(!db)throw new Error("Settlements are unavailable.");
 const {data}=await db.from("staffing_roles").select("id,event_id,headcount,events(exhibitor_id,agency_id,payer_type,created_by)").eq("id",roleId).maybeSingle();
 const event=Array.isArray(data?.events)?data.events[0]:data?.events;
 if(!data||!event)throw new Error("Staffing request unavailable.");
 return {db,role:data,event};
}
export async function configureSettlement(formData:FormData){
 const profile=await requireRole(["agency"]),roleId=String(formData.get("staffing_role_id")??""),gross=money(formData.get("gross_amount")),agencyAmount=money(formData.get("agency_amount"));
 if(gross===null||agencyAmount===null||agencyAmount>gross)throw new Error("Enter valid settlement amounts.");
 const {db,event}=await roleContext(roleId);
 const {data:agency}=await db.from("agencies").select("id").eq("owner_id",profile.id).maybeSingle();
 if(!agency||!(event.agency_id===agency.id||await canManageExhibitor(db,profile.id,event.exhibitor_id)))throw new Error("You cannot configure this request.");
 const {data:rule}=await db.from("platform_fee_rules").select("id,fee_type,fee_value").eq("active",true).maybeSingle();
 const feeType=rule?.fee_type??"percentage",feeValue=Number(rule?.fee_value??10),feeAmount=feeType==="percentage"?Math.round(gross*feeValue)/100:feeValue;
 const payerType=event.payer_type==="agency"?"agency":"exhibitor";
 const values={staffing_role_id:roleId,payer_type:payerType,payer_exhibitor_id:payerType==="exhibitor"?event.exhibitor_id:null,payer_agency_id:payerType==="agency"?agency.id:null,gross_amount:gross,platform_fee_type:feeType,platform_fee_value:feeValue,platform_fee_amount:feeAmount,agency_amount:agencyAmount};
 const {data:settlement,error}=await db.from("staffing_settlements").upsert(values,{onConflict:"staffing_role_id"}).select("id").single();
 if(error||!settlement)throw new Error("Unable to configure settlement.");
 if(agencyAmount>0){const {data:existing}=await db.from("settlement_payouts").select("id").eq("settlement_id",settlement.id).eq("agency_id",agency.id).maybeSingle();if(existing)await db.from("settlement_payouts").update({amount:agencyAmount}).eq("id",existing.id);else await db.from("settlement_payouts").insert({settlement_id:settlement.id,recipient_type:"agency",agency_id:agency.id,amount:agencyAmount});}
 await db.from("staffing_roles").update({final_client_charge:gross,agency_share:agencyAmount}).eq("id",roleId);
 revalidatePath("/dashboard/agency/requests");
}
export async function markSettlementSent(formData:FormData){
 const profile=await requireRole(["exhibitor","agency"]),id=String(formData.get("settlement_id")??""),reference=String(formData.get("reference")??"").trim(),db=await createClient();if(!db)throw new Error("Settlements unavailable.");
 const {data:settlement}=await db.from("staffing_settlements").select("id,payer_type,payer_exhibitor_id,payer_agency_id,status").eq("id",id).maybeSingle();if(!settlement||!["pending","failed"].includes(settlement.status))throw new Error("Settlement cannot be marked sent.");
 const {data:business}=profile.role==="agency"?await db.from("agencies").select("id").eq("owner_id",profile.id).maybeSingle():await db.from("exhibitors").select("id").eq("owner_id",profile.id).maybeSingle();
 if(!business||business.id!==(settlement.payer_type==="agency"?settlement.payer_agency_id:settlement.payer_exhibitor_id))throw new Error("You are not the payer for this settlement.");
 await db.from("staffing_settlements").update({status:"sent",payer_reference:reference||null,payer_marked_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",id);
 await db.from("settlement_audit_log").insert({settlement_id:id,actor_id:profile.id,action:"payer_marked_sent",reference:reference||null});
 revalidatePath("/dashboard/exhibitor/requests");revalidatePath("/dashboard/agency/requests");revalidatePath("/dashboard/admin/settlements");
}
export async function verifySettlementReceipt(formData:FormData){
 const admin=await requireRole(["admin"]),id=String(formData.get("settlement_id")??""),reference=String(formData.get("reference")??"").trim(),db=await createClient();if(!db)throw new Error("Settlements unavailable.");
 const {data}=await db.from("staffing_settlements").update({status:"received",received_reference:reference||null,received_at:new Date().toISOString(),received_by:admin.id,updated_at:new Date().toISOString()}).eq("id",id).eq("status","sent").select("id,gross_amount").maybeSingle();if(!data)throw new Error("Only a sent payment can be verified.");
 await db.from("settlement_audit_log").insert({settlement_id:id,actor_id:admin.id,action:"receipt_verified",amount:data.gross_amount,reference:reference||null});
 revalidatePath("/dashboard/admin/settlements");
}
export async function markPayoutPaid(formData:FormData){
 const admin=await requireRole(["admin"]),id=String(formData.get("payout_id")??""),reference=String(formData.get("reference")??"").trim(),db=await createClient();if(!db)throw new Error("Payouts unavailable.");
 const {data:payout}=await db.from("settlement_payouts").select("id,settlement_id,amount,status").eq("id",id).maybeSingle();if(!payout||!["pending","processing","failed"].includes(payout.status))throw new Error("Payout cannot be marked paid.");
 const {data:settlement}=await db.from("staffing_settlements").select("status").eq("id",payout.settlement_id).maybeSingle();if(!settlement||!["received","processing","partially_paid"].includes(settlement.status))throw new Error("Verify the incoming payment first.");
 await db.from("settlement_payouts").update({status:"paid",transaction_reference:reference||null,paid_at:new Date().toISOString(),paid_by:admin.id,updated_at:new Date().toISOString()}).eq("id",id);
 await db.from("settlement_audit_log").insert({settlement_id:payout.settlement_id,actor_id:admin.id,action:"payout_paid",amount:payout.amount,reference:reference||null});
 revalidatePath("/dashboard/admin/settlements");
}
