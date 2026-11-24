import {redirect} from "next/navigation";
export default async function EventVolunteers({params}:{params:Promise<{id:string}>}){const {id}=await params;redirect(`/dashboard/organizer/events/${id}/workforce`)}
