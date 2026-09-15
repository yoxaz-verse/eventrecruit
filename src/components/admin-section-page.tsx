import Link from "next/link";
import {DashboardShell} from "@/components/dashboard-shell";
import {AdminFilters,AdminPagination,AdminTable,DateCell,StatusCell,type AdminColumn} from "@/components/admin-records";
import {AdminCancelBooking} from "@/components/admin-action-form";
import {ContactReveal} from "@/components/contact-reveal";
import {requireRole} from "@/lib/auth";
import {adminSectionViews,loadAdminSection} from "@/lib/admin-data";
import {adminSections,adminStatusOptions,maskEmail,maskPhone,parseAdminListParams,type AdminSection} from "@/lib/admin";

const titles:Record<AdminSection,string>={users:"Users & contacts",organizations:"Organizations",events:"Events",workforce:"Staffing & placements",bookings:"Bookings & inquiries",network:"Agency & finance network",reputation:"Reviews & reputation"};
const status=(key="status"):AdminColumn=>({key,label:"Status",format:value=><StatusCell value={value}/>});
const date=(key="created_at",label="Created"):AdminColumn=>({key,label,format:value=><DateCell value={value}/>});
const columns:Record<string,AdminColumn[]>={
 profiles:[{key:"full_name",label:"Name"},{key:"app_accounts",label:"Login email",format:v=>{const x=Array.isArray(v)?v[0]:v;return (x as {email?:string}|null)?.email??"—"}},{key:"role",label:"Role"},{key:"city",label:"City"},status("verification_status"),{key:"contact_details",label:"Private contact",format:(v,row)=>{const x=(Array.isArray(v)?v[0]:v) as {phone?:string;alternate_email?:string}|null;return <ContactReveal profileId={String(row.id)} maskedPhone={maskPhone(x?.phone)} maskedEmail={maskEmail(x?.alternate_email)}/>;}},date()],
 companies:[{key:"name",label:"Company"},{key:"city",label:"City"},{key:"website",label:"Website"},date()],
 agencies:[{key:"name",label:"Agency"},{key:"commission_type",label:"Commission type"},{key:"commission_value",label:"Value"},status("verification_status"),date()],
 exhibitors:[{key:"company_name",label:"Exhibitor"},{key:"industry",label:"Industry"},status("verification_status"),date()],
 organizer_events:[{key:"title",label:"Event"},{key:"city",label:"City"},{key:"starts_at",label:"Starts",format:v=><DateCell value={v}/>},{key:"ends_at",label:"Ends",format:v=><DateCell value={v}/>},status(),date()],
 submissions:[{key:"title",label:"Submission"},{key:"city",label:"City"},{key:"starts_at",label:"Starts"},{key:"ends_at",label:"Ends"},status(),date()],
 roles:[{key:"title",label:"Role"},{key:"headcount",label:"People"},{key:"hourly_rate",label:"Hourly rate"},{key:"work_starts_on",label:"Starts"},{key:"work_ends_on",label:"Ends"},status(),date()],
 applications:[{key:"talent_id",label:"Talent ID"},{key:"staffing_role_id",label:"Role ID"},status(),{key:"cancellation_requested_at",label:"Cancellation requested",format:v=><DateCell value={v}/>},date()],
 placements:[{key:"talent_id",label:"Talent ID"},{key:"staffing_role_id",label:"Role ID"},{key:"agreed_rate",label:"Agreed rate"},status(),{key:"completed_at",label:"Completed",format:v=><DateCell value={v}/>},date()],
 bookings:[{key:"guest_name",label:"Guest"},{key:"guest_email",label:"Email"},{key:"slot_id",label:"Slot ID"},{key:"email_sent_at",label:"Email sent",format:v=><DateCell value={v}/>},{key:"cancelled_at",label:"Cancelled",format:v=><DateCell value={v}/>},date(),{key:"id",label:"Management",format:(_v,row)=>row.cancelled_at?"Cancelled":<AdminCancelBooking id={String(row.id)}/> }],
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
 return <DashboardShell active="admin" current={`/dashboard/admin/${section}`}><span className="badge">Admin control</span><h1 className="mt-3 text-4xl font-black">{titles[section]}</h1><p className="mb-6 mt-2 text-[var(--muted)]">Live platform records with protected, server-authorized controls.</p>{views.length>1&&<nav aria-label="Data views" className="mb-5 flex gap-2 overflow-x-auto pb-1">{views.map(view=><Link className={`button whitespace-nowrap ${view.key===dataset.key?"button-primary":"button-secondary"}`} href={`?view=${view.key}`} key={view.key} prefetch={false}>{view.title}</Link>)}</nav>}<AdminFilters q={params.q} sort={params.sort} status={params.status} statuses={statuses} view={dataset.key}/><AdminTable columns={columns[dataset.key]??[]} entity={dataset.entity} rows={dataset.rows} statusKey={dataset.statusKey} title={dataset.title} total={dataset.total}/><AdminPagination hasNext={hasNext} page={params.page} q={params.q} sort={params.sort} status={params.status} view={dataset.key}/></DashboardShell>;
}

export function validAdminSection(value:string):value is AdminSection{return adminSections.includes(value as AdminSection);}
