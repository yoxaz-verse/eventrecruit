import 'server-only';
import { senderAddress } from './mxroute-api';
import { getAppUrl } from '@/lib/supabase/env';

export async function sendBookingEmail(email:string, details:{eventTitle:string;date:string;start:string;end:string;token:string}) {
 const server=process.env.SMTP_HOST?.trim(), username=process.env.SMTP_AUTH_USER?.trim(), password=process.env.SMTP_AUTH_PASS, from=senderAddress(process.env.SMTP_FROM?.trim()??'');
 if (!server || !username || !password || from.toLowerCase()!==username.toLowerCase()) throw new Error('Email unavailable');
 const cancelUrl=`${getAppUrl()}/events/booking/cancel?token=${encodeURIComponent(details.token)}`;
 const escape=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
 const body=`<p>Your booking is confirmed for <strong>${escape(details.eventTitle)}</strong> on ${escape(details.date)}, ${escape(details.start)}–${escape(details.end)} India time.</p><p><a href="${escape(cancelUrl)}">Cancel this booking</a></p>`;
 const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),10000);
 try {
   const response=await fetch('https://smtpapi.mxroute.com/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({server,username,password,from,to:email,subject:`Booking confirmed: ${details.eventTitle}`,body}),signal:controller.signal,cache:'no-store'});
   const result=await response.json();
   if (!response.ok || result?.success!==true) throw new Error('Email unavailable');
 } finally {clearTimeout(timeout);}
}
