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
  UserRound,
  Search,
  Bell,
  Settings,
  ContactRound,
  FileText,
  Handshake,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group?: string;
};

export const roleNavigation: Record<UserRole, NavigationItem[]> = {
  organizer: [
    { href: "/dashboard/organizer", label: "Overview", icon: Building2 },
    { href: "/dashboard/organizer/events/new", label: "Create event", icon: CalendarDays },
    { href: "/dashboard/organizer/company", label: "Company profile", icon: Building2 },
    { href: "/dashboard/organizer/profile", label: "Profile", icon: UserRound },
    { href: "/dashboard/organizer/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Overview", icon: ShieldCheck },
    { href: "/dashboard/admin/users", label: "Users", icon: Users },
    { href: "/dashboard/admin/organizations", label: "Organizations", icon: Building2 },
    { href: "/dashboard/admin/events", label: "Events", icon: CalendarDays },
    { href: "/dashboard/admin/workforce", label: "Workforce", icon: UserCheck },
    { href: "/dashboard/admin/bookings", label: "Bookings", icon: BookOpenCheck },
    { href: "/dashboard/admin/network", label: "Network", icon: BadgeIndianRupee },
    { href: "/dashboard/admin/settlements", label: "Settlements", icon: BadgeIndianRupee },
    { href: "/dashboard/admin/verifications", label: "Verifications", icon: ShieldCheck },
    { href: "/dashboard/admin/reputation", label: "Reputation", icon: Star },
    { href: "/dashboard/admin/profile", label: "Profile", icon: UserRound },
    { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
  ],
  agency: [
    { href: "/dashboard/agency", label: "Dashboard", icon: Users, group:"Workspace" },
    { href: "/dashboard/agency/search", label: "Global search", icon: Search, group:"Workspace" },
    { href: "/dashboard/agency/staff", label: "Staff", icon: Users, group:"People" },
    { href: "/dashboard/agency/clients", label: "Clients", icon: Building2, group:"People" },
    { href: "/dashboard/agency/partners", label: "Recruitment partners", icon: Handshake, group:"People" },
    { href: "/dashboard/agency/events", label: "Events", icon: CalendarDays, group:"Delivery" },
    { href: "/dashboard/agency/requests", label: "Staff calls", icon: ClipboardList, group:"Delivery" },
    { href: "/dashboard/agency/applicants", label: "Applications", icon: UserCheck, group:"Delivery" },
    { href: "/dashboard/agency/operations", label: "Current operations", icon: Briefcase, group:"Operations" },
    { href: "/dashboard/agency/payments", label: "Payments", icon: BadgeIndianRupee, group:"Operations" },
    { href: "/dashboard/agency/documents", label: "Documents", icon: FileText, group:"Operations" },
    { href: "/dashboard/agency/notifications", label: "Notifications", icon: Bell, group:"Account" },
    { href: "/dashboard/agency/profile", label: "Profile", icon: UserRound, group:"Account" },
    { href: "/dashboard/agency/settings", label: "Settings", icon: Settings, group:"Account" },
  ],
  exhibitor: [
    { href: "/dashboard/exhibitor", label: "Overview", icon: Building2 },
    { href: "/dashboard/exhibitor/profile", label: "Profile", icon: ContactRound },
    { href: "/dashboard/exhibitor/events", label: "My events", icon: CalendarDays },
    { href: "/dashboard/exhibitor/space-inquiries", label: "Space inquiries", icon: ClipboardList },
    { href: "/dashboard/exhibitor/requests", label: "Staff requests", icon: ClipboardList },
    { href: "/dashboard/exhibitor/applicants", label: "Applicants", icon: UserCheck },
    { href: "/dashboard/exhibitor/reputation", label: "Reputation", icon: Star },
    { href: "/dashboard/exhibitor/agencies", label: "Agency access", icon: Users },
    { href: "/dashboard/exhibitor/settings", label: "Settings", icon: Settings },
  ],
  talent: [
    { href: "/dashboard/talent", label: "Opportunities", icon: Sparkles },
    { href: "/dashboard/talent/profile", label: "My profile", icon: UserRound },
    { href: "/dashboard/talent/settings", label: "Settings", icon: Settings },
  ],
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
