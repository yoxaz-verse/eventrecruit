"use client";
import {useActionState,useEffect,useId,useRef} from "react";
import {Check, ChevronDown, Trash2, X} from "lucide-react";
import {cancelAdminBooking,deleteAdminUser,updateAdminStatus,type AdminActionState} from "@/app/actions/admin";
import {allowedAdminTransition} from "@/lib/admin";
export function AdminActionForm({entity,id,current,options}:{entity:string;id:string;current:string;options:string[]}){
 const [state,action,pending]=useActionState<AdminActionState,FormData>(updateAdminStatus,{error:"",success:""});
 const menu=useRef<HTMLDivElement>(null);const trigger=useRef<HTMLButtonElement>(null);const labelId=useId();
 useEffect(()=>{if(state.success&&menu.current?.matches(":popover-open"))menu.current.hidePopover();},[state.success]);
 const openMenu=()=>{const button=trigger.current,popover=menu.current;if(!button||!popover)return;const rect=button.getBoundingClientRect();popover.style.top=`${Math.max(12,Math.min(rect.bottom+7,window.innerHeight-260))}px`;popover.style.left=`${Math.max(12,Math.min(rect.right-210,window.innerWidth-222))}px`;popover.showPopover();};
 const next=options.filter(option=>allowedAdminTransition(entity,current,option));
 if(next.length===0)return <span className="text-xs text-[var(--muted)]">No actions</span>;
 return <div className="admin-action-wrap"><button aria-haspopup="menu" aria-label={`Change status from ${current.replaceAll("_"," ")}`} className="admin-action-trigger" onClick={openMenu} ref={trigger} type="button"><span>Status</span><ChevronDown size={14} aria-hidden/></button><div aria-labelledby={labelId} className="admin-action-menu" popover="auto" ref={menu} role="menu"><p className="admin-action-label" id={labelId}>Change status</p><form action={action}><input name="entity" type="hidden" value={entity}/><input name="id" type="hidden" value={id}/><div className="admin-status-options">{next.map(option=><button aria-label={`Set status to ${option.replaceAll("_"," ")}`} className="admin-status-option" disabled={pending} key={option} name="status" role="menuitem" type="submit" value={option}><Check size={13} aria-hidden/><span>{option.replaceAll("_"," ")}</span></button>)}</div></form>{pending&&<p className="admin-action-message" role="status">Saving…</p>}{state.error&&<p className="admin-action-error" role="alert">{state.error}</p>}{state.success&&<p className="admin-action-success" role="status">{state.success}</p>}</div></div>;
}
export function AdminCancelBooking({id}:{id:string}){
 const [state,action,pending]=useActionState<AdminActionState,FormData>(cancelAdminBooking,{error:"",success:""});
 return <form action={action} className="grid gap-1"><input name="id" type="hidden" value={id}/><button className="button button-secondary px-3 py-2 text-xs" disabled={pending} type="submit">{pending?"Cancelling…":"Cancel booking"}</button>{state.error&&<span className="text-xs text-red-700" role="alert">{state.error}</span>}{state.success&&<span className="text-xs font-bold text-emerald-700" role="status">{state.success}</span>}</form>;
}

export function AdminDeleteUser({id,name,email}:{id:string;name:string;email:string}){
 const [state,action,pending]=useActionState<AdminActionState,FormData>(deleteAdminUser,{error:"",success:""});
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(state.success&&dialog.current?.open)dialog.current.close();},[state.success]);
 return <div className="admin-delete-wrap"><button aria-label={`Delete ${name}`} className="admin-delete-trigger" onClick={()=>dialog.current?.showModal()} type="button"><Trash2 size={15} aria-hidden/><span>Delete</span></button><dialog aria-labelledby={`delete-title-${id}`} className="admin-delete-dialog" ref={dialog}><form method="dialog"><button aria-label="Close delete confirmation" className="admin-dialog-close" type="submit"><X size={18} aria-hidden/></button></form><div className="flex items-center gap-3 pr-8"><div className="admin-delete-icon"><Trash2 size={20} aria-hidden/></div><div><h2 id={`delete-title-${id}`}>Delete user?</h2><p className="text-xs text-[var(--muted)]">Permanent account removal</p></div></div><div className="mt-4 p-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs"><p className="font-bold text-[var(--foreground)]">{name}</p><p className="text-[var(--muted)] mt-0.5">{email}</p></div><p className="admin-delete-warning">This permanently deletes the account and its owned profile data. This cannot be undone.</p><div className="admin-dialog-actions"><form method="dialog"><button className="button button-secondary admin-dialog-button" type="submit">Cancel</button></form><form action={action}><input name="id" type="hidden" value={id}/><button className="button admin-delete-confirm admin-dialog-button" disabled={pending} type="submit">{pending?"Deleting…":"Delete user"}</button></form></div>{state.error&&<p className="admin-action-error" role="alert">{state.error}</p>}</dialog></div>;
}
