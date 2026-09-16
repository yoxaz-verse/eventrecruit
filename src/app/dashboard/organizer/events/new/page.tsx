import { DashboardShell } from '@/components/dashboard-shell';
import { EventForm } from '@/components/organizer/forms';
import { organizerContext } from '@/lib/organizer-server';
import { activeLocations } from '@/lib/locations';
export default async function NewEvent() { const {companies}=await organizerContext(); const locations=await activeLocations(); return <DashboardShell active="organizer"><div className="max-w-3xl"><h1 className="mb-6 text-4xl font-black">Create event</h1><EventForm locations={locations} companies={companies}/></div></DashboardShell>; }
