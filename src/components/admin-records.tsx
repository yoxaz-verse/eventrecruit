import Link from "next/link";
import {AdminActionForm} from "@/components/admin-action-form";
import {StatusBadge} from "@/components/status-badge";
import {adminStatusOptions} from "@/lib/admin";

export type AdminColumn={key:string;label:string;format?:(value:unknown,row:Record<string,unknown>)=>React.ReactNode};
export function AdminFilters({q,status,sort,statuses=[]}:{q:string;status:string;sort:string;statuses?:string[]}){
 return <form className="panel mb-5 flex flex-wrap items-end gap-3 p-4" method="get"><label className="label min-w-56 flex-1"><span>Search</span><input className="input" defaultValue={q} name="q" placeholder="Search records"/></label>{statuses.length>0&&<label className="label min-w-44"><span>Status</span><select className="input" defaultValue={status} name="status"><option value="">All statuses</option>{statuses.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}</select></label>}<label className="label min-w-36"><span>Order</span><select className="input" defaultValue={sort} name="sort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label><button className="button button-primary" type="submit">Apply</button></form>;
}

export function AdminTable({title,rows,columns,entity,statusKey="status",empty="No records found."}:{title:string;rows:Record<string,unknown>[];columns:AdminColumn[];entity?:string;statusKey?:string;empty?:string}){
 return <section className="panel overflow-hidden"><div className="border-b border-[var(--line)] p-5"><h2 className="text-xl font-black">{title}</h2><p className="text-sm text-[var(--muted)]">{rows.length} record{rows.length===1?"":"s"} on this page</p></div>{rows.length===0?<p className="p-5 text-[var(--muted)]">{empty}</p>:<div className="overflow-x-auto"><table className="table"><thead><tr>{columns.map(c=><th key={c.key}>{c.label}</th>)}{entity&&<th>Management</th>}</tr></thead><tbody>{rows.map(row=><tr key={String(row.id)}>{columns.map(c=><td key={c.key}>{c.format?c.format(row[c.key],row):String(row[c.key]??"—")}</td>)}{entity&&<td><AdminActionForm current={String(row[statusKey]??"")} entity={entity} id={String(row.id)} options={adminStatusOptions[entity]??[]}/></td>}</tr>)}</tbody></table></div>}</section>;
}

export function AdminPagination({page,hasNext,q,status,sort}:{page:number;hasNext:boolean;q:string;status:string;sort:string}){
 const href=(next:number)=>`?${new URLSearchParams({...(q?{q}:{}),...(status?{status}:{}),...(sort!=="newest"?{sort}:{}),page:String(next)})}`;
 return <nav aria-label="Pagination" className="mt-5 flex items-center justify-between"><Link aria-disabled={page===1} className={`button button-secondary ${page===1?"pointer-events-none opacity-50":""}`} href={href(Math.max(1,page-1))}>Previous</Link><span className="text-sm font-bold">Page {page}</span><Link aria-disabled={!hasNext} className={`button button-secondary ${!hasNext?"pointer-events-none opacity-50":""}`} href={href(page+1)}>Next</Link></nav>;
}

export function DateCell({value}:{value:unknown}){if(!value)return <>—</>;const date=new Date(String(value));return <>{Number.isNaN(date.valueOf())?String(value):date.toLocaleDateString("en-IN")}</>;}
export function StatusCell({value}:{value:unknown}){return <StatusBadge status={String(value??"unknown")}/>;}
