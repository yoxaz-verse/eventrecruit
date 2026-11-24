import type { ResponsibilityItem, RoleCapability, UserRole } from "@/lib/types";

export type RoleDefinition = {
  label: string;
  summary: string;
  responsibilities: readonly string[];
  capabilities: readonly RoleCapability[];
};

const shared: RoleCapability[] = ["manage_profile"];

export const roleDefinitions: Record<UserRole, RoleDefinition> = {
  talent: {
    label: "Event Talent",
    summary: "Find work, keep your availability accurate, and complete confirmed assignments.",
    responsibilities: ["Maintain an accurate skills and location profile", "Respond to application and assignment updates", "Complete or cancel bookings responsibly"],
    capabilities: [...shared, "discover_opportunities", "apply_for_roles"],
  },
  organizer: {
    label: "Event Organizer",
    summary: "Plan events and coordinate workforce, volunteers, participants, and sponsors.",
    responsibilities: ["Keep company information and verification current", "Publish accurate event and workforce details", "Close event and settlement workflows"],
    capabilities: [...shared, "manage_events", "manage_workforce", "manage_sponsorships", "manage_settlements"],
  },
  agency: {
    label: "Staffing Agency",
    summary: "Manage clients, staff, assignments, operations, and payment records.",
    responsibilities: ["Protect staff and client information", "Keep candidate and operation states current", "Track fulfillment and payment completion"],
    capabilities: [...shared, "manage_clients", "manage_workforce", "manage_settlements"],
  },
  exhibitor: {
    label: "Exhibitor",
    summary: "Manage event participation, stalls, staffing requirements, and partner access.",
    responsibilities: ["Maintain accurate company and stall details", "Review staffing applicants promptly", "Control agency access to company records"],
    capabilities: [...shared, "manage_events", "manage_stalls", "manage_workforce"],
  },
  sponsor_agency: {
    label: "Sponsor Agency",
    summary: "Represent sponsor brands and manage proposals through confirmation.",
    responsibilities: ["Keep represented brand information accurate", "Respond to proposal revisions", "Maintain confirmation and payment references"],
    capabilities: [...shared, "discover_opportunities", "manage_sponsorships"],
  },
  admin: {
    label: "Administrator",
    summary: "Protect platform integrity and resolve operational review queues.",
    responsibilities: ["Review verification and moderation queues", "Record reasons for sensitive decisions", "Monitor workflows and settlement exceptions"],
    capabilities: [...shared, "manage_events", "manage_workforce", "manage_sponsorships", "manage_settlements", "moderate_platform"],
  },
};

export function hasCapability(role: UserRole, capability: RoleCapability) {
  return roleDefinitions[role].capabilities.includes(capability);
}

export function buildResponsibilityChecklist(input: {
  role: UserRole;
  verificationStatus?: string | null;
  profileComplete: boolean;
}): ResponsibilityItem[] {
  const { role, verificationStatus, profileComplete } = input;
  const base = `/dashboard/${role}`;
  const profileHref = `${base}/profile`;
  const items: ResponsibilityItem[] = [
    {
      id: "profile",
      title: "Complete your profile",
      description: "Keep the information other platform members rely on accurate and current.",
      href: profileHref,
      state: profileComplete ? "complete" : "action_required",
    },
  ];

  if (role !== "admin") {
    const verified = verificationStatus === "verified";
    items.push({
      id: "verification",
      title: verified ? "Verification complete" : "Complete verification",
      description: verified ? "Your verified status unlocks protected platform workflows." : "Some actions remain unavailable until an administrator verifies this account.",
      href: profileHref,
      state: verified ? "complete" : "blocked",
      blocker: verified ? undefined : "Awaiting platform verification",
    });
  }

  const nextActions: Record<UserRole, Omit<ResponsibilityItem, "state">> = {
    talent: { id: "work", title: "Review matching opportunities", description: "Apply only when your availability and profile are current.", href: base },
    organizer: { id: "events", title: "Review event operations", description: "Keep event, workforce, volunteer, participant, and sponsor details current.", href: base },
    agency: { id: "operations", title: "Review active operations", description: "Prioritize unfilled requirements, client decisions, and payment follow-up.", href: `${base}/operations` },
    exhibitor: { id: "requests", title: "Review staffing and event actions", description: "Resolve pending submissions, applicants, and partner access requests.", href: `${base}/requests` },
    sponsor_agency: { id: "proposals", title: "Review sponsorship proposals", description: "Respond to changes and confirm accepted agreements promptly.", href: `${base}/proposals` },
    admin: { id: "queues", title: "Review platform queues", description: "Process the oldest verification, moderation, and exception records first.", href: base },
  };
  items.push({ ...nextActions[role], state: "informational" });
  return items;
}
