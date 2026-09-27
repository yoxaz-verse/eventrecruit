
import { StaffingRequestForm } from "@/components/staffing-request-form";
import { selectableEvents } from "@/lib/exhibitor-events";
import { requireExhibitorWorkspace } from "@/lib/dashboard-workspace";
import { activeLocations, type LocationOption } from "@/lib/locations";
import Link from "next/link";
import { stallsForExhibitor } from "@/lib/exhibitor-stalls";

export default async function NewExhibitorRequest({searchParams}:{searchParams:Promise<{stall?:string}>}) {
  const {entity,profile}=await requireExhibitorWorkspace();
  const events = await selectableEvents(entity.id);
  const stalls=await stallsForExhibitor(entity.id,profile.id);
  let locations:LocationOption[]=[];
  let locationError=false;
  try { locations=await activeLocations(); locationError=locations.length===0; }
  catch(error){locationError=true;console.error("Unable to load staffing request locations",error instanceof Error?error.message:"Unknown error");}
  const selectedStall=(await searchParams).stall??"";
  return <><span className="badge">Exhibitor panel</span><h1 className="mt-3 mb-6 text-4xl font-black">New staffing request</h1><div className="max-w-2xl">{!stalls.length?<div className="alert mb-5"><strong>Set up a stall first.</strong><p className="mt-1">Every new staffing request must belong to a stall.</p><Link className="button button-primary mt-3" href="/dashboard/exhibitor/stalls/new">Create stall</Link></div>:null}{locationError?<div className="alert mb-5" role="alert">The city list is temporarily unavailable. <Link className="underline" href="/dashboard/exhibitor/requests/new">Try loading it again.</Link></div>:null}{stalls.length?<StaffingRequestForm source="exhibitor" events={events} stalls={stalls} selectedStall={selectedStall} locations={locations} locationError={locationError}/>:null}</div></>;
}
