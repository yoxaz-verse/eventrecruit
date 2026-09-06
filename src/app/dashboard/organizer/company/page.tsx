import { DashboardShell } from '@/components/dashboard-shell';
import { CompanyForm } from '@/components/organizer/forms';
import { organizerContext } from '@/lib/organizer-server';
export default async function CompanyPage() {
 const {company}=await organizerContext(false);
 return <DashboardShell active="organizer"><div className="max-w-3xl"><h1 className="mb-4 text-4xl font-black">{company?'Company details':'Register your event company'}</h1><p className="mb-6">One company, all your events. Complete your company profile to get started.</p><CompanyForm company={company??undefined}/></div></DashboardShell>;
}
