import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { RoleCard } from "@/components/role-card";
import { SubmitButton } from "@/components/submit-button";
import { TalentLiveRefresh } from "@/components/talent-live-refresh";
import { TalentBrowserAlerts } from "@/components/talent-browser-alerts";
import { updateTalentPreferences, requestBookingCancellation } from "@/app/actions/talent-jobs";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { EventRole } from "@/lib/types";

export default async function TalentDashboard() {
  const talent = await requireRole(["talent"]);
  const db = await createClient();
  if (!db) throw new Error("Talent jobs are unavailable.");
  const [preferences, rolesResult, applicationsResult, alertsResult] = await Promise.all([
    db.from("talent_job_preferences").select("is_online,notify_push").eq("talent_id",talent.id).maybeSingle(),
    db.from("staffing_roles").select("id,title,description,headcount,hourly_rate,shift_start,shift_end,work_starts_on,work_ends_on,required_skills,status,events(title,venue,city)").eq("status","open").order("created_at",{ascending:false}).limit(100),
    db.from("applications").select("id,staffing_role_id,status,cancellation_requested_at").eq("talent_id",talent.id),
    db.from("talent_job_alerts").select("id,staffing_role_id,created_at").eq("talent_id",talent.id).order("created_at",{ascending:false}).limit(20),
  ]);
  if (preferences.error || rolesResult.error || applicationsResult.error || alertsResult.error) throw new Error("Unable to load talent jobs. Apply the latest migration.");
  const byRole = new Map((applicationsResult.data ?? []).map(item=>[item.staffing_role_id,item]));
  const ownRoleIds=[...byRole.keys()].filter(id=>!(rolesResult.data??[]).some(record=>record.id===id));
  const {data:ownRoles,error:ownRolesError}=ownRoleIds.length ? await db.from("staffing_roles").select("id,title,description,headcount,hourly_rate,shift_start,shift_end,work_starts_on,work_ends_on,required_skills,status,events(title,venue,city)").in("id",ownRoleIds) : {data:[],error:null};
  if (ownRolesError) throw new Error("Unable to load your bookings.");
  const roles:EventRole[] = [...(rolesResult.data??[]),...(ownRoles??[])].flatMap(record=>{
    const event = Array.isArray(record.events) ? record.events[0] : record.events;
    if (!event) return [];
    return [{id:record.id,eventTitle:event.title,location:`${event.venue}, ${event.city}`,date:`${record.work_starts_on} – ${record.work_ends_on}`,shift:`${record.shift_start} – ${record.shift_end}`,role:record.title,description:record.description??undefined,headcount:record.headcount,rate:Number(record.hourly_rate),skills:record.required_skills??[],status:record.status as EventRole["status"]}];
  });
  return <DashboardShell active="talent"><TalentLiveRefresh/><div className="page-kicker"><span className="badge badge-accent">Event Talent panel</span><h1 className="mt-3 text-4xl font-black">Live jobs</h1><p className="mt-2 text-[var(--muted)]">Browse event roles and manage your confirmed work days.</p></div><TalentBrowserAlerts enabled={Boolean(preferences.data?.notify_push)} alerts={alertsResult.data??[]} publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY??""}/>
    <form action={updateTalentPreferences} className="panel mb-6 flex flex-wrap items-end gap-4 p-5"><label className="label">Availability<select className="input" name="is_online" defaultValue={String(preferences.data?.is_online??false)}><option value="true">Online for matching</option><option value="false">Offline</option></select></label><label className="label">Browser alerts<select className="input" name="notify_push" defaultValue={String(preferences.data?.notify_push??false)}><option value="true">On</option><option value="false">Off</option></select></label><SubmitButton pendingText="Saving…">Save preferences</SubmitButton></form>
    <section className="mb-8"><h2 className="text-2xl font-bold">Recent job alerts</h2>{alertsResult.data?.length ? <div className="mt-3 grid gap-2">{alertsResult.data.map(alert=><p className="panel p-3 text-sm" key={alert.id}>New matching role · {new Date(alert.created_at).toLocaleString("en-IN")} · <Link className="underline" href="/browse">View jobs</Link></p>)}</div> : <p className="mt-2 text-sm text-[var(--muted)]">No matching alerts yet.</p>}</section>
    <section><h2 className="mb-4 text-2xl font-bold">Jobs and bookings</h2><div className="grid gap-4 md:grid-cols-2">{roles.map(role=>{const application=byRole.get(role.id); return <div key={role.id}><RoleCard role={role} apply={!application && role.status==="open" && talent.verification_status==="verified"} showDate/><p className="mt-2 text-sm">{application ? `Your status: ${application.status}${application.cancellation_requested_at ? " · Cancellation requested" : ""}` : ""}</p>{application?.status==="accepted" && !application.cancellation_requested_at ? <form action={requestBookingCancellation}><input type="hidden" name="application_id" value={application.id}/><SubmitButton pendingText="Requesting…">Request cancellation</SubmitButton></form>:null}</div>})}</div>{!roles.length ? <p>No open roles right now.</p> : null}</section>
  </DashboardShell>;
}
