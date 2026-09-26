import { redirect } from 'next/navigation';
import { requireOrganizerWorkspace } from '@/lib/dashboard-workspace';
export async function organizerContext(requireCompany = true) {
 const {db,entity:companies}=await requireOrganizerWorkspace();
 if (!companies.length && requireCompany) redirect('/dashboard/organizer/company');
 return {db,company:companies[0]??null,companies};
}
