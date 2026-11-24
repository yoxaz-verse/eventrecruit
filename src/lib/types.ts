export type UserRole = "organizer" | "admin" | "agency" | "sponsor_agency" | "exhibitor" | "talent";

export type RoleCapability =
  | "manage_profile"
  | "discover_opportunities"
  | "apply_for_roles"
  | "manage_events"
  | "manage_workforce"
  | "manage_clients"
  | "manage_stalls"
  | "manage_sponsorships"
  | "manage_settlements"
  | "moderate_platform";

export type ResponsibilityState = "complete" | "action_required" | "blocked" | "informational";

export type ResponsibilityItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  state: ResponsibilityState;
  blocker?: string;
};

export type PlatformNotificationCategory =
  | "account"
  | "verification"
  | "application"
  | "assignment"
  | "event"
  | "staffing"
  | "sponsorship"
  | "settlement"
  | "system";

export type PlatformNotification = {
  id: string;
  category: PlatformNotificationCategory;
  title: string;
  body: string;
  actionHref: string | null;
  readAt: string | null;
  createdAt: string;
};

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
export type OpportunityType = "paid" | "volunteer";
export type SponsorshipContributionKind = "cash" | "in_kind" | "cash_and_in_kind";
export type SponsorshipProposalStatus = "draft" | "submitted" | "under_review" | "changes_requested" | "organizer_accepted" | "confirmed" | "declined" | "withdrawn" | "cancelled";
export type SponsorVerificationStatus = "pending_verification" | "verified" | "rejected";
export type EventSponsorStatus = "active" | "cancelled";
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
  opportunityType?: OpportunityType;
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
