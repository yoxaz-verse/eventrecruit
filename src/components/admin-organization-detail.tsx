import Link from "next/link";
import {DashboardShell} from "@/components/dashboard-shell";
import {StatusBadge} from "@/components/status-badge";
import type {AdminDetailGroup,AdminOrganizationDetail} from "@/lib/admin-organization-detail";

function displayDate(value:string){const parsed=new Date(value);return Number.isNaN(parsed.valueOf())?value:parsed.toLocaleDateString("en-IN");}

function Groups({groups}:{groups:AdminDetailGroup[]}){
 return <div className="grid gap-5">{groups.map(group=><section key={group.title}><div className="mb-3 flex items-baseline justify-between gap-3"><h3 className="font-black">{group.title}</h3><span className="text-sm text-[var(--muted)]">{group.items.length} record{group.items.length===1?"":"s"}</span></div>{group.items.length?<div className="grid gap-3">{group.items.map(entry=><article className="rounded-2xl border border-[var(--line)] p-4" key={`${group.title}-${entry.id}`}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><strong className="block break-words">{entry.title}</strong>{entry.description?<p className="mt-1 break-words text-sm text-[var(--muted)]">{entry.description}</p>:null}</div>{entry.status?<StatusBadge status={entry.status}/>:null}</div>{entry.date?<p className="mt-2 text-xs text-[var(--muted)]">{displayDate(entry.date)}</p>:null}</article>)}</div>:<p className="rounded-2xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">No {group.title.toLocaleLowerCase("en-IN")} recorded.</p>}</section>)}</div>;
}

function Accordion({title,children,open=false}:{title:string;children:React.ReactNode;open?:boolean}){
 return <details className="panel overflow-hidden" open={open}><summary className="cursor-pointer list-none px-5 py-4 text-xl font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px]"><span className="flex items-center justify-between gap-4">{title}<span aria-hidden="true" className="text-[var(--muted)]">⌄</span></span></summary><div className="border-t border-[var(--line)] p-5">{children}</div></details>;
}

export function AdminOrganizationDetailPage({detail}:{detail:AdminOrganizationDetail}){
 return <DashboardShell active="admin" current="/dashboard/admin/organizations"><Link className="text-sm font-bold text-[var(--primary)] hover:underline" href={`/dashboard/admin/organizations?view=${detail.type}`}>← Back to {detail.kindLabel.toLocaleLowerCase("en-IN")}s</Link><div className="admin-page-heading mt-5"><span className="badge">{detail.kindLabel}</span><h1 className="mt-3 break-words text-4xl font-black">{detail.name}</h1><p className="mt-2 text-[var(--muted)]">Company information, events, and platform activity.</p></div><div className="grid gap-4"><Accordion open title="Company Overview"><dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{detail.overview.map(field=><div className="min-w-0 rounded-2xl border border-[var(--line)] p-4" key={field.label}><dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{field.label}</dt><dd className="mt-1 break-words whitespace-pre-wrap">{field.value}</dd></div>)}</dl></Accordion><Accordion title="Events"><Groups groups={detail.events}/></Accordion><Accordion title="People and Relationships"><Groups groups={detail.people}/></Accordion><Accordion title="Operational Activity"><Groups groups={detail.activity}/></Accordion><Accordion title="Finance and Reputation"><Groups groups={detail.finance}/></Accordion></div></DashboardShell>;
}
