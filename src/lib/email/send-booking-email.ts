import "server-only";
import { getAppUrl } from "@/lib/supabase/env";
import { mxrouteConfigFromEnv, sendMxrouteMessage } from "./mxroute-smtp";

export async function sendBookingEmail(email:string, details:{eventTitle:string;date:string;start:string;end:string;token:string}) {
 const cancelUrl=getAppUrl()+"/events/booking/cancel?token="+encodeURIComponent(details.token);
 const escape=(value:string)=>value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]!));
 const body="<p>Your booking is confirmed for <strong>"+escape(details.eventTitle)+"</strong> on "+escape(details.date)+", "+escape(details.start)+"–"+escape(details.end)+" India time.</p><p><a href=\""+escape(cancelUrl)+"\">Cancel this booking</a></p>";
 const text="Your booking is confirmed for "+details.eventTitle+" on "+details.date+", "+details.start+"–"+details.end+" India time. Cancel: "+cancelUrl;
 await sendMxrouteMessage(mxrouteConfigFromEnv(), {
   to:email,
   subject:"Booking confirmed: "+details.eventTitle,
   text,
   html:body,
 });
}
