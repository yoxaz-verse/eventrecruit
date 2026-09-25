import {notFound} from "next/navigation";
import {AdminOrganizationDetailPage} from "@/components/admin-organization-detail";
import {requireRole} from "@/lib/auth";
import {isAdminOrganizationType,isAdminUuid} from "@/lib/admin";
import {loadAdminOrganizationDetail} from "@/lib/admin-organization-detail";

export default async function Page({params}:{params:Promise<{type:string;id:string}>}){
 await requireRole(["admin"]);
 const {type,id}=await params;
 if(!isAdminOrganizationType(type)||!isAdminUuid(id))notFound();
 const detail=await loadAdminOrganizationDetail(type,id);
 if(!detail)notFound();
 return <AdminOrganizationDetailPage detail={detail}/>;
}
