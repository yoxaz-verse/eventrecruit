
import { StaffingRequestForm } from "@/components/staffing-request-form";
import { selectableEvents } from "@/lib/exhibitor-events";
import { requireExhibitorWorkspace } from "@/lib/dashboard-workspace";
import { activeLocations, type LocationOption } from "@/lib/locations";
import Link from "next/link";

export default async function NewExhibitorRequest() {
  const {entity}=await requireExhibitorWorkspace();
  const events = await selectableEvents(entity.id);
  let locations:LocationOption[]=[];
  let locationError=false;
  try { locations=await activeLocations(); locationError=locations.length===0; }
  catch(error){locationError=true;console.error("Unable to load staffing request locations",error instanceof Error?error.message:"Unknown error");}
  return <><span className="badge">Exhibitor panel</span><h1 className="mt-3 mb-6 text-4xl font-black">New staffing request</h1><div className="max-w-2xl">{locationError?<div className="alert mb-5" role="alert">The city list is temporarily unavailable. <Link className="underline" href="/dashboard/exhibitor/requests/new">Try loading it again.</Link></div>:null}<StaffingRequestForm source="exhibitor" events={events} locations={locations} locationError={locationError}/></div></>;
}
