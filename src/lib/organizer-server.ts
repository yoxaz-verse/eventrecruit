import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
export async function organizerContext(requireCompany = true) {
 const profile = await requireRole(['organizer']);
 const db = (await createClient())!;
 const {data:memberships,error}=await db.from('organizer_company_memberships').select('permission,organizer_companies(id,name,city,description,website,public_phone,verification_status)').eq('profile_id',profile.id);
 if (error) throw new Error('Unable to load companies. Apply the latest organizer migration.');
 const companies=(memberships??[]).flatMap(row=>{const company=Array.isArray(row.organizer_companies)?row.organizer_companies[0]:row.organizer_companies;return company?[{...company,permission:row.permission}]:[];});
 if (!companies.length && requireCompany) redirect('/dashboard/organizer/company');
 return {db,company:companies[0]??null,companies};
}
