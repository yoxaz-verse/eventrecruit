"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { SidebarLiveWidget } from "@/components/sidebar-live-widget";
import { SidebarMiddleCard } from "@/components/sidebar-middle-card";
import { activeNavigationHref, roleNavigation } from "@/lib/navigation";
import type { UserRole } from "@/lib/types";

export function MobileDrawerContent({ role, activePath, onClose, onNavigate }: { role: UserRole; activePath: string; onClose: () => void; onNavigate: (href: string) => void }) {
  const activeHref = activeNavigationHref(activePath, roleNavigation[role]);
  return <>
    <div className="flex items-center justify-between border-b border-[var(--line)] pb-2"><div className="flex items-center gap-2"><span className="inline-block h-1 w-8 rounded-full bg-neutral-300"/><span id="dashboard-mobile-sheet-title" className="text-xs font-black uppercase tracking-wider text-[var(--accent)]">{role} menu</span></div><button onClick={onClose} className="rounded-full border border-[var(--line)] bg-[var(--surface)] p-1.5 text-[var(--muted)]" aria-label="Close menu"><X size={18}/></button></div>
    <div className="space-y-1"><p className="mb-1 px-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)]">Portal Shortcuts</p>{roleNavigation[role].map(item=>{const Icon=item.icon,isActive=item.href===activeHref;return <Link key={item.href} href={item.href} onClick={()=>onNavigate(item.href)} className={`flex items-center gap-3 rounded-xl p-3 text-xs font-extrabold ${isActive?"bg-[var(--ink)] text-white shadow-sm":"border border-[var(--line)] bg-white text-[var(--foreground)]"}`}><Icon size={18}/><span>{item.label}</span></Link>})}</div>
    <SidebarMiddleCard active={role}/>
    <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-xs"><SidebarLiveWidget/></div>
  </>;
}
