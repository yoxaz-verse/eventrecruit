import { DashboardShell } from "@/components/dashboard-shell";
import { AuthActionForm } from "@/components/auth/auth-action-form";
import { SubmitButton } from "@/components/submit-button";
import { saveTalentProfile } from "@/app/actions/talent-profile";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { activeLocations } from "@/lib/locations";
import { ProfileImageForm } from "@/components/profile-image-form";

export default async function TalentProfilePage({searchParams}:{searchParams:Promise<{saved?:string}>}) {
  const talent=await requireRole(["talent"]),db=await createClient();
  if(!db)throw new Error("Profile unavailable.");
  const [locations,profile,contact,details,preferred]=await Promise.all([
    activeLocations(),db.from("profiles").select("home_location_id,avatar_url").eq("id",talent.id).single(),db.from("contact_details").select("phone").eq("profile_id",talent.id).maybeSingle(),db.from("talent_profiles").select("headline,bio,skills,languages,availability,experience_years,documents_note").eq("profile_id",talent.id).maybeSingle(),db.from("talent_preferred_locations").select("location_id").eq("talent_id",talent.id),
  ]);
  if(profile.error||contact.error||details.error||preferred.error)throw new Error("Unable to load profile.");
  const selected=new Set((preferred.data??[]).map(item=>item.location_id));
  const saved=(await searchParams).saved==="1";
  return <DashboardShell active="talent" current="/dashboard/talent/profile"><div className="max-w-3xl"><span className="badge badge-accent">Talent profile</span><h1 className="mt-3 text-4xl font-black">Your profile and locations</h1><p className="mt-2 text-[var(--muted)]">Your selected work cities control matching alerts. Your profile picture is visible to people who review your talent profile.</p>{saved?<p className="alert mt-5" role="status">Profile saved.</p>:null}<div className="panel mt-6 p-6"><ProfileImageForm kind="Profile picture" imageUrl={profile.data.avatar_url ? `/api/media/talent/${talent.id}` : null}/></div><AuthActionForm action={saveTalentProfile} className="panel mt-6 grid gap-5 p-6">
    <fieldset className="grid gap-4"><legend className="text-lg font-black">Basic information</legend><div className="grid gap-4 sm:grid-cols-2"><label className="label">Phone <span className="text-red-600">*</span><input className="input" name="phone" type="tel" required maxLength={40} defaultValue={contact.data?.phone??""}/></label><label className="label">Home city <span className="text-red-600">*</span><select className="input" name="home_location_id" required defaultValue={profile.data.home_location_id??""}><option value="" disabled>Select your home city</option>{locations.map(location=><option key={location.id} value={location.id}>{location.name}</option>)}</select></label></div></fieldset>
    <fieldset className="grid gap-3 border-t border-[var(--line)] pt-5"><legend className="text-lg font-black">Preferred work cities <span className="text-red-600">*</span></legend><p className="text-sm text-[var(--muted)]">You will only receive job alerts for these cities.</p><div className="grid gap-3 sm:grid-cols-2">{locations.map(location=><label className="flex items-center gap-2 rounded-xl border border-[var(--line)] p-3" key={location.id}><input type="checkbox" name="preferred_location_ids" value={location.id} defaultChecked={selected.has(location.id)}/><span>{location.name}</span></label>)}</div></fieldset>
    <fieldset className="grid gap-4 border-t border-[var(--line)] pt-5"><legend className="text-lg font-black">Professional details <span className="field-optional">Optional</span></legend><label className="label">Headline<input className="input" name="headline" defaultValue={details.data?.headline??""}/></label><label className="label">Bio<textarea className="input textarea" name="bio" defaultValue={details.data?.bio??""}/></label><div className="grid gap-4 sm:grid-cols-2"><label className="label">Skills<input className="input" name="skills" defaultValue={(details.data?.skills??[]).join(", ")}/></label><label className="label">Languages<input className="input" name="languages" defaultValue={(details.data?.languages??[]).join(", ")}/></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="label">Experience in years<input className="input" name="experience_years" type="number" min={0} max={99} step={0.5} defaultValue={details.data?.experience_years??0}/></label><label className="label">Availability<input className="input" name="availability" defaultValue={details.data?.availability??""}/></label></div><label className="label">Documents note<textarea className="input textarea" name="documents_note" defaultValue={details.data?.documents_note??""}/></label></fieldset>
    <SubmitButton pendingText="Saving profile…">Save profile</SubmitButton>
  </AuthActionForm></div></DashboardShell>;
}
