import type { ApplicationStatus, VerificationStatus } from "@/lib/types";

export function StatusBadge({
  status,
  label,
}: {
  status: ApplicationStatus | VerificationStatus | string;
  label?: string;
}) {
  const className = `status-${status.replaceAll("_", "-")}`;

  return (
    <span className={`badge ${className}`}>
      {label ?? status.replaceAll("_", " ")}
    </span>
  );
}
