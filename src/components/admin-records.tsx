import Link from "next/link";
import type {ReactNode} from "react";
import {DataTable,type DataColumn} from "@/components/data-table";
import {StatusBadge} from "@/components/status-badge";

export type AdminColumn={key:string;label:string;format?:(value:unknown,row:Record<string,unknown>)=>ReactNode;width?:string;className?:string;align?:"left"|"center"|"right"};
export function AdminFilters({q,status,sort,view,statuses=[]}:{q:string;status:string;sort:string;view:string;statuses?:string[]}){
 return <form className="panel mb-5 flex flex-wrap items-end gap-3 p-4" method="get"><input name="view" type="hidden" value={view}/><label className="label min-w-56 flex-1"><span>Search</span><input className="input" defaultValue={q} name="q" placeholder="Search records"/></label>{statuses.length>0&&<label className="label min-w-44"><span>Status</span><select className="input" defaultValue={status} name="status"><option value="">All statuses</option>{statuses.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}</select></label>}<label className="label min-w-36"><span>Order</span><select className="input" defaultValue={sort} name="sort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label><button className="button button-primary" type="submit">Apply</button></form>;
}

export function AdminTable({title,total,rows,columns,renderActions,empty="No records found."}:{title:string;total:number;rows:Record<string,unknown>[];columns:AdminColumn[];renderActions?:(row:Record<string,unknown>)=>ReactNode;empty?:string}){
 const tableColumns:DataColumn<Record<string,unknown>>[]=columns.map(column=>({key:column.key,label:column.label,width:column.width,className:column.className,align:column.align,render:row=>column.format?column.format(row[column.key],row):String(row[column.key]??"—")}));
 return <section className="panel overflow-hidden"><div className="border-b border-[var(--line)] px-5 py-4"><h2 className="text-xl font-black">{title}</h2><p className="text-sm text-[var(--muted)]">{total.toLocaleString("en-IN")} total record{total===1?"":"s"}</p></div><DataTable ariaLabel={title} columns={tableColumns} emptyMessage={empty} getRowKey={row=>String(row.id)} renderActions={renderActions} rows={rows}/></section>;
}

export function AdminPagination({page,hasNext,q,status,sort,view}:{page:number;hasNext:boolean;q:string;status:string;sort:string;view:string}){
 const href=(next:number)=>`?${new URLSearchParams({view,...(q?{q}:{}),...(status?{status}:{}),...(sort!=="newest"?{sort}:{}),page:String(next)})}`;
 return <nav aria-label="Pagination" className="mt-5 flex items-center justify-between">{page===1?<span className="button button-secondary opacity-50">Previous</span>:<Link className="button button-secondary" href={href(page-1)} prefetch={false}>Previous</Link>}<span className="text-sm font-bold">Page {page}</span>{hasNext?<Link className="button button-secondary" href={href(page+1)} prefetch={false}>Next</Link>:<span className="button button-secondary opacity-50">Next</span>}</nav>;
}

export function DateCell({value}:{value:unknown}){if(!value)return <>—</>;const date=new Date(String(value));return <>{Number.isNaN(date.valueOf())?String(value):date.toLocaleDateString("en-IN")}</>;}
export function StatusCell({value}:{value:unknown}){return <StatusBadge status={String(value??"unknown")}/>;}
