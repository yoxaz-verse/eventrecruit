import "server-only";
import {createClient} from "@/lib/supabase/server";
import type {AdminOrganizationType} from "@/lib/admin";

export type AdminDetailItem={id:string;title:string;description?:string;status?:string;date?:string};
export type AdminDetailGroup={title:string;items:AdminDetailItem[]};
export type AdminOrganizationDetail={
 type:AdminOrganizationType;
 id:string;
 name:string;
 kindLabel:string;
 overview:Array<{label:string;value:string}>;
 events:AdminDetailGroup[];
 people:AdminDetailGroup[];
 activity:AdminDetailGroup[];
 finance:AdminDetailGroup[];
};

type Row=Record<string,unknown>;
const LIMIT=100;
const emptyResult=()=>({data:[] as unknown[],error:null});
const rows=(value:unknown)=>Array.isArray(value)?value as Row[]:[];
const one=(value:unknown)=>Array.isArray(value)?(value[0] as Row|undefined):value as Row|undefined;
const text=(value:unknown,fallback="—")=>value===null||value===undefined||value===""?fallback:String(value);
const joined=(...values:unknown[])=>values.filter(value=>value!==null&&value!==undefined&&value!=="").map(String).join(" · ");
const item=(row:Row,title:unknown,description?:unknown,status?:unknown,date?:unknown):AdminDetailItem=>({id:text(row.id,"record"),title:text(title),...(description?{description:String(description)}:{}),...(status?{status:String(status)}:{}),...(date?{date:String(date)}:{})});
const group=(title:string,items:AdminDetailItem[]):AdminDetailGroup=>({title,items});

function assertResults(results:Array<{error:unknown}>){
 if(results.some(result=>result.error))throw new Error("Unable to load organization details.");
}

async function ownerOverview(db:NonNullable<Awaited<ReturnType<typeof createClient>>>,ownerId:unknown){
 if(!ownerId)return [];
 const {data,error}=await db.from("profiles").select("id,full_name,city,verification_status,created_at,contact_details(phone,whatsapp,alternate_email)").eq("id",String(ownerId)).maybeSingle();
 if(error)throw new Error("Unable to load organization owner.");
 if(!data)return [];
 const contact=one(data.contact_details);
 return [
  {label:"Account owner",value:text(data.full_name)},
  {label:"Owner location",value:text(data.city)},
  {label:"Owner verification",value:text(data.verification_status).replaceAll("_"," ")},
  {label:"Owner phone",value:text(contact?.phone)},
  {label:"Owner email",value:text(contact?.alternate_email)},
 ];
}

