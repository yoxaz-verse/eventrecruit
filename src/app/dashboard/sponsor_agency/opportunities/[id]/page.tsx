import { notFound } from "next/navigation";
import { SponsorProposalForm } from "@/components/sponsor-forms";
import { requireSponsorAgencyWorkspace } from "@/lib/dashboard-workspace";

export default async function SponsorOpportunityPage({ params }: { params: Promise<{id:string}> }) {
  const { id } = await params; const { db, entity } = await requireSponsorAgencyWorkspace();
  const [{ data: settings }, { data: event }, { data: packages }, { data: brands }] = await Promise.all([
    db.from("event_sponsorship_settings").select("*").eq("event_id", id).eq("is_enabled", true).maybeSingle(), db.from("organizer_events").select("id,title,description,city,starts_at,ends_at,status").eq("id", id).eq("status", "published").maybeSingle(), db.from("sponsorship_packages").select("id,name,description,price,benefits,deliverables,available_slots,display_priority").eq("event_id", id).eq("is_active", true).order("display_priority", { ascending: false }), db.from("sponsor_brands").select("id,name").eq("agency_id", entity.id).eq("is_active", true).order("name")
  ]);
  if (!settings || !event) notFound();
  return <><h1 className="text-4xl font-black">{event.title}</h1><p className="mt-2 text-[var(--muted)]">{event.city} · {event.starts_at}–{event.ends_at}</p><section className="panel my-6 p-6"><h2 className="text-2xl font-black">Sponsor brief</h2><p className="mt-3 whitespace-pre-wrap">{settings.brief}</p></section><div className="mb-6 grid gap-4 md:grid-cols-2">{packages?.map(pkg=><article className="panel p-5" key={pkg.id}><h3 className="text-xl font-black">{pkg.name}</h3><p className="mt-2">{pkg.description}</p><p className="mt-3 font-bold">{pkg.price===null?"Custom price":`₹${Number(pkg.price).toLocaleString("en-IN")}`}</p><p className="mt-2 whitespace-pre-wrap text-sm"><strong>Benefits:</strong> {pkg.benefits}</p></article>)}</div>{brands?.length?<SponsorProposalForm eventId={id} brands={brands} packages={packages??[]} acceptsCash={settings.accepts_cash} acceptsInKind={settings.accepts_in_kind} acceptsCustom={settings.accepts_custom_proposals}/>:<p className="alert">Add an active sponsor brand before submitting a proposal.</p>}</>;
}
