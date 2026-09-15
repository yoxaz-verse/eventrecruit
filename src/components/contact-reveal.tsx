"use client";
import {useActionState} from "react";
import {revealAdminContact,type AdminActionState} from "@/app/actions/admin";
export function ContactReveal({profileId,maskedPhone,maskedEmail}:{profileId:string;maskedPhone:string;maskedEmail:string}){
 const [state,action,pending]=useActionState<AdminActionState,FormData>(revealAdminContact,{error:"",success:""});
 return <form action={action} className="grid gap-1 text-xs"><input name="profile_id" type="hidden" value={profileId}/><span>{state.phone??maskedPhone}</span><span>{state.email??maskedEmail}</span>{!state.phone&&<button className="text-left font-bold text-[var(--accent)] underline" disabled={pending} type="submit">{pending?"Revealing…":"Reveal contact"}</button>}{state.error&&<span className="text-red-700" role="alert">{state.error}</span>}</form>;
}
