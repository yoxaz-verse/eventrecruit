import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ExhibitorRequests() {
  const profile = await requireRole(["exhibitor"]);
  const db = await createClient();
  if (!db) throw new Error("Requests are temporarily unavailable.");
  const { data, error } = await db.from("events").select("id,title,city,starts_at,staffing_roles(id,title,headcount,status)").eq("created_by", profile.id).order("created_at", { ascending: false });
  if (error) throw new Error("Unable to load requests.");
  const roles = (data ?? []).flatMap(event => (event.staffing_roles ?? []).map(role => ({ ...role, event })));
  return <DashboardShell active="exhibitor" current="/dashboard/exhibitor/requests"><span className="badge">Exhibitor panel</span><h1 className="mt-3 text-4xl font-black">Requests</h1><p className="mt-2 text-[var(--muted)]">Manage requests connected to your events. Staffing is the first available request type.</p><Link className="button button-primary my-6" href="/dashboard/exhibitor/requests/new">New staffing request</Link><div className="grid gap-4">{roles.map(role => <article className="panel p-5" key={role.id}><span className="badge">Staffing · {role.status}</span><h2 className="mt-3 text-xl font-bold">{role.title}</h2><p>{role.event.title} · {role.event.city} · {role.event.starts_at}</p><p>{role.headcount} people needed</p></article>)}{!roles.length && <p className="panel p-5">No requests yet. Create a staffing request to get started.</p>}</div></DashboardShell>;
}
