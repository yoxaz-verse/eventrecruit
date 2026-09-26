import {notFound} from "next/navigation";
import {AdminOrganizationDetailPage} from "@/components/admin-organization-detail";
import {requireAdminWorkspace} from "@/lib/dashboard-workspace";
import {isAdminOrganizationType,isAdminUuid} from "@/lib/admin";
import {loadAdminOrganizationDetail} from "@/lib/admin-organization-detail";

export default async function Page({params}:{params:Promise<{type:string;id:string}>}){
 const [,{type,id}]=await Promise.all([requireAdminWorkspace(),params]);
 if(!isAdminOrganizationType(type)||!isAdminUuid(id))notFound();
 const detail=await loadAdminOrganizationDetail(type,id);
 if(!detail)notFound();
 return <AdminOrganizationDetailPage detail={detail}/>;
}
