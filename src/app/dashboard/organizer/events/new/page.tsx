import { DashboardShell } from '@/components/dashboard-shell';
import { EventForm } from '@/components/organizer/forms';
import { organizerContext } from '@/lib/organizer-server';
export default async function NewEvent() { await organizerContext(); return <DashboardShell active="organizer"><div className="max-w-3xl"><h1 className="mb-6 text-4xl font-black">Create event</h1><EventForm/></div></DashboardShell>; }
