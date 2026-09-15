import Link from "next/link";
import {AlertTriangle,ArrowRight,ShieldCheck} from "lucide-react";
import {DashboardShell} from "@/components/dashboard-shell";
import {StatusBadge} from "@/components/status-badge";
import {requireRole} from "@/lib/auth";
import {adminCounts} from "@/lib/admin-data";
import {createClient} from "@/lib/supabase/server";

export default async function AdminDashboard(){
 await requireRole(["admin"]);const db=await createClient();if(!db)throw new Error("Admin data is temporarily unavailable.");
 const [counts,pendingProfiles,pendingEvents,newInquiries,pendingRelationships,cancellationRequests,hiddenReviews]=await Promise.all([
  adminCounts(),
  db.from("profiles").select("id,full_name,role,verification_status,created_at").eq("verification_status","pending_verification").neq("role","admin").order("created_at",{ascending:false}).limit(5),
  db.from("exhibitor_event_submissions").select("id,title,status,created_at").eq("status","pending").order("created_at",{ascending:false}).limit(5),
  db.from("event_space_inquiries").select("id,event_id,status,created_at").eq("status","new").order("created_at",{ascending:false}).limit(5),
  db.from("agency_exhibitor_relationships").select("id,invited_email,status,created_at").eq("status","pending").order("created_at",{ascending:false}).limit(5),
  db.from("applications").select("id,talent_id,status,cancellation_requested_at").not("cancellation_requested_at","is",null).order("cancellation_requested_at",{ascending:false}).limit(5),
  db.from("placement_reviews").select("id,rating,visibility_status,created_at").eq("visibility_status","hidden").order("created_at",{ascending:false}).limit(5),
 ]);
 if([pendingProfiles,pendingEvents,newInquiries,pendingRelationships,cancellationRequests,hiddenReviews].some(x=>x.error&&x.error.code!=="PGRST205"))throw new Error("Unable to load one or more admin attention queues.");
 const queues=[
  {label:"Users awaiting verification",href:"/dashboard/admin/users?status=pending_verification",rows:pendingProfiles.data?.map(x=>({name:x.full_name,detail:x.role,status:x.verification_status}))??[]},
  {label:"Events awaiting review",href:"/dashboard/admin/events?status=pending",rows:pendingEvents.data?.map(x=>({name:x.title,detail:"Exhibitor submission",status:x.status}))??[]},
  {label:"New space inquiries",href:"/dashboard/admin/bookings?status=new",rows:newInquiries.data?.map(x=>({name:`Inquiry ${x.id.slice(0,8)}`,detail:`Event ${x.event_id.slice(0,8)}`,status:x.status}))??[]},
  {label:"Pending agency relationships",href:"/dashboard/admin/network?status=pending",rows:pendingRelationships.data?.map(x=>({name:x.invited_email||"Agency invitation",detail:"Relationship request",status:x.status}))??[]},
  {label:"Cancellation requests",href:"/dashboard/admin/workforce",rows:cancellationRequests.data?.map(x=>({name:`Application ${x.id.slice(0,8)}`,detail:`Talent ${x.talent_id.slice(0,8)}`,status:x.status}))??[]},
  {label:"Hidden reviews",href:"/dashboard/admin/reputation?status=hidden",rows:hiddenReviews.data?.map(x=>({name:`${x.rating}-star review`,detail:`Review ${x.id.slice(0,8)}`,status:x.visibility_status}))??[]},
 ];
 return <DashboardShell active="admin"><div className="page-kicker"><span className="badge">Admin stronghold</span><h1 className="mt-3 text-4xl font-black">Platform control center</h1><p className="mt-2 text-[var(--muted)]">Live operational totals and the records that need attention now.</p></div><section className="grid-auto">{counts.map(item=><div className="panel p-5" key={item.label}><p className="text-sm font-bold text-[var(--muted)]">{item.label}</p><strong className="mt-2 block text-3xl">{item.value.toLocaleString("en-IN")}</strong></div>)}</section><section className="mt-8"><div className="mb-4 flex items-center gap-2"><AlertTriangle className="text-amber-600"/><h2 className="text-2xl font-black">Needs attention</h2></div><div className="grid gap-5 xl:grid-cols-2">{queues.map(queue=><article className="panel p-5" key={queue.label}><div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-black">{queue.label}</h3><Link className="flex items-center gap-1 text-sm font-bold text-[var(--accent)]" href={queue.href}>Manage <ArrowRight size={15}/></Link></div><div className="grid gap-2">{queue.rows.map((row,index)=><div className="surface-card flex items-center justify-between gap-3 p-3" key={`${row.name}-${index}`}><div><strong className="text-sm">{row.name}</strong><p className="text-xs text-[var(--muted)]">{row.detail}</p></div><StatusBadge status={row.status}/></div>)}{queue.rows.length===0&&<p className="text-sm text-[var(--muted)]">Nothing needs attention.</p>}</div></article>)}</div></section><section className="panel mt-8 flex items-start gap-3 p-5"><ShieldCheck className="mt-1 text-[var(--accent)]"/><div><h2 className="text-xl font-black">Protected administration</h2><p className="mt-1 text-sm text-[var(--muted)]">Every view and mutation rechecks the administrator session. Personal contacts stay masked until explicitly revealed.</p></div></section></DashboardShell>;
}
