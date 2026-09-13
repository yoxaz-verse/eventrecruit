import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!email || !url || !key) {
  console.error("Usage: npm run auth:grant-admin -- verified-account@example.com");
  process.exit(1);
}
const db = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:account,error:lookupError}=await db.from("app_accounts")
  .select("id,email_verified_at").eq("email",email).maybeSingle();
if(lookupError||!account?.email_verified_at){console.error("Verified app account not found.");process.exit(1);}
const {error}=await db.from("profiles").update({role:"admin",verification_status:"verified"}).eq("id",account.id);
if(error){console.error("Unable to grant admin role.");process.exit(1);}
console.log("Admin role granted.");
