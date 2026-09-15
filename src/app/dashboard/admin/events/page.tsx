import {AdminSectionPage} from "@/components/admin-section-page";
export default function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <AdminSectionPage section="events" searchParams={searchParams}/>;}
