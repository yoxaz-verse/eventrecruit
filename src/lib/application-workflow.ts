import type { ApplicationStatus } from "@/lib/types";

export type ApplicationStatusMeta = {
  label: string;
  actionLabel: string;
  description: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
};

export const applicationStatusMeta: Record<ApplicationStatus, ApplicationStatusMeta> = {
  applied: { label: "Applied", actionLabel: "Mark as applied", description: "New application awaiting your review.", tone: "neutral" },
  under_review: { label: "Under review", actionLabel: "Start review", description: "Review the profile, experience, and availability.", tone: "info" },
  shortlisted: { label: "Shortlisted", actionLabel: "Shortlist applicant", description: "Keep this applicant in consideration for the role.", tone: "warning" },
  documents_requested: { label: "Documents requested", actionLabel: "Request documents", description: "Wait for the applicant to provide required information.", tone: "warning" },
  approved: { label: "Approved", actionLabel: "Approve applicant", description: "Approve this applicant before confirming the booking.", tone: "success" },
  assigned: { label: "Assigned", actionLabel: "Confirm assignment", description: "Confirm this applicant for the staffing role.", tone: "success" },
  completed: { label: "Completed", actionLabel: "Mark completed", description: "Record that the assigned work has been completed.", tone: "success" },
  rejected: { label: "Rejected", actionLabel: "Reject application", description: "Remove this applicant from consideration.", tone: "danger" },
  withdrawn: { label: "Withdrawn", actionLabel: "Mark withdrawn", description: "Record that the applicant withdrew their application.", tone: "danger" },
  no_response: { label: "No response", actionLabel: "Mark no response", description: "Record that the applicant could not be reached.", tone: "danger" },
  cancelled: { label: "Cancelled", actionLabel: "Cancel application", description: "Cancel this application or confirmed assignment.", tone: "danger" },
  closed: { label: "Closed", actionLabel: "Close application", description: "Close and archive this application workflow.", tone: "neutral" },
};

const transitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  applied: ["under_review", "shortlisted", "rejected", "withdrawn", "no_response", "cancelled"],
  under_review: ["shortlisted", "documents_requested", "approved", "rejected", "withdrawn", "no_response", "cancelled"],
  shortlisted: ["documents_requested", "under_review", "approved", "rejected", "withdrawn", "no_response", "cancelled"],
  documents_requested: ["under_review", "approved", "rejected", "withdrawn", "no_response", "cancelled"],
  approved: ["assigned", "rejected", "withdrawn", "cancelled"],
  assigned: ["completed", "cancelled", "closed"],
  completed: ["closed"],
  rejected: [],
  withdrawn: [],
  no_response: [],
  cancelled: [],
  closed: [],
};

const confirmationStatuses = new Set<ApplicationStatus>(["rejected", "withdrawn", "no_response", "cancelled", "closed"]);

export function allowedApplicationTransitions(status: ApplicationStatus) {
  return transitions[status] ?? [];
}

export function canTransitionApplication(from: ApplicationStatus, to: ApplicationStatus) {
  return from === to || allowedApplicationTransitions(from).includes(to);
}

export function applicationStatusNeedsConfirmation(status: ApplicationStatus) {
  return confirmationStatuses.has(status);
}
