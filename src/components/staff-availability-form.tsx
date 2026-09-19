"use client";
import { setStaffAvailability } from "@/app/actions/agency-operations";
export function StaffAvailabilityForm({id,status}:{id:string;status:string}){return <form action={setStaffAvailability} className="flex items-center gap-2"><input type="hidden" name="id" value={id}/><select className="input" name="availability_status" defaultValue={status} onChange={event=>event.currentTarget.form?.requestSubmit()}><option value="available">Available</option><option value="partially_available">Partial</option><option value="unavailable">Unavailable</option></select></form>}