export async function loadAdminOrganizationDetail(type:AdminOrganizationType,id:string):Promise<AdminOrganizationDetail|null>{
 const db=await createClient();if(!db)throw new Error("Admin data is temporarily unavailable.");
 if(type==="companies"){
  const {data:company,error}=await db.from("organizer_companies").select("id,owner_id,name,city,description,website,public_phone,verification_status,created_at").eq("id",id).maybeSingle();
  if(error)throw new Error("Unable to load organizer company.");if(!company)return null;
  const [owner,membersResult,eventsResult]=await Promise.all([
   ownerOverview(db,company.owner_id),
   db.from("organizer_company_memberships").select("profile_id,permission,created_at,profiles(full_name,city,verification_status)").eq("company_id",id).order("created_at",{ascending:false}).limit(LIMIT),
   db.from("organizer_events").select("id,title,venue,city,starts_at,ends_at,status,created_at").eq("company_id",id).order("created_at",{ascending:false}).limit(LIMIT),
  ]);
  assertResults([membersResult,eventsResult]);
  const eventRows=rows(eventsResult.data),eventIds=eventRows.map(x=>String(x.id));
  const [participationResult,inquiriesResult,slotsResult]=eventIds.length?await Promise.all([
   db.from("exhibitor_event_participation").select("id,event_id,status,created_at,reviewed_at,exhibitors(company_name)").in("event_id",eventIds).order("created_at",{ascending:false}).limit(LIMIT),
   db.from("event_space_inquiries").select("id,event_id,status,requested_area_sqft,requested_units,created_at,exhibitors(company_name)").in("event_id",eventIds).order("created_at",{ascending:false}).limit(LIMIT),
   db.from("event_booking_slots").select("id,event_id,slot_date,start_time,end_time,capacity,booked_count,is_active").in("event_id",eventIds).order("slot_date",{ascending:false}).limit(LIMIT),
  ]):[emptyResult(),emptyResult(),emptyResult()];
  assertResults([participationResult,inquiriesResult,slotsResult]);
  const slotRows=rows(slotsResult.data),slotIds=slotRows.map(x=>String(x.id));
  const bookingsResult=slotIds.length?await db.from("event_bookings").select("id,slot_id,guest_name,guest_email,cancelled_at,email_sent_at,created_at").in("slot_id",slotIds).order("created_at",{ascending:false}).limit(LIMIT):emptyResult();
  assertResults([bookingsResult]);
  return {type,id,name:company.name,kindLabel:"Organizer company",overview:[
   {label:"Company",value:text(company.name)},{label:"Location",value:text(company.city)},{label:"Verification",value:text(company.verification_status).replaceAll("_"," ")},{label:"Website",value:text(company.website)},{label:"Public phone",value:text(company.public_phone)},{label:"Description",value:text(company.description)},{label:"Created",value:text(company.created_at)},...owner,
  ],events:[group("Organizer events",eventRows.map(x=>item(x,x.title,joined(x.venue,x.city,x.starts_at&&`${x.starts_at}–${x.ends_at}`),x.status,x.created_at)))],people:[
   group("Company members",rows(membersResult.data).map(x=>{const profile=one(x.profiles);return item({...x,id:x.profile_id},profile?.full_name,joined(x.permission,profile?.city),profile?.verification_status,x.created_at);})),
   group("Exhibitor participation",rows(participationResult.data).map(x=>item(x,one(x.exhibitors)?.company_name,`Event ${eventRows.find(e=>e.id===x.event_id)?.title??"—"}`,x.status,x.created_at))),
  ],activity:[
   group("Booking slots",slotRows.map(x=>item(x,eventRows.find(e=>e.id===x.event_id)?.title,joined(x.slot_date,`${x.start_time}–${x.end_time}`,`${x.booked_count}/${x.capacity} booked`),x.is_active?"active":"inactive",x.slot_date))),
   group("Bookings",rows(bookingsResult.data).map(x=>item(x,x.guest_name,joined(x.guest_email,x.email_sent_at?"email sent":"email pending"),x.cancelled_at?"cancelled":"active",x.created_at))),
   group("Space inquiries",rows(inquiriesResult.data).map(x=>item(x,one(x.exhibitors)?.company_name,joined(eventRows.find(e=>e.id===x.event_id)?.title,x.requested_area_sqft&&`${x.requested_area_sqft} sqft`,x.requested_units&&`${x.requested_units} units`),x.status,x.created_at))),
  ],finance:[group("Financial records",[])]};
 }

 if(type==="agencies"){
  const {data:agency,error}=await db.from("agencies").select("id,owner_id,name,commission_type,commission_value,verification_status,average_rating,reliability_score,communication_score,professionalism_score,completed_events,cancellations,disputes,contact_phone,created_at").eq("id",id).maybeSingle();
  if(error)throw new Error("Unable to load agency.");if(!agency)return null;
  const [owner,eventsResult,relationshipsResult,staffResult,partnersResult,communicationsResult,notificationsResult,commissionsResult,settlementsResult,shortlistsResult]=await Promise.all([
   ownerOverview(db,agency.owner_id),
   db.from("events").select("id,title,venue,city,starts_at,ends_at,verification_status,created_at,exhibitors(company_name)").eq("agency_id",id).order("created_at",{ascending:false}).limit(LIMIT),
   db.from("agency_exhibitor_relationships").select("id,status,invited_email,created_at,updated_at,exhibitors(company_name)").eq("agency_id",id).order("created_at",{ascending:false}).limit(LIMIT),
   db.from("agency_staff_contacts").select("id,full_name,email,phone,availability_status,assignment_status,created_at").eq("agency_id",id).order("created_at",{ascending:false}).limit(LIMIT),
   db.from("recruitment_partners").select("id,name,contact_person,location,staff_count,status,created_at").eq("agency_id",id).order("created_at",{ascending:false}).limit(LIMIT),
   db.from("agency_communications").select("id,subject_type,channel,direction,summary,created_at").eq("agency_id",id).order("created_at",{ascending:false}).limit(LIMIT),
   db.from("agency_notifications").select("id,title,body,read_at,created_at").eq("agency_id",id).order("created_at",{ascending:false}).limit(LIMIT),
   db.from("commission_records").select("id,commission_amount,status,created_at,exhibitors(company_name)").eq("agency_id",id).order("created_at",{ascending:false}).limit(LIMIT),
   db.from("staffing_settlements").select("id,gross_amount,platform_fee_amount,agency_amount,status,created_at,staffing_roles(title)").eq("payer_agency_id",id).order("created_at",{ascending:false}).limit(LIMIT),
   db.from("client_shortlists").select("id,title,expires_at,revoked_at,created_at,exhibitors(company_name),staffing_roles(title)").eq("agency_id",id).order("created_at",{ascending:false}).limit(LIMIT),
  ]);
  assertResults([eventsResult,relationshipsResult,staffResult,partnersResult,communicationsResult,notificationsResult,commissionsResult,settlementsResult,shortlistsResult]);
  const eventRows=rows(eventsResult.data),eventIds=eventRows.map(x=>String(x.id));
  const rolesResult=eventIds.length?await db.from("staffing_roles").select("id,event_id,title,headcount,status,operation_status,created_at").in("event_id",eventIds).order("created_at",{ascending:false}).limit(LIMIT):emptyResult();
  assertResults([rolesResult]);const roleRows=rows(rolesResult.data),roleIds=roleRows.map(x=>String(x.id));
  const [applicationsResult,placementsResult,historyResult]=roleIds.length?await Promise.all([
   db.from("applications").select("id,staffing_role_id,status,created_at,talent_profiles(profiles(full_name))").in("staffing_role_id",roleIds).order("created_at",{ascending:false}).limit(LIMIT),
   db.from("placements").select("id,staffing_role_id,status,agreed_rate,completed_at,created_at,talent_profiles(profiles(full_name))").in("staffing_role_id",roleIds).order("created_at",{ascending:false}).limit(LIMIT),
   db.from("operation_status_history").select("id,staffing_role_id,from_status,to_status,note,created_at").in("staffing_role_id",roleIds).order("created_at",{ascending:false}).limit(LIMIT),
  ]):[emptyResult(),emptyResult(),emptyResult()];
  assertResults([applicationsResult,placementsResult,historyResult]);
  const settlementRows=rows(settlementsResult.data),settlementIds=settlementRows.map(x=>String(x.id));
  const [payoutsResult,auditResult]=settlementIds.length?await Promise.all([
   db.from("settlement_payouts").select("id,settlement_id,recipient_type,amount,status,paid_at,created_at,agencies(name),talent_profiles(profiles(full_name))").in("settlement_id",settlementIds).order("created_at",{ascending:false}).limit(LIMIT),
   db.from("settlement_audit_log").select("id,settlement_id,action,amount,reference,created_at,profiles(full_name)").in("settlement_id",settlementIds).order("created_at",{ascending:false}).limit(LIMIT),
  ]):[emptyResult(),emptyResult()];
  assertResults([payoutsResult,auditResult]);
  return {type,id,name:agency.name,kindLabel:"Agency",overview:[{label:"Agency",value:text(agency.name)},{label:"Verification",value:text(agency.verification_status).replaceAll("_"," ")},{label:"Contact phone",value:text(agency.contact_phone)},{label:"Commission",value:joined(agency.commission_type,agency.commission_value)},{label:"Average rating",value:text(agency.average_rating)},{label:"Reliability",value:text(agency.reliability_score)},{label:"Completed events",value:text(agency.completed_events)},{label:"Cancellations",value:text(agency.cancellations)},{label:"Disputes",value:text(agency.disputes)},{label:"Created",value:text(agency.created_at)},...owner],events:[group("Managed events",eventRows.map(x=>item(x,x.title,joined(one(x.exhibitors)?.company_name,x.venue,x.city,`${x.starts_at}–${x.ends_at}`),x.verification_status,x.created_at)))],people:[
   group("Exhibitor relationships",rows(relationshipsResult.data).map(x=>item(x,one(x.exhibitors)?.company_name,x.invited_email,x.status,x.created_at))),
   group("Staff contacts",rows(staffResult.data).map(x=>item(x,x.full_name,joined(x.email,x.phone,x.availability_status),x.assignment_status,x.created_at))),
   group("Recruitment partners",rows(partnersResult.data).map(x=>item(x,x.name,joined(x.contact_person,x.location,x.staff_count&&`${x.staff_count} staff`),x.status,x.created_at))),
  ],activity:[
   group("Staffing roles",roleRows.map(x=>item(x,x.title,joined(`${x.headcount} people`,eventRows.find(e=>e.id===x.event_id)?.title,x.operation_status),x.status,x.created_at))),
   group("Applications",rows(applicationsResult.data).map(x=>{const talent=one(x.talent_profiles);return item(x,one(talent?.profiles)?.full_name,roleRows.find(r=>r.id===x.staffing_role_id)?.title,x.status,x.created_at);})),
   group("Placements",rows(placementsResult.data).map(x=>{const talent=one(x.talent_profiles);return item(x,one(talent?.profiles)?.full_name,joined(roleRows.find(r=>r.id===x.staffing_role_id)?.title,x.agreed_rate&&`INR ${x.agreed_rate}`),x.status,x.completed_at??x.created_at);})),
   group("Operation status history",rows(historyResult.data).map(x=>item(x,roleRows.find(r=>r.id===x.staffing_role_id)?.title,joined(x.from_status&&`${x.from_status} → ${x.to_status}`,x.note),x.to_status,x.created_at))),
   group("Communications",rows(communicationsResult.data).map(x=>item(x,x.summary,joined(x.subject_type,x.channel,x.direction),undefined,x.created_at))),
   group("Notifications",rows(notificationsResult.data).map(x=>item(x,x.title,x.body,x.read_at?"read":"unread",x.created_at))),
   group("Client shortlists",rows(shortlistsResult.data).map(x=>item(x,x.title,joined(one(x.exhibitors)?.company_name,one(x.staffing_roles)?.title,x.expires_at&&`Expires ${x.expires_at}`),x.revoked_at?"revoked":"active",x.created_at))),
  ],finance:[
   group("Settlements",settlementRows.map(x=>item(x,one(x.staffing_roles)?.title,joined(`Gross INR ${x.gross_amount}`,`Platform fee INR ${x.platform_fee_amount}`,`Agency INR ${x.agency_amount}`),x.status,x.created_at))),
   group("Settlement payouts",rows(payoutsResult.data).map(x=>{const talent=one(x.talent_profiles);return item(x,one(x.agencies)?.name??one(talent?.profiles)?.full_name,joined(x.recipient_type,`INR ${x.amount}`),x.status,x.paid_at??x.created_at);})),
   group("Settlement audit",rows(auditResult.data).map(x=>item(x,x.action,joined(one(x.profiles)?.full_name,x.amount&&`INR ${x.amount}`,x.reference),undefined,x.created_at))),
   group("Commissions",rows(commissionsResult.data).map(x=>item(x,one(x.exhibitors)?.company_name,`INR ${text(x.commission_amount)}`,x.status,x.created_at))),
  ]};
 }

 const {data:exhibitor,error}=await db.from("exhibitors").select("id,owner_id,company_name,industry,company_type,kind,primary_contact_name,contact_phone,contact_email,description,website,address,city,verification_status,created_at").eq("id",id).maybeSingle();
 if(error)throw new Error("Unable to load exhibitor.");if(!exhibitor)return null;
 const [owner,eventsResult,submissionsResult,participationResult,relationshipsResult,inquiriesResult,reputationResult,commissionsResult,settlementsResult,shortlistsResult,reviewsResult]=await Promise.all([
  ownerOverview(db,exhibitor.owner_id),
  db.from("events").select("id,title,venue,city,starts_at,ends_at,verification_status,created_at,agencies(name)").eq("exhibitor_id",id).order("created_at",{ascending:false}).limit(LIMIT),
  db.from("exhibitor_event_submissions").select("id,title,venue,city,starts_at,ends_at,status,created_at").eq("exhibitor_id",id).order("created_at",{ascending:false}).limit(LIMIT),
  db.from("exhibitor_event_participation").select("id,status,created_at,reviewed_at,organizer_events(title,city,starts_at,ends_at)").eq("exhibitor_id",id).order("created_at",{ascending:false}).limit(LIMIT),
  db.from("agency_exhibitor_relationships").select("id,status,invited_email,created_at,agencies(name)").eq("exhibitor_id",id).order("created_at",{ascending:false}).limit(LIMIT),
  db.from("event_space_inquiries").select("id,status,requested_area_sqft,requested_units,message,created_at,organizer_events(title)").eq("exhibitor_id",id).order("created_at",{ascending:false}).limit(LIMIT),
  db.from("exhibitor_reputation").select("trust_score,average_rating,reliability_score,communication_score,professionalism_score,completed_count,cancellations,disputes,updated_at").eq("exhibitor_id",id).maybeSingle(),
  db.from("commission_records").select("id,commission_amount,status,created_at,agencies(name)").eq("exhibitor_id",id).order("created_at",{ascending:false}).limit(LIMIT),
  db.from("staffing_settlements").select("id,gross_amount,platform_fee_amount,agency_amount,status,created_at,staffing_roles(title)").eq("payer_exhibitor_id",id).order("created_at",{ascending:false}).limit(LIMIT),
  db.from("client_shortlists").select("id,title,expires_at,revoked_at,created_at,agencies(name),staffing_roles(title)").eq("exhibitor_id",id).order("created_at",{ascending:false}).limit(LIMIT),
  db.from("placement_reviews").select("id,rating,testimonial,visibility_status,created_at,profiles!placement_reviews_reviewer_id_fkey(full_name)").eq("reviewee_exhibitor_id",id).order("created_at",{ascending:false}).limit(LIMIT),
 ]);
 assertResults([eventsResult,submissionsResult,participationResult,relationshipsResult,inquiriesResult,reputationResult,commissionsResult,settlementsResult,shortlistsResult,reviewsResult]);
 const eventRows=rows(eventsResult.data),eventIds=eventRows.map(x=>String(x.id));
 const rolesResult=eventIds.length?await db.from("staffing_roles").select("id,event_id,title,headcount,status,operation_status,created_at").in("event_id",eventIds).order("created_at",{ascending:false}).limit(LIMIT):emptyResult();
 assertResults([rolesResult]);const roleRows=rows(rolesResult.data),roleIds=roleRows.map(x=>String(x.id));
 const [applicationsResult,placementsResult]=roleIds.length?await Promise.all([
  db.from("applications").select("id,staffing_role_id,status,created_at,talent_profiles(profiles(full_name))").in("staffing_role_id",roleIds).order("created_at",{ascending:false}).limit(LIMIT),
  db.from("placements").select("id,staffing_role_id,status,agreed_rate,completed_at,created_at,talent_profiles(profiles(full_name))").in("staffing_role_id",roleIds).order("created_at",{ascending:false}).limit(LIMIT),
 ]):[emptyResult(),emptyResult()];
 assertResults([applicationsResult,placementsResult]);const reputation=reputationResult.data as Row|null;
 const settlementRows=rows(settlementsResult.data),settlementIds=settlementRows.map(x=>String(x.id));
 const [payoutsResult,auditResult]=settlementIds.length?await Promise.all([
  db.from("settlement_payouts").select("id,settlement_id,recipient_type,amount,status,paid_at,created_at,agencies(name),talent_profiles(profiles(full_name))").in("settlement_id",settlementIds).order("created_at",{ascending:false}).limit(LIMIT),
  db.from("settlement_audit_log").select("id,settlement_id,action,amount,reference,created_at,profiles(full_name)").in("settlement_id",settlementIds).order("created_at",{ascending:false}).limit(LIMIT),
 ]):[emptyResult(),emptyResult()];
 assertResults([payoutsResult,auditResult]);
 return {type,id,name:exhibitor.company_name,kindLabel:"Exhibitor",overview:[{label:"Company",value:text(exhibitor.company_name)},{label:"Industry",value:text(exhibitor.industry)},{label:"Company type",value:text(exhibitor.company_type??exhibitor.kind)},{label:"Verification",value:text(exhibitor.verification_status).replaceAll("_"," ")},{label:"Primary contact",value:text(exhibitor.primary_contact_name)},{label:"Phone",value:text(exhibitor.contact_phone)},{label:"Email",value:text(exhibitor.contact_email)},{label:"Website",value:text(exhibitor.website)},{label:"Address",value:joined(exhibitor.address,exhibitor.city)||"—"},{label:"Description",value:text(exhibitor.description)},{label:"Created",value:text(exhibitor.created_at)},...owner],events:[
  group("Managed events",eventRows.map(x=>item(x,x.title,joined(one(x.agencies)?.name,x.venue,x.city,`${x.starts_at}–${x.ends_at}`),x.verification_status,x.created_at))),
  group("Event submissions",rows(submissionsResult.data).map(x=>item(x,x.title,joined(x.venue,x.city,`${x.starts_at}–${x.ends_at}`),x.status,x.created_at))),
  group("Organizer event participation",rows(participationResult.data).map(x=>{const event=one(x.organizer_events);return item(x,event?.title,joined(event?.city,event?.starts_at&&`${event.starts_at}–${event.ends_at}`),x.status,x.created_at);})),
 ],people:[group("Agency relationships",rows(relationshipsResult.data).map(x=>item(x,one(x.agencies)?.name,x.invited_email,x.status,x.created_at)))],activity:[
  group("Staffing roles",roleRows.map(x=>item(x,x.title,joined(`${x.headcount} people`,eventRows.find(e=>e.id===x.event_id)?.title,x.operation_status),x.status,x.created_at))),
  group("Applications",rows(applicationsResult.data).map(x=>{const talent=one(x.talent_profiles);return item(x,one(talent?.profiles)?.full_name,roleRows.find(r=>r.id===x.staffing_role_id)?.title,x.status,x.created_at);})),
  group("Placements",rows(placementsResult.data).map(x=>{const talent=one(x.talent_profiles);return item(x,one(talent?.profiles)?.full_name,joined(roleRows.find(r=>r.id===x.staffing_role_id)?.title,x.agreed_rate&&`INR ${x.agreed_rate}`),x.status,x.completed_at??x.created_at);})),
  group("Space inquiries",rows(inquiriesResult.data).map(x=>item(x,one(x.organizer_events)?.title,joined(x.requested_area_sqft&&`${x.requested_area_sqft} sqft`,x.requested_units&&`${x.requested_units} units`,x.message),x.status,x.created_at))),
  group("Client shortlists",rows(shortlistsResult.data).map(x=>item(x,x.title,joined(one(x.agencies)?.name,one(x.staffing_roles)?.title,x.expires_at&&`Expires ${x.expires_at}`),x.revoked_at?"revoked":"active",x.created_at))),
 ],finance:[
  group("Reputation",reputation?[item({id:"reputation"},`Trust ${text(reputation.trust_score)}`,joined(`Rating ${text(reputation.average_rating)}`,`Reliability ${text(reputation.reliability_score)}`,`${text(reputation.completed_count)} completed`,`${text(reputation.cancellations)} cancellations`,`${text(reputation.disputes)} disputes`),undefined,reputation.updated_at)]:[]),
  group("Reviews",rows(reviewsResult.data).map(x=>item(x,`${text(x.rating)} / 5`,joined(one(x.profiles)?.full_name,x.testimonial),x.visibility_status,x.created_at))),
  group("Settlements",settlementRows.map(x=>item(x,one(x.staffing_roles)?.title,joined(`Gross INR ${x.gross_amount}`,`Platform fee INR ${x.platform_fee_amount}`,`Agency INR ${x.agency_amount}`),x.status,x.created_at))),
  group("Settlement payouts",rows(payoutsResult.data).map(x=>{const talent=one(x.talent_profiles);return item(x,one(x.agencies)?.name??one(talent?.profiles)?.full_name,joined(x.recipient_type,`INR ${x.amount}`),x.status,x.paid_at??x.created_at);})),
  group("Settlement audit",rows(auditResult.data).map(x=>item(x,x.action,joined(one(x.profiles)?.full_name,x.amount&&`INR ${x.amount}`,x.reference),undefined,x.created_at))),
  group("Commissions",rows(commissionsResult.data).map(x=>item(x,one(x.agencies)?.name,`INR ${text(x.commission_amount)}`,x.status,x.created_at))),
 ]};
}
