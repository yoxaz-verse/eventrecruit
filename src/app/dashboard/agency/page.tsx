import Link from "next/link";
import {Building2,CalendarDays,ClipboardList,Users} from "lucide-react";
import {DashboardShell} from "@/components/dashboard-shell";
import {ProfileImageForm} from "@/components/profile-image-form";
import {saveAgencyContact} from "@/app/actions/agency-staff";
import {requireRole} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
import {agencyClients} from "@/lib/agency-workspace";
export default async function AgencyDashboard(){
 const profile=await requireRole(["agency"]),db=await createClient();if(!db)throw new Error("Workspace unavailable.");
 const clients=await agencyClients(),{data:agency}=await db.from("agencies").select("id,name,logo_path,contact_phone").eq("owner_id",profile.id).maybeSingle(),ids=clients.map(c=>c.exhibitorId);
 const {data:events}=ids.length?await db.from("events").select("id,staffing_roles(id,applications(id))").in("exhibitor_id",ids):{data:[]};
 const roleCount=(events??[]).reduce((n,e)=>n+(e.staffing_roles?.length??0),0),applicantCount=(events??[]).reduce((n,e)=>n+(e.staffing_roles??[]).reduce((m,r)=>m+(r.applications?.length??0),0),0);
 const cards=[{label:"Active clients",value:clients.length,href:"/dashboard/agency/clients",icon:Building2},{label:"Client events",value:events?.length??0,href:"/dashboard/agency/events",icon:CalendarDays},{label:"Staff requests",value:roleCount,href:"/dashboard/agency/requests",icon:ClipboardList},{label:"Applications",value:applicantCount,href:"/dashboard/agency/applicants",icon:Users}];
 return <DashboardShell active="agency"><span className="badge badge-accent">Agency panel</span><h1 className="mt-3 text-4xl font-black">{agency?.name??"Multi-client workspace"}</h1><p className="mt-2 text-[var(--muted)]">Manage approved platform exhibitors and clearly categorized external clients.</p>{agency?<div className="panel mt-6 grid max-w-2xl gap-5 p-6"><ProfileImageForm kind="Agency logo" imageUrl={agency.logo_path?`/api/media/agency/${agency.id}`:null}/><form action={saveAgencyContact} className="grid gap-3"><label className="label">Common agency contact number<input className="input" name="contact_phone" type="tel" required defaultValue={agency.contact_phone??""}/></label><button className="button button-secondary">Save contact number</button></form></div>:null}<div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{cards.map(({label,value,href,icon:Icon})=><Link className="panel p-5" href={href} key={label}><Icon className="text-[var(--accent)]"/><p className="mt-4 text-sm font-bold text-[var(--muted)]">{label}</p><strong className="text-3xl font-black">{value}</strong></Link>)}</div>{!clients.length?<div className="panel mt-8 p-6"><h2 className="text-xl font-black">Add your first exhibitor client</h2><p className="mt-2 text-[var(--muted)]">Invite an existing exhibitor or create an external managed profile.</p><Link className="button button-primary mt-4" href="/dashboard/agency/clients">Manage clients</Link></div>:null}</DashboardShell>;
}
