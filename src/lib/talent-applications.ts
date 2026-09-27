import type { ApplicationStatus } from "@/lib/types";

export type TalentApplicationStatusMeta = {
  label: string;
  description: string;
  group: "active" | "past";
};

export const talentApplicationStatusMeta: Record<ApplicationStatus, TalentApplicationStatusMeta> = {
  applied: {
    label: "Applied",
    description: "Your application has been received and is waiting for review.",
    group: "active",
  },
  under_review: {
    label: "Under review",
    description: "The hiring team is reviewing your profile and application.",
    group: "active",
  },
  shortlisted: {
    label: "Shortlisted",
    description: "You have been shortlisted and are still being considered for this role.",
    group: "active",
  },
  documents_requested: {
    label: "Information requested",
    description: "The hiring team needs more information and may contact you with the next steps.",
    group: "active",
  },
  approved: {
    label: "Approved",
    description: "Your application is approved and is awaiting final assignment confirmation.",
    group: "active",
  },
  assigned: {
    label: "Assigned",
    description: "Your booking for this role has been confirmed.",
    group: "active",
  },
  completed: {
    label: "Completed",
    description: "This assignment has been recorded as completed.",
    group: "past",
  },
  rejected: {
    label: "Not selected",
    description: "Your application was not selected for this role.",
    group: "past",
  },
  withdrawn: {
    label: "Withdrawn",
    description: "This application has been marked as withdrawn.",
    group: "past",
  },
  no_response: {
    label: "No response",
    description: "The hiring team could not reach you, so this application is no longer active.",
    group: "past",
  },
  cancelled: {
    label: "Cancelled",
    description: "This application or assignment has been cancelled.",
    group: "past",
  },
  closed: {
    label: "Closed",
    description: "The application workflow for this role has been closed.",
    group: "past",
  },
};

export function talentApplicationGroup(status: ApplicationStatus) {
  return talentApplicationStatusMeta[status].group;
}
