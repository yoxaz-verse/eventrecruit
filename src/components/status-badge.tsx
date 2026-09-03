import type { ApplicationStatus, VerificationStatus } from "@/lib/types";

const colors: Record<string, string> = {
  verified: "border-teal-200 bg-teal-50 text-teal-800",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  pending_verification: "border-amber-200 bg-amber-50 text-amber-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
  applied: "border-slate-200 bg-slate-50 text-slate-700",
  shortlisted: "border-blue-200 bg-blue-50 text-blue-800",
  accepted: "border-teal-200 bg-teal-50 text-teal-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-red-200 bg-red-50 text-red-800",
};

export function StatusBadge({
  status,
}: {
  status: ApplicationStatus | VerificationStatus | string;
}) {
  return (
    <span className={`badge ${colors[status] ?? ""}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
