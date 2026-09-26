import { DualTextSpinner } from "@/components/dual-text-spinner";
import type { UserRole } from "@/lib/types";

const copy: Record<UserRole, { label: string; sublabel: string; quotes: string[] }> = {
  admin: {
    label: "Loading admin portal & records",
    sublabel: "Fetching platform accounts, verification queues, and audit records...",
    quotes: ["Platform governance and compliance oversight.", "Auditing placement records and account verification."],
  },
  agency: {
    label: "Loading agency workspace",
    sublabel: "Loading clients, staffing proposals, placements, and inquiries...",
    quotes: ["Manage clients, staffing requests, and talent rosters.", "Coordinate verified workforces from one portal."],
  },
  exhibitor: {
    label: "Loading exhibitor workspace",
    sublabel: "Loading events, staffing requests, and applicant reviews...",
    quotes: ["Find verified people for your event presence.", "Review talent profiles and placement histories."],
  },
  organizer: {
    label: "Loading organizer panel",
    sublabel: "Syncing published events, staffing requests, and participant lists...",
    quotes: ["Publish events and hire verified crews.", "Coordinate event execution across India."],
  },
  talent: {
    label: "Loading talent dashboard",
    sublabel: "Fetching applications, booked shifts, scores, and open roles...",
    quotes: ["Build a verified profile and placement history.", "Apply for verified event roles across India."],
  },
};

export function DashboardLoading({ role }: { role: UserRole }) {
  const content = copy[role];
  return <div className="flex min-h-[60vh] flex-col items-center justify-center py-12"><DualTextSpinner size="md" {...content} /></div>;
}
