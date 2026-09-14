import "server-only";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

export async function sendRolePush(roleId:string) {
  const publicKey=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey=process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;
  webpush.setVapidDetails("mailto:notifications@eventrecruit.app",publicKey,privateKey);
  const db=await createClient();
  if (!db) return;
  const {data:alerts}=await db.from("talent_job_alerts").select("talent_id").eq("staffing_role_id",roleId);
  if (!alerts?.length) return;
  const ids=alerts.map(item=>item.talent_id);
  const [{data:prefs},{data:subscriptions}]=await Promise.all([
    db.from("talent_job_preferences").select("talent_id").eq("notify_push",true).in("talent_id",ids),
    db.from("talent_push_subscriptions").select("id,talent_id,endpoint,p256dh,auth_secret").in("talent_id",ids),
  ]);
  const enabled=new Set((prefs??[]).map(item=>item.talent_id));
  await Promise.all((subscriptions??[]).filter(item=>enabled.has(item.talent_id)).map(async item=>{
    try {
      await webpush.sendNotification({endpoint:item.endpoint,keys:{p256dh:item.p256dh,auth:item.auth_secret}},JSON.stringify({title:"New event staffing role",body:"A matching job is available.",url:"/dashboard/talent"}));
    } catch (error) {
      const status=(error as {statusCode?:number}).statusCode;
      if (status===404 || status===410) await db.from("talent_push_subscriptions").delete().eq("id",item.id);
      else console.error("Talent push delivery failed",status);
    }
  }));
}
