import { DashboardShell } from "@/components/dashboard-shell";
import { StaffingRequestForm } from "@/components/staffing-request-form";
import { requireRole } from "@/lib/auth";
import { selectableEvents } from "@/lib/exhibitor-events";
import { createClient } from "@/lib/supabase/server";

export default async function NewExhibitorRequest() {
  const profile=await requireRole(["exhibitor"]);
  const db=await createClient();
  const {data:exhibitor}=db?await db.from("exhibitors").select("id").eq("owner_id",profile.id).maybeSingle():{data:null};
  const events = await selectableEvents(exhibitor?.id);
  return <DashboardShell active="exhibitor" current="/dashboard/exhibitor/requests"><span className="badge">Exhibitor panel</span><h1 className="mt-3 mb-6 text-4xl font-black">New staffing request</h1><div className="max-w-2xl"><StaffingRequestForm source="exhibitor" events={events}/></div></DashboardShell>;
}
