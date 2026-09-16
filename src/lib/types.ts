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
  | "under_review"
  | "shortlisted"
  | "confirmed"
  | "rejected"
  | "completed"
  | "closed";

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
