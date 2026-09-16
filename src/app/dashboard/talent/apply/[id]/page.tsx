import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { WorkflowActionForm } from "@/components/workflow-action-form";
import { SubmitButton } from "@/components/submit-button";
import { applyForRole } from "@/app/actions/workflow";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { applicationProfileCheck } from "@/lib/application-profile";

export default async function ApplicationReviewPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{current?:string}>}){
 const talent=await requireRole(["talent"]),{id}=await params,{current}=await searchParams,db=await createClient();
 if(!db)throw new Error("Application review is unavailable.");
 const [profile,contact,details,role]=await Promise.all([
  db.from("profiles").select("avatar_url,home_location_id,profile_updated_at,verification_status").eq("id",talent.id).single(),
  db.from("contact_details").select("phone").eq("profile_id",talent.id).maybeSingle(),
  db.from("talent_profiles").select("skills,languages,availability,documents_note").eq("profile_id",talent.id).maybeSingle(),
  db.from("staffing_roles").select("id,title,status,required_skills,preferred_skills,required_languages,events(title)").eq("id",id).maybeSingle(),
 ]);
 if(profile.error||contact.error||details.error||role.error||!role.data)throw new Error("Unable to review this application.");
 const check=applicationProfileCheck({avatarUrl:profile.data.avatar_url,homeLocationId:profile.data.home_location_id,profileUpdatedAt:profile.data.profile_updated_at,phone:contact.data?.phone,skills:details.data?.skills,languages:details.data?.languages,availability:details.data?.availability,documentsNote:details.data?.documents_note},{requiredSkills:role.data.required_skills,preferredSkills:role.data.preferred_skills,requiredLanguages:role.data.required_languages});
 const confirmedFresh=current==="1";
 const event=Array.isArray(role.data.events)?role.data.events[0]:role.data.events as {title?:string}|null;
 return <DashboardShell active="talent" current="/dashboard/talent"><div className="max-w-2xl"><span className="badge badge-accent">Application check</span><h1 className="mt-3 text-4xl font-black">Review before applying</h1><p className="mt-2 text-[var(--muted)]">{role.data.title} · {event?.title}</p>
 <section className="panel mt-6 grid gap-4 p-6"><h2 className="text-xl font-black">Required for this opportunity</h2>{check.required.length?check.required.map(item=><div className="flex items-center justify-between gap-3" key={item}><span>⚠ {item}</span><Link className="button button-secondary" href={`/dashboard/talent/profile?returnTo=${encodeURIComponent(`/dashboard/talent/apply/${id}`)}`}>Edit</Link></div>):<p>✓ Your required information is complete.</p>}
 {check.missingPreferred.length?<p className="text-sm text-[var(--muted)]">Preferred skills not yet in your profile: {check.missingPreferred.join(", ")}. These do not block your application.</p>:null}
 {check.stale&&!confirmedFresh?<div className="border-t border-[var(--line)] pt-4"><p>Your profile has not been updated in the last 30 days. Review it, or continue with the current information.</p><div className="mt-3 flex flex-wrap gap-2"><Link className="button button-secondary" href={`/dashboard/talent/profile?returnTo=${encodeURIComponent(`/dashboard/talent/apply/${id}`)}`}>Review and update</Link><Link className="button button-primary" href={`?current=1`}>Continue with current information</Link></div></div>:null}
 </section>
 <WorkflowActionForm action={applyForRole} className="panel mt-5 grid gap-4 p-6"><input type="hidden" name="staffing_role_id" value={id}/><input type="hidden" name="profile_current" value={confirmedFresh?"1":"0"}/><label className="label">Cover note <span className="field-optional">Optional</span><textarea className="input textarea" name="cover_note"/></label><SubmitButton disabled={!check.canApply||(check.stale&&!confirmedFresh)} pendingText="Applying…">Complete and apply</SubmitButton></WorkflowActionForm>
 </div></DashboardShell>;
}
