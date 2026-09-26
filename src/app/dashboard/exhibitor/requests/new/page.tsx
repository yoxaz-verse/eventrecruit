
import { StaffingRequestForm } from "@/components/staffing-request-form";
import { selectableEvents } from "@/lib/exhibitor-events";
import { requireExhibitorWorkspace } from "@/lib/dashboard-workspace";

export default async function NewExhibitorRequest() {
  const {entity}=await requireExhibitorWorkspace();
  const events = await selectableEvents(entity.id);
  return <><span className="badge">Exhibitor panel</span><h1 className="mt-3 mb-6 text-4xl font-black">New staffing request</h1><div className="max-w-2xl"><StaffingRequestForm source="exhibitor" events={events}/></div></>;
}
