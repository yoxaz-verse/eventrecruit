import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { RoleCard } from "@/components/role-card";
import { SubmitButton } from "@/components/submit-button";
import { TalentLiveRefresh } from "@/components/talent-live-refresh";
import { TalentBrowserAlerts } from "@/components/talent-browser-alerts";
import { EmptyState } from "@/components/empty-state";
import { CalendarX, Briefcase, BellOff } from "lucide-react";
import { updateTalentPreferences, requestBookingCancellation } from "@/app/actions/talent-jobs";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { indiaToday } from "@/lib/organizer";
import type { EventRole } from "@/lib/types";

type RoleRow={id:string;title:string;description:string|null;headcount:number;hourly_rate:number;shift_start:string;shift_end:string;work_starts_on:string;work_ends_on:string;required_skills:string[]|null;status:string;events:{title:string;venue:string;city:string;location_id:string|null;map_url:string|null}|{title:string;venue:string;city:string;location_id:string|null;map_url:string|null}[]|null};
const roleView=(record:RoleRow):EventRole|null=>{const event=Array.isArray(record.events)?record.events[0]:record.events;return event?{id:record.id,eventTitle:event.title,location:`${event.venue}, ${event.city}`,mapUrl:event.map_url??undefined,date:`${record.work_starts_on} – ${record.work_ends_on}`,shift:`${record.shift_start} – ${record.shift_end}`,role:record.title,description:record.description??undefined,headcount:record.headcount,rate:Number(record.hourly_rate),skills:record.required_skills??[],status:record.status as EventRole["status"]}:null;};

