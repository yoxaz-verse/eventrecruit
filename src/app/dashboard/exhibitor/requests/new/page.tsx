import { DashboardShell } from "@/components/dashboard-shell";
import { StaffingRequestForm } from "@/components/staffing-request-form";
import { requireRole } from "@/lib/auth";
import { selectableEvents } from "@/lib/exhibitor-events";

export default async function NewExhibitorRequest() {
  await requireRole(["exhibitor"]);
  const events = await selectableEvents();
  return <DashboardShell active="exhibitor" current="/dashboard/exhibitor/requests"><span className="badge">Exhibitor panel</span><h1 className="mt-3 mb-6 text-4xl font-black">New staffing request</h1><div className="max-w-2xl"><StaffingRequestForm source="exhibitor" events={events}/></div></DashboardShell>;
}
