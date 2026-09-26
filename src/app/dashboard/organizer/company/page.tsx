
import { CompanyForm } from '@/components/organizer/forms';
import { organizerContext } from '@/lib/organizer-server';
export default async function CompanyPage() {
 const {companies}=await organizerContext(false);
 return <><div className="max-w-3xl"><h1 className="mb-4 text-4xl font-black">Company profiles</h1><p className="mb-6">Manage every company identity that can publish events from this organizer account.</p><div className="grid gap-5">{companies.map(company=><section key={company.id}><h2 className="mb-3 text-2xl font-black">{company.name}</h2><CompanyForm company={company}/></section>)}</div><section className="mt-8"><h2 className="mb-3 text-2xl font-black">Add company</h2><CompanyForm/></section></div></>;
}
