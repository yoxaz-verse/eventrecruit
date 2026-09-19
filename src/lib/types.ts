export type UserRole = "organizer" | "admin" | "agency" | "exhibitor" | "talent";

export type ExhibitorKind = "platform" | "external";
export type AgencyExhibitorRelationshipStatus = "pending" | "active" | "declined" | "revoked";
export type SelectedClientContext = {
  exhibitorId: string;
  companyName: string;
  kind: ExhibitorKind;
  agencyId?: string;
  agencyName?: string;
};
export type ActorPrincipalAttribution = { actorId: string; exhibitorId: string };

export type VerificationStatus = "pending" | "verified" | "rejected";

export type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "documents_requested"
  | "under_review"
  | "approved"
  | "assigned"
  | "rejected"
  | "withdrawn"
  | "no_response"
  | "cancelled"
  | "completed"
  | "closed";

export type StaffAvailabilityStatus = "available" | "partially_available" | "unavailable";
export type StaffAssignmentStatus = "unassigned" | "assigned" | "on_assignment" | "inactive";
export type OperationStatus = "requirement_received" | "staffing_in_progress" | "staff_shortlisted" | "client_approval_pending" | "staff_confirmed" | "event_ongoing" | "event_completed" | "payment_pending" | "closed";
export type DocumentRequestType = "profile_photo" | "full_length_photo" | "id_proof" | "skill_certificate" | "experience_proof" | "contact_information" | "skill_details" | "previous_work" | "introduction" | "other_document";
export type ContactImportStatus = "preview" | "awaiting_resolution" | "committed" | "failed" | "cancelled";
export type DuplicateResolution = "merge" | "keep_separate" | "skip";
export type ClientReviewStatus = "pending_review" | "approved" | "rejected" | "replacement_requested";
export type InformationVisibility = "internal" | "staff" | "client_shareable";

export type EventLifecycleStatus = "draft" | "submitted" | "published" | "cancelled";
export type RateMode = "fixed" | "range" | "negotiable";
export type VerificationRequestStatus = "pending" | "verified" | "rejected" | "cancelled";
export type SettlementStatus = "pending" | "sent" | "received" | "processing" | "partially_paid" | "paid" | "failed" | "refunded";
export type PayoutRecipientType = "agency" | "talent";

export type EventRole = {
  id: string;
  eventTitle: string;
  company?: string;
  location: string;
  date: string;
  shift: string;
  role: string;
  description?: string;
  headcount: number;
  rate: number;
  skills: string[];
  preferredSkills?: string[];
  languages?: string[];
  applicationStatus?: ApplicationStatus;
  mapUrl?: string;
  status: "open" | "filled" | "closed";
  agency?: string;
};

export type Applicant = {
  id: string;
  applicationId: string;
  talentId: string;
  name: string;
  role: string;
  rating: number;
  reliability: number;
  completed: number;
  languages: string[];
  status: ApplicationStatus;
};

export type PrivateContactPreview = {
  profileId: string;
  name: string;
  role: UserRole;
  city: string;
  phone: string;
  alternateEmail: string;
};

export type Reputation = {
  profileId: string;
  displayName: string;
  role: "talent" | "exhibitor";
  trustScore: number;
  averageRating: number;
  reliabilityScore: number;
  communicationScore: number;
  professionalismScore: number;
  completedCount: number;
  cancellations: number;
  disputes: number;
};

export type Testimonial = {
  id: string;
  reviewerName: string;
  reviewerRole: "talent" | "exhibitor";
  revieweeName: string;
  rating: number;
  communication: number;
  professionalism: number;
  reliability: number;
  text: string;
  status: "published" | "hidden";
  placement: string;
};
