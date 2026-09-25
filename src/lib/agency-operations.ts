import { createHash, randomBytes } from "node:crypto";
import type { ApplicationStatus, OperationStatus } from "@/lib/types";

export { canTransitionApplication } from "@/lib/application-workflow";

export const applicationPipeline: ApplicationStatus[] = ["applied","shortlisted","documents_requested","under_review","approved","assigned","completed","rejected","withdrawn","no_response","cancelled","closed"];

export function normalizePhone(value: string) {
  const raw=value.trim(); if(!raw) return "";
  const digits=raw.replace(/\D/g,"");
  if(digits.length===10) return `+91${digits}`;
  if(digits.length>=8&&digits.length<=15) return `+${digits}`;
  return "";
}
export function normalizeEmail(value: string) { return value.trim().toLowerCase(); }
export function whatsappUrl(phone: string, message="") {
  const normalized=normalizePhone(phone).replace("+","");
  return normalized ? `https://wa.me/${normalized}${message?`?text=${encodeURIComponent(message)}`:""}` : null;
}
export function createShareToken() { const token=randomBytes(32).toString("base64url"); return {token,hash:hashShareToken(token)}; }
export function hashShareToken(token:string) { return createHash("sha256").update(token).digest("hex"); }
export function isActiveShare(share:{expires_at:string;revoked_at?:string|null},now=new Date()) { return !share.revoked_at && new Date(share.expires_at)>now; }

export function deriveOperationStatus(input:{publication:string;shortlisted:number;pendingClient:number;assigned:number;headcount:number;start:string;end:string;settlement?:string|null},today=new Date().toISOString().slice(0,10)):OperationStatus {
  if(input.settlement==="paid") return "closed";
  if(input.end<today) return input.settlement&&input.settlement!=="paid"?"payment_pending":"event_completed";
  if(input.start<=today&&input.end>=today&&input.assigned>0) return "event_ongoing";
  if(input.assigned>=input.headcount) return "staff_confirmed";
  if(input.pendingClient>0) return "client_approval_pending";
  if(input.shortlisted>0) return "staff_shortlisted";
  return input.publication==="published"?"staffing_in_progress":"requirement_received";
}

export const shareableFields=["photo","name","skills","experience","languages","previous_work","availability","phone","email"] as const;
export function filterSharedProfile(profile:Record<string,unknown>, fields:string[]) {
  return Object.fromEntries(shareableFields.filter(field=>fields.includes(field)&&profile[field]!==undefined).map(field=>[field,profile[field]]));
}
