import { SponsorAgencyProfileForm } from "@/components/sponsor-forms";
import { requireSponsorAgencyWorkspace } from "@/lib/dashboard-workspace";

export default async function SponsorAgencyProfilePage() { const { db, entity } = await requireSponsorAgencyWorkspace(); const { data } = await db.from("sponsor_agencies").select("name,city,description,website,contact_phone,logo_path").eq("id", entity.id).single(); return <><h1 className="mb-6 text-4xl font-black">Agency profile</h1><SponsorAgencyProfileForm agency={data ?? entity}/></>; }
