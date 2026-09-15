import {
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  BadgeIndianRupee,
  BookOpenCheck,
  Globe,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const roleNavigation: Record<UserRole, NavigationItem[]> = {
  organizer: [
    { href: "/dashboard/organizer", label: "Overview", icon: Building2 },
    { href: "/dashboard/organizer/events/new", label: "Create event", icon: CalendarDays },
    { href: "/dashboard/organizer/company", label: "Company profile", icon: Building2 },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Overview", icon: ShieldCheck },
    { href: "/dashboard/admin/users", label: "Users", icon: Users },
    { href: "/dashboard/admin/organizations", label: "Organizations", icon: Building2 },
    { href: "/dashboard/admin/events", label: "Events", icon: CalendarDays },
    { href: "/dashboard/admin/workforce", label: "Workforce", icon: UserCheck },
    { href: "/dashboard/admin/bookings", label: "Bookings", icon: BookOpenCheck },
    { href: "/dashboard/admin/network", label: "Network", icon: BadgeIndianRupee },
    { href: "/dashboard/admin/reputation", label: "Reputation", icon: Star },
  ],
  agency: [
    { href: "/dashboard/agency", label: "Overview", icon: Users },
    { href: "/dashboard/agency/clients", label: "Clients", icon: Building2 },
    { href: "/dashboard/agency/events", label: "Events", icon: CalendarDays },
    { href: "/dashboard/agency/space-inquiries", label: "Space inquiries", icon: ClipboardList },
    { href: "/dashboard/agency/requests", label: "Staff requests", icon: ClipboardList },
    { href: "/dashboard/agency/applicants", label: "Applicants", icon: UserCheck },
    { href: "/dashboard/agency/reputation", label: "Reputation", icon: Star },
  ],
  exhibitor: [
    { href: "/dashboard/exhibitor", label: "Overview", icon: Building2 },
    { href: "/dashboard/exhibitor/events", label: "My events", icon: CalendarDays },
    { href: "/dashboard/exhibitor/space-inquiries", label: "Space inquiries", icon: ClipboardList },
    { href: "/dashboard/exhibitor/requests", label: "Staff requests", icon: ClipboardList },
    { href: "/dashboard/exhibitor/applicants", label: "Applicants", icon: UserCheck },
    { href: "/dashboard/exhibitor/reputation", label: "Reputation", icon: Star },
    { href: "/dashboard/exhibitor/agencies", label: "Agency access", icon: Users },
  ],
  talent: [{ href: "/dashboard/talent", label: "Overview", icon: Sparkles }],
};

export const exploreNavigation: NavigationItem[] = [
  { href: "/browse", label: "Browse open roles", icon: Briefcase },
  { href: "/events", label: "Public events", icon: Globe },
];

export function isNavigationItemActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export function activeNavigationHref(pathname: string, items: NavigationItem[]) {
  return items
    .filter((item) => isNavigationItemActive(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}
