import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { requireExhibitorWorkspace } from "@/lib/dashboard-workspace";
import { stallsForExhibitor } from "@/lib/exhibitor-stalls";
import { EmptyState } from "@/components/empty-state";
import { Store } from "lucide-react";

export default async function ExhibitorStalls(){
 const {entity,profile}=await requireExhibitorWorkspace();
 const stalls=await stallsForExhibitor(entity.id,profile.id);
 return <><div className="flex flex-wrap items-end justify-between gap-4"><div><span className="badge">Exhibitor panel</span><h1 className="mt-3 text-4xl font-black">Stalls</h1><p className="mt-2 text-[var(--muted)]">Set up event stalls before creating paid staffing requests.</p></div><Link className="button button-primary" href="/dashboard/exhibitor/stalls/new"><PlusCircle size={18}/>Create stall</Link></div><div className="mt-6 grid gap-4">{stalls.map(stall=><article className="panel p-5" key={stall.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="badge badge-accent">{stall.verificationStatus.replaceAll("_"," ")}</span><h2 className="mt-2 text-xl font-black">{stall.name}</h2><p className="text-sm text-[var(--muted)]">{stall.eventTitle} · {stall.eventCity}{stall.booth_number?` · Booth ${stall.booth_number}`:""}</p></div><Link className="button button-secondary" href={`/dashboard/exhibitor/stalls/${stall.id}`}>View stall</Link></div></article>)}{!stalls.length?<EmptyState icon={Store} title="No stalls yet" description="Create a stall and connect it to an event before requesting staff."/>:null}</div></>;
}
