import { requestParticipation } from "@/app/actions/participation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { SubmitButton } from "@/components/submit-button";

export async function EventParticipants({eventId}:{eventId:string}) {
  const db = await createClient();
  if (!db) return null;
  const {data:rows} = await db.from("exhibitor_event_participation").select("exhibitor_id").eq("event_id",eventId).eq("status","approved");
  const {data:exhibitors} = rows?.length ? await db.from("exhibitors").select("id,company_name").in("id",rows.map(row=>row.exhibitor_id)) : {data:[]};
  const profile = await getCurrentProfile();
  const {data:ownExhibitor} = profile?.role === "exhibitor" ? await db.from("exhibitors").select("id").eq("owner_id",profile.id).maybeSingle() : {data:null};
  const {data:ownRequest} = ownExhibitor ? await db.from("exhibitor_event_participation").select("status").eq("event_id",eventId).eq("exhibitor_id",ownExhibitor.id).maybeSingle() : {data:null};
  return <section className="panel mt-6 p-6"><h2 className="text-2xl font-bold">Participating exhibitors</h2>
    {exhibitors?.length ? <ul className="mt-3 grid gap-2">{exhibitors.map(item=><li key={item.id}>{item.company_name}</li>)}</ul> : <p className="mt-2 text-sm text-[var(--muted)]">No exhibitors announced yet.</p>}
    {ownExhibitor && !ownRequest ? <form action={requestParticipation} className="mt-4"><input type="hidden" name="event_id" value={eventId}/><SubmitButton pendingText="Requesting…">Request to participate</SubmitButton></form> : null}
    {ownRequest ? <p className="mt-4 text-sm">Your participation: {ownRequest.status}</p> : null}
  </section>;
}
