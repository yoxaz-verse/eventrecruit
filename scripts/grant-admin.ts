import { createClient } from "@supabase/supabase-js";
import { checkNewPassword } from "../src/lib/password-strength";
import { hashPassword, verifyPassword } from "../src/lib/password-hash";

const email = String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD ?? "");
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || email.length > 254) { console.error("ADMIN_EMAIL must be valid."); process.exit(1); }
const strength = checkNewPassword(password);
if (!strength.strong) { console.error(`ADMIN_PASSWORD is not strong enough. ${strength.reason}`); process.exit(1); }
if (!url || !key) { console.error("Supabase server configuration is missing."); process.exit(1); }

async function main(){
const db = createClient(url!,key!,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:existing,error:lookupError}=await db.from("app_accounts").select("id,password_hash").eq("email",email).maybeSingle();
if(lookupError){console.error(`Unable to inspect the administrator account (${lookupError.code||"database_error"}).`);process.exit(1);}
let accountId=existing?.id;
let passwordChanged=false;
if(!existing){
  const {data,error}=await db.from("app_accounts").insert({email,password_hash:await hashPassword(password),email_verified_at:new Date().toISOString()}).select("id").single();
  if(error||!data){console.error("Unable to create the administrator account.");process.exit(1);}
  accountId=data.id; passwordChanged=true;
}else{
  passwordChanged=!await verifyPassword(password,existing.password_hash);
  const update:{email_verified_at:string;password_hash?:string}={email_verified_at:new Date().toISOString()};
  if(passwordChanged)update.password_hash=await hashPassword(password);
  const {error}=await db.from("app_accounts").update(update).eq("id",existing.id);
  if(error){console.error("Unable to update the administrator account.");process.exit(1);}
}
const now=new Date().toISOString();
const {error:profileError}=await db.from("profiles").upsert({id:accountId,full_name:"Platform Administrator",role:"admin",verification_status:"verified",onboarding_completed_at:now,updated_at:now});
if(profileError){console.error("Unable to provision the administrator profile.");process.exit(1);}
if(passwordChanged)await db.from("app_sessions").delete().eq("account_id",accountId);
console.log(passwordChanged?"Administrator provisioned; existing sessions were revoked.":"Administrator is already provisioned.");
}
main().catch(()=>{console.error("Administrator provisioning failed unexpectedly.");process.exit(1);});
