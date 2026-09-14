import { getCurrentAccount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request:Request,{params}:{params:Promise<{id:string;kind:string}>}) {
 const {id,kind}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id) || !['pricing_chart','floor_layout'].includes(kind)) return new Response('Not found',{status:404});
 const db=await createClient(); if(!db) return new Response('Unavailable',{status:503});
 const {data:event}=await db.from('organizer_events').select('company_id,status,pricing_chart_path,floor_layout_path').eq('id',id).maybeSingle();
 if(!event) return new Response('Not found',{status:404});
 if(event.status!=='published') {
   const account=await getCurrentAccount();
   if(!account) return new Response('Not found',{status:404});
   const {data:company}=await db.from('organizer_companies').select('owner_id').eq('id',event.company_id).maybeSingle();
   if(company?.owner_id!==account.id) return new Response('Not found',{status:404});
 }
 const path=kind==='pricing_chart'?event.pricing_chart_path:event.floor_layout_path;
 if(!path) return new Response('Not found',{status:404});
 const {data:file,error}=await db.storage.from('event-space-assets').download(path);
 if(error || !file) return new Response('Not found',{status:404});
 const contentType=file.type && ['application/pdf','image/png','image/jpeg','image/webp'].includes(file.type)?file.type:'application/octet-stream';
 return new Response(file.stream(),{headers:{'Content-Type':contentType,'Content-Disposition':'inline','Cache-Control':'private, max-age=300','X-Content-Type-Options':'nosniff'}});
}
