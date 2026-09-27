import { requireExhibitorWorkspace } from "@/lib/dashboard-workspace";
import { selectableEvents } from "@/lib/exhibitor-events";
import { stallsForExhibitor } from "@/lib/exhibitor-stalls";
import { activeLocations } from "@/lib/locations";
import { StallForm } from "@/components/stall-form";

export default async function NewStall(){
 const {entity,profile}=await requireExhibitorWorkspace();
 const [events,stalls,locations]=await Promise.all([selectableEvents(entity.id),stallsForExhibitor(entity.id,profile.id),activeLocations()]);
 return <div className="max-w-3xl"><span className="badge">Exhibitor panel</span><h1 className="my-3 text-4xl font-black">Set up a stall</h1><p className="mb-6 text-[var(--muted)]">Connect the stall to an event, save its operating details, then create staffing requests.</p><StallForm events={events} stalls={stalls} locations={locations} addEventHref="/dashboard/exhibitor/events/new?returnTo=stall"/></div>;
}
