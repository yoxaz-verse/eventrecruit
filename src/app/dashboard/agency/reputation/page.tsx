
import { AgencyClientSelector } from "@/components/agency-client-selector";
import { ReviewForm } from "@/components/reputation/review-form";
import { agencyClients, selectedAgencyClient } from "@/lib/agency-workspace";
import { createClient } from "@/lib/supabase/server";

export default async function AgencyReputation({searchParams}:{searchParams:Promise<{client?:string}>}) {
  const clients=await agencyClients(), selected=selectedAgencyClient(clients,(await searchParams).client), db=await createClient();
  if(!db) throw new Error("Reputation unavailable.");
  const {data:reputation,error}=selected?await db.from("exhibitor_reputation").select("*").eq("exhibitor_id",selected.exhibitorId).maybeSingle():{data:null,error:null};
  if(error) throw new Error("Unable to load reputation.");
  const {data:events}=selected?await db.from("events").select("id").eq("exhibitor_id",selected.exhibitorId):{data:[]};
  const eventIds=(events??[]).map(event=>event.id);
  const {data:roles}=eventIds.length?await db.from("staffing_roles").select("id,title").in("event_id",eventIds):{data:[]};
  const roleIds=(roles??[]).map(role=>role.id);
  const {data:placements}=roleIds.length?await db.from("placements").select("id,talent_id,staffing_role_id").in("staffing_role_id",roleIds).eq("status","completed"):{data:[]};
  const placementIds=(placements??[]).map(placement=>placement.id);
  const {data:reviews}=placementIds.length?await db.from("placement_reviews").select("placement_id").in("placement_id",placementIds).eq("reviewer_exhibitor_id",selected!.exhibitorId):{data:[]};
  const reviewed=new Set((reviews??[]).map(review=>review.placement_id));
  const pending=(placements??[]).filter(placement=>!reviewed.has(placement.id));
  const talentIds=[...new Set(pending.map(placement=>placement.talent_id))];
  const {data:talent}=talentIds.length?await db.from("profiles").select("id,full_name").in("id",talentIds):{data:[]};
  const talentNames=new Map((talent??[]).map(person=>[person.id,person.full_name]));
  const roleNames=new Map((roles??[]).map(role=>[role.id,role.title]));
  const metrics=[["Trust score",reputation?.trust_score??100],["Average rating",Number(reputation?.average_rating??0).toFixed(2)],["Completed",reputation?.completed_count??0],["Reliability",reputation?.reliability_score??100],["Communication",reputation?.communication_score??100],["Professionalism",reputation?.professionalism_score??100]];
  return <><h1 className="text-4xl font-black">Client reputation</h1><AgencyClientSelector clients={clients} selected={selected} path="/dashboard/agency/reputation"/>{selected?<><div className="grid gap-4 md:grid-cols-3">{metrics.map(([label,value])=><article className="panel p-5" key={label}><p className="text-sm font-bold text-[var(--muted)]">{label}</p><strong className="text-3xl font-black">{value}</strong></article>)}</div><section className="mt-8"><h2 className="mb-4 text-2xl font-black">Placement reviews</h2><div className="grid gap-4">{pending.map(placement=><ReviewForm key={placement.id} placementId={placement.id} revieweeId={placement.talent_id} revieweeRole="talent" exhibitorId={selected.exhibitorId} title={`Review ${talentNames.get(placement.talent_id)??"talent"} · ${roleNames.get(placement.staffing_role_id)??"placement"}`}/>)}{!pending.length?<p className="panel p-5">No completed placements are awaiting a review.</p>:null}</div></section></>:null}</>;
}
