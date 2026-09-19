import { Search } from "lucide-react";
export function AgencyGlobalSearch(){return <form action="/dashboard/agency/search" className="mb-6"><label className="input-icon-wrap max-w-2xl"><Search size={18}/><span className="sr-only">Search the agency portal</span><input className="input" name="q" type="search" placeholder="Search staff, clients, events, recruiters, phone or email"/></label></form>}
