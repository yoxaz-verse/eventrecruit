import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { ExhibitorEventForm } from "@/components/exhibitor-event-form";
import { activeLocations, type LocationOption } from "@/lib/locations";
import Link from "next/link";

export default async function NewExhibitorEvent() {
  await requireRole(["exhibitor"]);
  let locations:LocationOption[]=[];
  let locationError=false;
  try { locations=await activeLocations(); locationError=locations.length===0; } catch (error) {
    locationError=true;
    console.error("Unable to load exhibitor event locations", error instanceof Error ? error.message : "Unknown error");
  }
  return (
    <DashboardShell active="exhibitor" current="/dashboard/exhibitor/events">
      <div className="max-w-2xl">
        <span className="badge badge-accent">Exhibitor panel</span>
        <h1 className="mt-3 mb-2 text-4xl font-black tracking-tight">Submit an event</h1>
        <p className="mb-6 text-[var(--muted)]">Propose an upcoming event for admin review and approval.</p>

        {locationError?<div className="alert mb-5" role="alert">The city list is temporarily unavailable. <Link className="underline" href="/dashboard/exhibitor/events/new">Try loading it again.</Link></div>:null}
        <ExhibitorEventForm locations={locations} locationError={locationError} />
      </div>
    </DashboardShell>
  );
}