export default async function TalentDashboard({searchParams}:{searchParams:Promise<{view?:string}>}) {
 const talent=await requireRole(["talent"]),db=await createClient();if(!db)throw new Error("Talent opportunities are unavailable.");
 const view=(await searchParams).view==="other"?"other":"preferred",today=indiaToday();
 const [prefs,preferred,profile,rolesResult,appsResult,alerts,organizerEvents,submittedEvents]=await Promise.all([
  db.from("talent_job_preferences").select("is_online,notify_push").eq("talent_id",talent.id).maybeSingle(),
  db.from("talent_preferred_locations").select("location_id,locations(name)").eq("talent_id",talent.id),
  db.from("profiles").select("home_location_id").eq("id",talent.id).single(),
  db.from("staffing_roles").select("id,title,description,headcount,hourly_rate,shift_start,shift_end,work_starts_on,work_ends_on,required_skills,status,events(title,venue,city,location_id,map_url)").eq("status","open").order("created_at",{ascending:false}).limit(100),
  db.from("applications").select("id,staffing_role_id,status,cancellation_requested_at").eq("talent_id",talent.id),
  db.from("talent_job_alerts").select("id,staffing_role_id,created_at").eq("talent_id",talent.id).order("created_at",{ascending:false}).limit(20),
  db.from("organizer_events").select("id,title,venue,city,location_id,starts_at,ends_at").eq("status","published").gte("ends_at",today).order("starts_at"),
  db.from("exhibitor_event_submissions").select("id,title,venue,city,location_id,starts_at,ends_at").eq("status","approved").gte("ends_at",today).order("starts_at"),
 ]);
 if([prefs,preferred,profile,rolesResult,appsResult,alerts,organizerEvents,submittedEvents].some(result=>result.error))throw new Error("Unable to load talent opportunities. Apply the latest migration.");
 const preferredIds=new Set((preferred.data??[]).map(item=>item.location_id)),matches=(id:string|null)=>Boolean(id&&preferredIds.has(id)),include=(id:string|null)=>view==="preferred"?matches(id):!matches(id);
 const names=(preferred.data??[]).flatMap(item=>{const row=Array.isArray(item.locations)?item.locations[0]:item.locations;return row?.name?[row.name]:[];});
 const applications=new Map((appsResult.data??[]).map(item=>[item.staffing_role_id,item]));
 const roles=(rolesResult.data??[]).filter(record=>{const event=Array.isArray(record.events)?record.events[0]:record.events;return include(event?.location_id??null);}).map(record=>roleView(record as RoleRow)).filter((item):item is EventRole=>Boolean(item));
 const events=[...(organizerEvents.data??[]).map(event=>({...event,href:`/events/${event.id}`,source:"Organizer event"})),...(submittedEvents.data??[]).map(event=>({...event,href:`/events/exhibitor/${event.id}`,source:"Exhibitor-submitted"}))].filter(event=>include(event.location_id));
 const bookingIds=[...applications.entries()].filter(([,app])=>["accepted","completed"].includes(app.status)).map(([id])=>id);
 const booked=bookingIds.length?await db.from("staffing_roles").select("id,title,description,headcount,hourly_rate,shift_start,shift_end,work_starts_on,work_ends_on,required_skills,status,events(title,venue,city,location_id,map_url)").in("id",bookingIds):{data:[],error:null};
 if(booked.error)throw new Error("Unable to load bookings.");
 const bookings=(booked.data??[]).map(record=>roleView(record as RoleRow)).filter((item):item is EventRole=>Boolean(item)),profileComplete=Boolean(profile.data?.home_location_id&&preferredIds.size);
 return <DashboardShell active="talent"><TalentLiveRefresh/><div className="page-kicker"><span className="badge badge-accent">Event Talent panel</span><h1 className="mt-3 text-4xl font-black">Opportunities</h1><p className="mt-2 text-[var(--muted)]">Events and staffing requirements organized around the cities where you can work.</p></div><TalentBrowserAlerts enabled={Boolean(prefs.data?.notify_push)} alerts={alerts.data??[]} publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY??""}/>
 {!profileComplete?<div className="callout-banner callout-banner-amber mb-6"><div><h2 className="font-black">Choose your work locations</h2><p className="text-sm">Complete your locations to receive relevant alerts.</p></div><Link className="button button-primary" href="/dashboard/talent/profile">Complete profile</Link></div>:null}
 <form action={updateTalentPreferences} className="panel mb-6 flex flex-wrap items-end gap-4 p-5"><label className="label">Availability<select className="input" name="is_online" defaultValue={String(prefs.data?.is_online??false)}><option value="true">Online for matching</option><option value="false">Offline</option></select></label><label className="label">Browser alerts<select className="input" name="notify_push" defaultValue={String(prefs.data?.notify_push??false)}><option value="true">On</option><option value="false">Off</option></select></label><SubmitButton pendingText="Saving…">Save preferences</SubmitButton></form>
 <nav className="mb-6 flex gap-2" aria-label="Opportunity locations"><Link className={`button ${view==="preferred"?"button-primary":"button-secondary"}`} href="/dashboard/talent?view=preferred">Preferred locations</Link><Link className={`button ${view==="other"?"button-primary":"button-secondary"}`} href="/dashboard/talent?view=other">Other locations</Link></nav>
 <p className="mb-5 text-sm text-[var(--muted)]">{view==="preferred"?(names.length?`Showing ${names.join(", ")}. Alerts are limited to these cities.`:"Add preferred cities to personalize this tab."):"Explore other cities. These opportunities do not generate alerts."}</p>

 <section className="mb-8">
   <h2 className="text-2xl font-bold">Upcoming events</h2>
   {events.length ? (
     <div className="mt-4 grid gap-4 md:grid-cols-2">{events.map(event=><article className="panel p-5" key={`${event.source}-${event.id}`}><span className="badge">{event.source}</span><h3 className="mt-3 text-xl font-black"><Link href={event.href}>{event.title}</Link></h3><p className="text-sm">{event.venue}, {event.city}</p><p className="text-sm text-[var(--muted)]">{event.starts_at} – {event.ends_at}</p></article>)}</div>
   ) : (
     <EmptyState
       icon={CalendarX}
       title="No upcoming events in this group"
       description="There are currently no active exhibitions or store events scheduled for the selected location filter."
       className="mt-4"
     />
   )}
 </section>

 <section className="mb-8">
   <h2 className="text-2xl font-bold">Staffing requirements</h2>
   {roles.length ? (
     <div className="mt-4 grid gap-4 md:grid-cols-2">{roles.map(role=>{const app=applications.get(role.id);return <RoleCard key={role.id} role={{...role,applicationStatus:app?.status}} apply={!app&&talent.verification_status==="verified"} showDate/>;})}</div>
   ) : (
     <EmptyState
       icon={Briefcase}
       title="No open staffing requirements"
       description="No open roles available right now for this group. Switch tabs or update your preferred work cities in your profile."
       action={<Link className="button button-secondary text-xs" href="/dashboard/talent/profile">Manage locations</Link>}
       className="mt-4"
     />
   )}
 </section>

 <section className="mb-8">
   <h2 className="text-2xl font-bold mb-4">Recent preferred-location alerts</h2>
   {alerts.data?.length ? (
     <div className="grid gap-2">{alerts.data.map(alert=><p className="panel p-3 text-sm" key={alert.id}>New matching role · {new Date(alert.created_at).toLocaleString("en-IN")}</p>)}</div>
   ) : (
     <EmptyState
       icon={BellOff}
       title="No matching alerts yet"
       description="When new staffing requests match your preferred cities, instant real-time alerts will appear right here."
       className="mt-2"
     />
   )}
 </section>

 {bookings.length?<section><h2 className="mb-4 text-2xl font-bold">Your bookings</h2><div className="grid gap-4 md:grid-cols-2">{bookings.map(role=>{const app=applications.get(role.id);return <div key={role.id}><RoleCard role={role} showDate/><p className="mt-2 text-sm">Your status: {app?.status}</p>{app?.status==="accepted"&&!app.cancellation_requested_at?<form action={requestBookingCancellation}><input type="hidden" name="application_id" value={app.id}/><SubmitButton pendingText="Requesting…">Request cancellation</SubmitButton></form>:null}</div>;})}</div></section>:null}
 </DashboardShell>;
}
