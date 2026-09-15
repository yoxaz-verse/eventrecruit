export const ADMIN_PAGE_SIZE = 20;
export const adminSections = ["users","organizations","events","workforce","bookings","network","reputation"] as const;
export type AdminSection = typeof adminSections[number];

export function parseAdminListParams(input: Record<string,string|string[]|undefined>) {
  const rawQuery=Array.isArray(input.q)?input.q[0]:input.q;
  const rawFilter=Array.isArray(input.status)?input.status[0]:input.status;
  const rawSort=Array.isArray(input.sort)?input.sort[0]:input.sort;
  const rawPage=Array.isArray(input.page)?input.page[0]:input.page;
  const rawView=Array.isArray(input.view)?input.view[0]:input.view;
  const parsed=Number(rawPage);
  return {
    q:String(rawQuery??"").trim().slice(0,120),
    status:/^[a-z_]{1,40}$/.test(String(rawFilter??""))?String(rawFilter):"",
    sort:rawSort==="oldest"?"oldest" as const:"newest" as const,
    page:Number.isSafeInteger(parsed)&&parsed>0?Math.min(parsed,10000):1,
    view:/^[a-z_]{1,40}$/.test(String(rawView??""))?String(rawView):"",
  };
}

export function maskPhone(value:string|null|undefined){
  if(!value)return "Not provided";
  const visible=value.replace(/\D/g,"").slice(-2);
  return `••••••${visible||"••"}`;
}
export function maskEmail(value:string|null|undefined){
  if(!value)return "Not provided";
  const at=value.indexOf("@");
  if(at<1)return "••••••";
  return `${value[0]}••••@${value.slice(at+1)}`;
}

export const adminStatusOptions:Record<string,string[]>={
  profile:["pending_verification","verified","rejected"], agency:["pending_verification","verified","rejected"], exhibitor:["pending_verification","verified","rejected"],
  event_submission:["approved","rejected"],
  organizer_event:["draft","published","cancelled"], staffing_role:["open","closed"],
  application:["applied","shortlisted","accepted","rejected","completed","cancelled"], placement:["accepted","completed","cancelled"],
  inquiry:["new","contacted","accepted","declined"], relationship:["pending","active","declined","revoked"],
  recommendation:["recommended","accepted","rejected","withdrawn"], commission:["tracked","approved","disputed","paid_offline"], review:["published","hidden"],
};

export function allowedAdminTransition(entity:string,current:string,next:string){
  if(current===next)return false;
  if(!adminStatusOptions[entity]?.includes(next))return false;
  if(entity==="application"&&["completed","cancelled"].includes(current))return false;
  if(entity==="application"&&current==="accepted"&&!['completed','cancelled'].includes(next))return false;
  if(entity==="placement"&&["completed","cancelled"].includes(current))return false;
  if(entity==="organizer_event"&&current==="cancelled")return false;
  if(entity==="staffing_role"&&current==="filled")return next==="closed";
  return true;
}
