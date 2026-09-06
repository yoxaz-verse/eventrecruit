import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
export async function organizerContext(requireCompany = true) {
 const profile = await requireRole(['organizer']);
 const db = (await createClient())!;
 const {data:company,error}=await db.from('organizer_companies').select('id,name,city,description,website').eq('owner_id',profile.id).maybeSingle();
 if (error) throw new Error('Unable to load company. Check that organizer migrations have been applied.');
 if (!company && requireCompany) redirect('/dashboard/organizer/company');
 return {db,company};
}
