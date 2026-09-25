import Link from "next/link";
import {DashboardShell} from "@/components/dashboard-shell";
import {AdminFilters,AdminPagination,AdminTable,DateCell,StatusCell,type AdminColumn} from "@/components/admin-records";
import {AdminActionForm,AdminCancelBooking,AdminDeleteUser} from "@/components/admin-action-form";
import {ContactReveal} from "@/components/contact-reveal";
import {requireRole} from "@/lib/auth";
import {adminSectionViews,loadAdminSection} from "@/lib/admin-data";
import {adminSections,adminStatusOptions,maskEmail,maskPhone,parseAdminListParams,type AdminSection} from "@/lib/admin";

const titles:Record<AdminSection,string>={users:"Users & contacts",organizations:"Organizations",events:"Events",workforce:"Staffing & placements",bookings:"Bookings & inquiries",network:"Agency & finance network",reputation:"Reviews & reputation"};
const status=(key="status"):AdminColumn=>({key,label:"Status",width:"9.5rem",format:value=><StatusCell value={value}/>});
const date=(key="created_at",label="Created"):AdminColumn=>({key,label,width:"7.5rem",className:"data-table-nowrap",format:value=><DateCell value={value}/>});
const columns:Record<string,AdminColumn[]>={
 profiles:[{key:"full_name",label:"Name"},{key:"app_accounts",label:"Login email",format:v=>{const x=Array.isArray(v)?v[0]:v;return (x as {email?:string}|null)?.email??"—"}},{key:"role",label:"Role"},{key:"city",label:"City"},status("verification_status"),{key:"contact_details",label:"Private contact",format:(v,row)=>{const x=(Array.isArray(v)?v[0]:v) as {phone?:string;alternate_email?:string}|null;return <ContactReveal profileId={String(row.id)} maskedPhone={maskPhone(x?.phone)} maskedEmail={maskEmail(x?.alternate_email)}/>;}},date()],
 companies:[{key:"name",label:"Company"},{key:"city",label:"City"},{key:"website",label:"Website"},date()],
 agencies:[{key:"name",label:"Agency"},{key:"commission_type",label:"Commission type"},{key:"commission_value",label:"Value"},status("verification_status"),date()],
 exhibitors:[{key:"company_name",label:"Exhibitor"},{key:"industry",label:"Industry"},status("verification_status"),date()],
 organizer_events:[{key:"title",label:"Event"},{key:"city",label:"City"},{key:"starts_at",label:"Starts",format:v=><DateCell value={v}/>},{key:"ends_at",label:"Ends",format:v=><DateCell value={v}/>},status(),date()],
 submissions:[{key:"title",label:"Submission"},{key:"city",label:"City"},{key:"starts_at",label:"Starts"},{key:"ends_at",label:"Ends"},status(),date()],
 roles:[{key:"title",label:"Role"},{key:"headcount",label:"People"},{key:"hourly_rate",label:"Hourly rate (INR)"},{key:"work_starts_on",label:"Starts"},{key:"work_ends_on",label:"Ends"},status(),date()],
 applications:[{key:"talent_name",label:"Talent"},{key:"role_title",label:"Role"},{key:"event_title",label:"Event"},status(),{key:"cancellation_requested_at",label:"Cancellation requested",format:v=><DateCell value={v}/>},date()],
 placements:[{key:"talent_name",label:"Talent"},{key:"role_title",label:"Role"},{key:"event_title",label:"Event"},{key:"agreed_rate",label:"Agreed rate (INR)"},status(),{key:"completed_at",label:"Completed",format:v=><DateCell value={v}/>},date()],
 bookings:[{key:"guest_name",label:"Guest"},{key:"guest_email",label:"Email",className:"data-table-truncate"},{key:"slot_id",label:"Slot ID",className:"data-table-truncate"},{key:"email_sent_at",label:"Email sent",format:v=><DateCell value={v}/>},{key:"cancelled_at",label:"Cancelled",format:v=><DateCell value={v}/>},date()],
 inquiries:[{key:"event_id",label:"Event ID"},{key:"exhibitor_id",label:"Exhibitor ID"},{key:"requested_area_sqft",label:"Area sqft"},{key:"requested_units",label:"Units"},status(),date()],
 relationships:[{key:"agency_id",label:"Agency ID"},{key:"exhibitor_id",label:"Exhibitor ID"},{key:"invited_email",label:"Invite email"},status(),date()],
 recommendations:[{key:"agency_id",label:"Agency ID"},{key:"talent_id",label:"Talent ID"},{key:"staffing_role_id",label:"Role ID"},status(),date()],
 commissions:[{key:"agency_id",label:"Agency ID"},{key:"exhibitor_id",label:"Exhibitor ID"},{key:"commission_amount",label:"Amount (INR)"},status(),date()],
 reviews:[{key:"rating",label:"Rating"},{key:"testimonial",label:"Testimonial"},status("visibility_status"),date()],
 profile_reputation:[{key:"profile_id",label:"Profile ID"},{key:"trust_score",label:"Trust"},{key:"average_rating",label:"Rating"},{key:"reliability_score",label:"Reliability"},{key:"completed_count",label:"Completed"},{key:"cancellations",label:"Cancellations"},{key:"disputes",label:"Disputes"}],
 exhibitor_reputation:[{key:"exhibitor_id",label:"Exhibitor ID"},{key:"trust_score",label:"Trust"},{key:"average_rating",label:"Rating"},{key:"reliability_score",label:"Reliability"},{key:"completed_count",label:"Completed"},{key:"cancellations",label:"Cancellations"},{key:"disputes",label:"Disputes"}],
};

