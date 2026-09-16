import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {markSettlementSent} from "@/app/actions/settlements";

export default async function ExhibitorRequests() {
  const profile = await requireRole(["exhibitor"]);
  const db = await createClient();
  if (!db) throw new Error("Requests are temporarily unavailable.");
  const { data, error } = await db.from("events").select("id,title,city,starts_at,verification_status,staffing_roles(id,title,headcount,status,staffing_settlements(id,status,gross_amount,payer_type))").eq("created_by", profile.id).order("created_at", { ascending: false });
  if (error) throw new Error("Unable to load requests.");
  const roles = (data ?? []).flatMap(event => (event.staffing_roles ?? []).map(role => ({ ...role, event })));
  return <DashboardShell active="exhibitor" current="/dashboard/exhibitor/requests"><span className="badge">Exhibitor panel</span><h1 className="mt-3 text-4xl font-black">Requests</h1><p className="mt-2 text-[var(--muted)]">Manage staffing independently from event verification.</p><Link className="button button-primary my-6" href="/dashboard/exhibitor/requests/new">New staffing request</Link><div className="grid gap-4">{roles.map(role => {const settlement=Array.isArray(role.staffing_settlements)?role.staffing_settlements[0]:role.staffing_settlements;return <article className="panel p-5" key={role.id}><div className="flex flex-wrap gap-2"><span className="badge">Staffing · {role.status}</span><span className="badge capitalize">Event · {role.event.verification_status.replaceAll("_"," ")}</span></div><h2 className="mt-3 text-xl font-bold">{role.title}</h2><p>{role.event.title} · {role.event.city} · {role.event.starts_at}</p><p>{role.headcount} people needed</p>{settlement?<div className="mt-4 border-t border-[var(--line)] pt-4"><p className="capitalize">Payment: {settlement.status.replaceAll("_"," ")} · ₹{Number(settlement.gross_amount).toLocaleString("en-IN")}</p>{settlement.payer_type==="exhibitor"&&["pending","failed"].includes(settlement.status)?<form action={markSettlementSent} className="mt-3 flex flex-wrap items-end gap-3"><input type="hidden" name="settlement_id" value={settlement.id}/><label className="label">Payment reference<input className="input" name="reference"/></label><button className="button button-primary">Mark payment sent</button></form>:null}</div>:null}</article>})}{!roles.length && <p className="panel p-5">No requests yet. Create a staffing request to get started.</p>}</div></DashboardShell>;
}
