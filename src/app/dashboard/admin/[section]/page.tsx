import {notFound} from "next/navigation";
import {AdminSectionPage,validAdminSection} from "@/components/admin-section-page";
export default async function Page({params,searchParams}:{params:Promise<{section:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){const {section}=await params;if(!validAdminSection(section)||section==="events")notFound();return <AdminSectionPage section={section} searchParams={searchParams}/>;}
