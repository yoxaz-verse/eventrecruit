import { SponsorBrandForm } from "@/components/sponsor-forms";
import { requireSponsorAgencyWorkspace } from "@/lib/dashboard-workspace";
import Image from "next/image";

export default async function SponsorBrandsPage() {
  const { db, entity } = await requireSponsorAgencyWorkspace();
  const { data, error } = await db.from("sponsor_brands").select("id,name,industry,description,website,logo_path,is_active,created_at").eq("agency_id", entity.id).order("name");
  if (error) throw new Error("Unable to load sponsor brands.");
  return <><h1 className="text-4xl font-black">Sponsor brands</h1><p className="mb-6 mt-2 text-[var(--muted)]">Brands represented by your agency. Contact information remains private.</p><SponsorBrandForm/><section className="mt-8 grid gap-4 sm:grid-cols-2">{data?.map(brand=><article className="panel p-5" key={brand.id}><div className="flex items-center gap-4">{brand.logo_path?<Image unoptimized width={64} height={64} className="h-16 w-16 rounded-xl border object-contain" src={`/api/media/sponsor_brand/${brand.id}`} alt={`${brand.name} logo`}/>:null}<div><h2 className="text-xl font-black">{brand.name}</h2><p className="text-sm text-[var(--muted)]">{brand.industry || "Industry not specified"}</p></div></div><p className="mt-3 line-clamp-3 text-sm">{brand.description}</p><span className="badge mt-3">{brand.is_active?"Active":"Archived"}</span></article>)}{!data?.length?<p className="panel p-5 text-[var(--muted)]">Add the first sponsor brand you represent.</p>:null}</section></>;
}
