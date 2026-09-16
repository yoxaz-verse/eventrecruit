import { DualTextSpinner } from "@/components/dual-text-spinner";
import { DashboardShell } from "@/components/dashboard-shell";

export default function DashboardLoading() {
  return (
    <DashboardShell active="organizer">
      <div className="py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <DualTextSpinner
          size="md"
          label="Preparing workspace dashboard"
          sublabel="Syncing event schedules, staffing requests, applicant lists, and placement status..."
          quotes={[
            "Real-time event talent ops at your fingertips.",
            "Verified credentials, identity checks & placement history.",
            "End-to-end workflow from request creation to shift execution.",
          ]}
        />
      </div>
    </DashboardShell>
  );
}
