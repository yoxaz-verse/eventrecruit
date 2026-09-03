export type UserRole = "admin" | "agency" | "exhibitor" | "talent";

export type VerificationStatus = "pending" | "verified" | "rejected";

export type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "accepted"
  | "rejected"
  | "completed"
  | "cancelled";

export type EventRole = {
  id: string;
  eventTitle: string;
  company: string;
  location: string;
  date: string;
  shift: string;
  role: string;
  headcount: number;
  rate: number;
  skills: string[];
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
