import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { organizerContext } from "@/lib/organizer-server";
import { reviewParticipation } from "@/app/actions/participation";
import { SubmitButton } from "@/components/submit-button";

export default async function Participants({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const {db,company}=await organizerContext();
  const {data:event}=await db.from("organizer_events").select("id,title").eq("id",id).eq("company_id",company!.id).maybeSingle();
  if (!event) notFound();
  const {data:rows,error}=await db.from("exhibitor_event_participation").select("id,exhibitor_id,status").eq("event_id",id).order("created_at",{ascending:false});
  if (error) throw new Error("Unable to load participation requests.");
  const {data:exhibitors}=rows?.length ? await db.from("exhibitors").select("id,company_name").in("id",rows.map(row=>row.exhibitor_id)) : {data:[]};
  return <DashboardShell active="organizer"><h1 className="text-3xl font-bold">{event.title} exhibitors</h1><p className="mb-6 mt-2 text-sm">Approve exhibitors before their names appear publicly.</p><div className="grid gap-3">{rows?.map(row=><article className="panel p-5" key={row.id}><h2 className="font-bold">{exhibitors?.find(item=>item.id===row.exhibitor_id)?.company_name??"Exhibitor"}</h2><p className="text-sm">{row.status}</p>{row.status === "pending" ? <div className="mt-3 flex gap-3">{["approved","rejected"].map(status=><form action={reviewParticipation} key={status}><input type="hidden" name="participation_id" value={row.id}/><input type="hidden" name="status" value={status}/><SubmitButton pendingText="Saving…">{status === "approved" ? "Approve" : "Reject"}</SubmitButton></form>)}</div>:null}</article>)}</div>{!rows?.length?<p>No participation requests yet.</p>:null}</DashboardShell>;
}
