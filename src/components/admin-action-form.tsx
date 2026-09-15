"use client";
import {useActionState} from "react";
import {updateAdminStatus,type AdminActionState} from "@/app/actions/admin";
import {cancelAdminBooking} from "@/app/actions/admin";
export function AdminActionForm({entity,id,current,options}:{entity:string;id:string;current:string;options:string[]}){
 const [state,action,pending]=useActionState<AdminActionState,FormData>(updateAdminStatus,{error:"",success:""});
 return <form action={action} className="flex min-w-52 flex-wrap items-center gap-2"><input name="entity" type="hidden" value={entity}/><input name="id" type="hidden" value={id}/><select aria-label="New status" className="input py-2 text-xs" defaultValue="" name="status" required><option disabled value="">Change status</option>{options.filter(x=>x!==current).map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}</select><button className="button button-secondary px-3 py-2 text-xs" disabled={pending} type="submit">{pending?"Saving…":"Update"}</button>{state.error&&<span className="text-xs text-red-700" role="alert">{state.error}</span>}{state.success&&<span className="text-xs font-bold text-emerald-700" role="status">{state.success}</span>}</form>;
}
export function AdminCancelBooking({id}:{id:string}){
 const [state,action,pending]=useActionState<AdminActionState,FormData>(cancelAdminBooking,{error:"",success:""});
 return <form action={action} className="grid gap-1"><input name="id" type="hidden" value={id}/><button className="button button-secondary px-3 py-2 text-xs" disabled={pending} type="submit">{pending?"Cancelling…":"Cancel booking"}</button>{state.error&&<span className="text-xs text-red-700" role="alert">{state.error}</span>}{state.success&&<span className="text-xs font-bold text-emerald-700" role="status">{state.success}</span>}</form>;
}
