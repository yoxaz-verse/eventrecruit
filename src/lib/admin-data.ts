import "server-only";
import {createClient} from "@/lib/supabase/server";
import {ADMIN_PAGE_SIZE,type AdminSection} from "@/lib/admin";

type Params={q:string;status:string;sort:"newest"|"oldest";page:number};
type Dataset={key:string;title:string;entity?:string;statusKey?:string;rows:Record<string,unknown>[]};
const configs:Record<AdminSection,Array<{key:string;title:string;table:string;select:string;search?:string;status?:string;entity?:string}>>={
 users:[{key:"profiles",title:"Users",table:"profiles",select:"id,full_name,role,verification_status,city,created_at,app_accounts(email),contact_details(phone,alternate_email)",search:"full_name",status:"verification_status",entity:"profile"}],
 organizations:[{key:"companies",title:"Organizer companies",table:"organizer_companies",select:"id,name,city,website,created_at",search:"name"},{key:"agencies",title:"Agencies",table:"agencies",select:"id,name,verification_status,commission_type,commission_value,created_at",search:"name",status:"verification_status",entity:"agency"},{key:"exhibitors",title:"Exhibitors",table:"exhibitors",select:"id,company_name,industry,verification_status,created_at",search:"company_name",status:"verification_status",entity:"exhibitor"}],
 events:[{key:"organizer_events",title:"Organizer events",table:"organizer_events",select:"id,title,city,starts_at,ends_at,status,created_at",search:"title",status:"status",entity:"organizer_event"},{key:"submissions",title:"Exhibitor event submissions",table:"exhibitor_event_submissions",select:"id,title,city,starts_at,ends_at,status,created_at",search:"title",status:"status",entity:"event_submission"}],
 workforce:[{key:"roles",title:"Staffing roles",table:"staffing_roles",select:"id,title,headcount,hourly_rate,work_starts_on,work_ends_on,status,created_at",search:"title",status:"status",entity:"staffing_role"},{key:"applications",title:"Applications",table:"applications",select:"id,talent_id,staffing_role_id,status,cancellation_requested_at,created_at",status:"status",entity:"application"},{key:"placements",title:"Placements",table:"placements",select:"id,talent_id,staffing_role_id,agreed_rate,status,completed_at,created_at",status:"status",entity:"placement"}],
 bookings:[{key:"bookings",title:"Event bookings",table:"event_bookings",select:"id,guest_name,guest_email,slot_id,cancelled_at,email_sent_at,created_at",search:"guest_name"},{key:"inquiries",title:"Space inquiries",table:"event_space_inquiries",select:"id,event_id,exhibitor_id,requested_area_sqft,requested_units,status,created_at",status:"status",entity:"inquiry"}],
 network:[{key:"relationships",title:"Agency relationships",table:"agency_exhibitor_relationships",select:"id,agency_id,exhibitor_id,invited_email,status,created_at",search:"invited_email",status:"status",entity:"relationship"},{key:"recommendations",title:"Talent recommendations",table:"talent_recommendations",select:"id,agency_id,talent_id,staffing_role_id,status,created_at",status:"status",entity:"recommendation"},{key:"commissions",title:"Commission records",table:"commission_records",select:"id,agency_id,exhibitor_id,commission_amount,status,created_at",status:"status",entity:"commission"}],
 reputation:[{key:"reviews",title:"Placement reviews",table:"placement_reviews",select:"id,reviewer_id,reviewee_id,rating,testimonial,visibility_status,created_at",search:"testimonial",status:"visibility_status",entity:"review"},{key:"profile_reputation",title:"Talent reputation",table:"profile_reputation",select:"profile_id,trust_score,average_rating,reliability_score,completed_count,cancellations,disputes,updated_at"},{key:"exhibitor_reputation",title:"Exhibitor reputation",table:"exhibitor_reputation",select:"exhibitor_id,trust_score,average_rating,reliability_score,completed_count,cancellations,disputes,updated_at"}],
};

export async function loadAdminSection(section:AdminSection,params:Params):Promise<{datasets:Dataset[];hasNext:boolean}>{
 const db=await createClient();if(!db)throw new Error("Admin data is temporarily unavailable.");
 const from=(params.page-1)*ADMIN_PAGE_SIZE,to=from+ADMIN_PAGE_SIZE;
 const results=await Promise.all(configs[section].map(async config=>{
   let query=db.from(config.table).select(config.select).order(config.select.includes("created_at")?"created_at":"updated_at",{ascending:params.sort==="oldest"}).range(from,to);
   if(params.q&&config.search)query=query.ilike(config.search,`%${params.q.replaceAll("%","")}%`);
   if(params.status&&config.status)query=query.eq(config.status,params.status);
   const {data,error}=await query;if(error&&error.code!=="PGRST205")throw new Error(`Unable to load ${config.title.toLowerCase()}.`);
   const rows=(data??[]) as unknown as Record<string,unknown>[];
   for(const row of rows)if(!row.id)row.id=row.profile_id??row.exhibitor_id;
   return {key:config.key,title:config.title,entity:config.entity,statusKey:config.status,rows};
 }));
 return {datasets:results.map(x=>({...x,rows:x.rows.slice(0,ADMIN_PAGE_SIZE)})),hasNext:results.some(x=>x.rows.length>ADMIN_PAGE_SIZE)};
}

export async function adminCounts(){
 const db=await createClient();if(!db)throw new Error("Admin data is temporarily unavailable.");
 const items=[['Users','profiles'],['Organizer events','organizer_events'],['Event submissions','exhibitor_event_submissions'],['Staffing roles','staffing_roles'],['Applications','applications'],['Placements','placements'],['Bookings','event_bookings'],['Space inquiries','event_space_inquiries'],['Agencies','agencies'],['Exhibitors','exhibitors'],['Commissions','commission_records'],['Reviews','placement_reviews']] as const;
 const values=await Promise.all(items.map(async([label,table])=>{const {count,error}=await db.from(table).select("*",{count:"exact",head:true});if(error&&error.code!=="PGRST205")throw new Error(`Unable to count ${label}.`);return {label,value:count??0};}));
 return values;
}
