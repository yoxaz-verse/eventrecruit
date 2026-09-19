import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { parseContactWorkbook } from "@/lib/agency-import";
import { createClient } from "@/lib/supabase/server";

export async function POST(request:Request){
  const profile=await getCurrentProfile(); if(!profile||profile.role!=="agency") return NextResponse.json({error:"Unauthorized"},{status:401});
  const db=await createClient(); if(!db) return NextResponse.json({error:"Unavailable"},{status:503});
  const {data:agency}=await db.from("agencies").select("id").eq("owner_id",profile.id).maybeSingle(); if(!agency) return NextResponse.json({error:"Agency profile required"},{status:403});
  const form=await request.formData(),file=form.get("file");
  if(!(file instanceof File)||file.size===0||file.size>5_000_000) return NextResponse.json({error:"Choose a CSV or XLSX file up to 5 MB."},{status:400});
  if(!/\.(csv|xlsx)$/i.test(file.name)) return NextResponse.json({error:"Only CSV and XLSX files are supported."},{status:400});
  let rows; try{rows=await parseContactWorkbook(await file.arrayBuffer(),file.name);}catch{return NextResponse.json({error:"The spreadsheet could not be read."},{status:400});}
  if(!rows.length||rows.length>2000) return NextResponse.json({error:"The spreadsheet must contain 1 to 2,000 contacts."},{status:400});
  const phones=rows.map(r=>r.phone).filter(Boolean),emails=rows.map(r=>r.email).filter(Boolean);
  const [{data:phoneMatches},{data:emailMatches}]=await Promise.all([
    phones.length?db.from("agency_staff_contacts").select("id,normalized_phone").eq("agency_id",agency.id).in("normalized_phone",phones):Promise.resolve({data:[]}),
    emails.length?db.from("agency_staff_contacts").select("id,normalized_email").eq("agency_id",agency.id).in("normalized_email",emails):Promise.resolve({data:[]}),
  ]);
  const duplicateMap=new Map<string,string>(); for(const x of phoneMatches??[]) if(x.normalized_phone) duplicateMap.set(`p:${x.normalized_phone}`,x.id); for(const x of emailMatches??[]) if(x.normalized_email) duplicateMap.set(`e:${x.normalized_email}`,x.id);
  const preview=rows.map(r=>({...r,duplicateId:duplicateMap.get(`p:${r.phone}`)||duplicateMap.get(`e:${r.email}`)||null}));
  const {data:job,error}=await db.from("agency_contact_imports").insert({agency_id:agency.id,target_type:"staff",file_name:file.name,status:preview.some(r=>r.duplicateId)?"awaiting_resolution":"preview",total_rows:rows.length,created_by:profile.id}).select("id").single();
  if(error||!job) return NextResponse.json({error:"Unable to stage this import."},{status:500});
  await db.from("agency_contact_import_rows").insert(preview.map(r=>({import_id:job.id,row_number:r.rowNumber,values_json:r,validation_errors:r.errors,duplicate_staff_id:r.duplicateId})));
  return NextResponse.json({importId:job.id,rows:preview});
}
