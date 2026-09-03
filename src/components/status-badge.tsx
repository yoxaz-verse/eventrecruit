import type { ApplicationStatus, VerificationStatus } from "@/lib/types";

export function StatusBadge({
  status,
}: {
  status: ApplicationStatus | VerificationStatus | string;
}) {
  const className = `status-${status.replaceAll("_", "-")}`;

  return (
    <span className={`badge ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