export async function AdminSectionPage({section,searchParams}:{section:AdminSection;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 await requireRole(["admin"]);const params=parseAdminListParams(await searchParams);const {dataset,hasNext}=await loadAdminSection(section,params);const views=adminSectionViews(section);
 const statuses=dataset.entity?adminStatusOptions[dataset.entity]??[]:[];
 const renderActions=dataset.entity||dataset.key==="bookings"?(row:Record<string,unknown>)=>{
   const accountValue=Array.isArray(row.app_accounts)?row.app_accounts[0]:row.app_accounts;
   const email=(accountValue as {email?:string}|null)?.email??"No login email";
   return <div className="admin-row-actions">{dataset.entity&&<AdminActionForm current={String(row[dataset.statusKey??"status"]??"")} entity={dataset.entity} id={String(row.id)} options={adminStatusOptions[dataset.entity]??[]}/>} {dataset.key==="profiles"&&<AdminDeleteUser email={email} id={String(row.id)} name={String(row.full_name??"Unnamed user")}/>} {dataset.key==="bookings"&&(row.cancelled_at?<span className="text-xs text-[var(--muted)]">Cancelled</span>:<AdminCancelBooking id={String(row.id)}/>)}</div>;
 }:undefined;
  const tableColumns=(columns[dataset.key]??[]).map((column,index)=>section==="organizations"&&index===0?{...column,format:(value:unknown,row:Record<string,unknown>)=><Link className="font-bold underline-offset-4 hover:underline" href={`/dashboard/admin/organizations/${dataset.key}/${String(row.id)}`}>{String(value??"—")}</Link>}:column);
  return <DashboardShell active="admin" current={`/dashboard/admin/${section}`}><div className="admin-page-heading"><span className="badge">Admin control</span><h1 className="mt-3 text-4xl font-black">{titles[section]}</h1><p className="mt-2 text-[var(--muted)]">Live platform records with protected, server-authorized controls.</p></div>{views.length>1&&<nav aria-label="Data views" className="mb-5 flex gap-2 overflow-x-auto py-2 -my-2">{views.map(view=><Link className={`button whitespace-nowrap ${view.key===dataset.key?"button-primary":"button-secondary"}`} href={`?view=${view.key}`} key={view.key} prefetch={false}>{view.title}</Link>)}</nav>}<AdminFilters q={params.q} sort={params.sort} status={params.status} statuses={statuses} view={dataset.key}/><AdminTable columns={tableColumns} renderActions={renderActions} rows={dataset.rows} title={dataset.title} total={dataset.total}/><AdminPagination hasNext={hasNext} page={params.page} q={params.q} sort={params.sort} status={params.status} view={dataset.key}/></DashboardShell>;
}

export function validAdminSection(value:string):value is AdminSection{return adminSections.includes(value as AdminSection);}
