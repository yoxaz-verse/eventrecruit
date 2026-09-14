"use client";
import { useEffect, useState } from "react";
import { savePushSubscription } from "@/app/actions/talent-jobs";

function keyBytes(value:string) {
  const padded=value.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(value.length/4)*4,"=");
  return Uint8Array.from(atob(padded),char=>char.charCodeAt(0));
}

export function TalentBrowserAlerts({enabled,alerts,publicKey}:{enabled:boolean;alerts:{id:string;created_at:string}[];publicKey:string}) {
  const [permission,setPermission]=useState<NotificationPermission|"unsupported">(()=>typeof window!=="undefined" && "Notification" in window && "serviceWorker" in navigator && publicKey ? Notification.permission : "unsupported");
  useEffect(()=>{
    if (!enabled || permission!=="granted" || !alerts.length || publicKey) return;
    const key="talent-last-alert";
    const last=localStorage.getItem(key);
    if (last && last!==alerts[0].id) new Notification("New event staffing role",{body:"A matching job is available. Open EventRecruit to review it."});
    localStorage.setItem(key,alerts[0].id);
  },[enabled,permission,alerts,publicKey]);
  useEffect(()=>{
    if (!enabled || permission!=="granted" || !publicKey) return;
    let active=true;
    (async()=>{
      const registration=await navigator.serviceWorker.register("/talent-sw.js");
      let subscription=await registration.pushManager.getSubscription();
      if (!subscription) subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(publicKey)});
      if (active) await savePushSubscription(subscription.toJSON() as {endpoint:string;keys:{p256dh:string;auth:string}});
    })().catch(()=>{if(active)setPermission("unsupported");});
    return()=>{active=false;};
  },[enabled,permission,publicKey]);
  if (!enabled) return null;
  return <div className="mb-5 text-sm">{permission==="default"?<button className="button button-secondary" onClick={async()=>setPermission(await Notification.requestPermission())} type="button">Enable browser notifications</button>:permission==="denied"?<p>Browser notifications are blocked in your browser settings.</p>:permission==="unsupported"?<p>Browser push is unavailable until configured or supported by this browser.</p>:null}</div>;
}
